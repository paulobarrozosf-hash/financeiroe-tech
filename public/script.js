document.addEventListener('DOMContentLoaded', () => {
    // --- Configurações ---
    // ATENÇÃO: Substitua esta URL pela URL do seu Cloudflare Worker.
    // Exemplo: "https://seu-worker.seu-usuario.workers.dev/api"
    // Ou se você configurou uma rota personalizada, como "https://pagamentos.paulo-barrozosf.workers.dev/pagamentos"
    const WORKER_BASE_URL = "https://pagamentos.paulo-barrozosf.workers.dev"; // Ajuste conforme a URL do seu Worker

    // --- Elementos do DOM ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Detalhado
    const dateInputStartDetalhado = document.getElementById('dateInputStartDetalhado');
    const dateInputEndDetalhado = document.getElementById('dateInputEndDetalhado');
    const fetchDetalhadoButton = document.getElementById('fetchDetalhadoButton');
    const detalhadoTableBody = document.querySelector('#detalhadoTable tbody');
    const detalhadoMessage = document.getElementById('detalhadoMessage');

    // Transferências
    const dateInputStartTransferencias = document.getElementById('dateInputStartTransferencias');
    const dateInputEndTransferencias = document.getElementById('dateInputEndTransferencias');
    const fetchTransferenciasButton = document.getElementById('fetchTransferenciasButton');
    const transferTableBody = document.querySelector('#transferTable tbody');
    const transferPanel = document.getElementById('transferPanel');
    const transferenciasMessage = document.getElementById('transferenciasMessage');

    // Dashboard
    const dateInputStartDashboard = document.getElementById('dateInputStartDashboard');
    const dateInputEndDashboard = document.getElementById('dateInputEndDashboard');
    const fetchDashboardButton = document.getElementById('fetchDashboardButton');
    const summaryCardsContainer = document.getElementById('summaryCards');
    const dashboardDailyTableBody = document.querySelector('#dashboardDailyTable tbody');
    const dashboardPlanTableBody = document.querySelector('#dashboardPlanTable tbody');
    const dashboardMessage = document.getElementById('dashboardMessage');

    // --- Funções Auxiliares ---
    function showMessage(element, msg, type = 'info') {
        element.textContent = msg;
        element.className = `message ${type}-message`;
        element.style.display = 'block';
    }

    function hideMessage(element) {
        element.style.display = 'none';
    }

    function clearTable(tableBody) {
        tableBody.innerHTML = '';
    }

    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    // Define as datas padrão para o mês atual
    function setDefaultDates() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const formattedFirstDay = formatDate(firstDayOfMonth);
        const formattedLastDay = formatDate(lastDayOfMonth);

        dateInputStartDetalhado.value = formattedFirstDay;
        dateInputEndDetalhado.value = formattedLastDay;
        dateInputStartTransferencias.value = formattedFirstDay;
        dateInputEndTransferencias.value = formattedLastDay;
        dateInputStartDashboard.value = formattedFirstDay;
        dateInputEndDashboard.value = formattedLastDay;
    }

    // --- Lógica de Abas ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            // Carrega os dados da aba ativa automaticamente
            if (targetTab === 'detalhado') {
                fetchReportData();
            } else if (targetTab === 'transferencias') {
                fetchTransferData();
            } else if (targetTab === 'dashboard') {
                fetchDashboardData();
            }
        });
    });

    // --- Funções de Fetch de Dados ---
    async function fetchAllFinancialData(reportType, dataInicio, dataFim) {
        let endpoint = '';
        if (reportType === 'detalhado') {
            endpoint = '/api/daily-billing';
        } else if (reportType === 'dashboard') {
            endpoint = '/api/dashboard';
        } else if (reportType === 'transferencias') {
            endpoint = '/api/transfers';
        } else {
            throw new Error('Tipo de relatório desconhecido.');
        }

        const url = `${WORKER_BASE_URL}${endpoint}?dataInicio=${dataInicio}&dataFim=${dataFim}`;
        console.log(`Fetching from: ${url}`); // Para depuração

        const messageElement = reportType === 'detalhado' ? detalhadoMessage :
                               reportType === 'transferencias' ? transferenciasMessage :
                               dashboardMessage;

        showMessage(messageElement, 'Carregando dados...', 'loading');

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro HTTP: ${response.status}`);
            }

            hideMessage(messageElement);
            return data;
        } catch (error) {
            console.error(`Erro ao buscar dados para ${reportType}:`, error);
            showMessage(messageElement, `Erro: ${error.message}`, 'error');
            return null;
        }
    }

    // --- Renderização de Relatórios ---

    // Faturamento Diário Detalhado
    async function fetchReportData() {
        const dataInicio = dateInputStartDetalhado.value;
        const dataFim = dateInputEndDetalhado.value;

        if (!dataInicio || !dataFim) {
            showMessage(detalhadoMessage, 'Por favor, selecione as datas de início e fim.', 'error');
            return;
        }

        clearTable(detalhadoTableBody);
        const result = await fetchAllFinancialData('detalhado', dataInicio, dataFim);

        if (result && result.detalhado && result.detalhado.reportLines) {
            result.detalhado.reportLines.forEach(item => {
                const row = detalhadoTableBody.insertRow();
                row.insertCell().textContent = item.dataPagamento;
                row.insertCell().textContent = item.contratoId;
                row.insertCell().textContent = item.cliente;
                row.insertCell().textContent = item.cpfcnpj;
                row.insertCell().textContent = item.plano;
                row.insertCell().textContent = formatCurrency(item.valorPlanoRef);
                row.insertCell().textContent = formatCurrency(item.valorBoleto);
                row.insertCell().textContent = formatCurrency(item.valorPago);
                row.insertCell().textContent = item.portador;
                row.insertCell().textContent = item.endereco;
                row.insertCell().textContent = item.cidade;
                row.insertCell().textContent = item.uf;
                row.insertCell().textContent = formatCurrency(item.valorSCM);
                row.insertCell().textContent = formatCurrency(item.valorSCI);
                row.insertCell().textContent = formatCurrency(item.valorSVA);
                row.insertCell().textContent = item.formaPagamento;
                row.insertCell().textContent = item.tituloId;
                row.insertCell().textContent = item.nossoNumero;
                row.insertCell().textContent = item.numeroDocumento;
            });
            showMessage(detalhadoMessage, `Relatório de Faturamento Diário gerado para o período de ${dataInicio} a ${dataFim}. Total de ${result.detalhado.reportLines.length} registros.`, 'info');
        } else if (result) {
             showMessage(detalhadoMessage, 'Nenhum dado encontrado para o período selecionado.', 'info');
        }
    }

    // Relatório de Transferências
    async function fetchTransferData() {
        const dataInicio = dateInputStartTransferencias.value;
        const dataFim = dateInputEndTransferencias.value;

        if (!dataInicio || !dataFim) {
            showMessage(transferenciasMessage, 'Por favor, selecione as datas de início e fim.', 'error');
            return;
        }

        clearTable(transferTableBody);
        transferPanel.innerHTML = '<h3 class="transfer-panel-title">Resumo de Transferências</h3>'; // Limpa o painel
        const result = await fetchAllFinancialData('transferencias', dataInicio, dataFim);

        if (result && result.transferencias) {
            // Preenche a tabela
            if (result.transferencias.transferLines && result.transferencias.transferLines.length > 0) {
                result.transferencias.transferLines.forEach(item => {
                    const row = transferTableBody.insertRow();
                    row.insertCell().textContent = item.data;
                    row.insertCell().textContent = formatCurrency(item.totalRecebido);
                    row.insertCell().textContent = formatCurrency(item.totalSCM);
                    row.insertCell().textContent = formatCurrency(item.totalSCI);
                    row.insertCell().textContent = formatCurrency(item.totalSVA);
                    row.insertCell().textContent = `${(item.percentSCM * 100).toFixed(2)}%`;
                    row.insertCell().textContent = `${(item.percentSCI * 100).toFixed(2)}%`;
                    row.insertCell().textContent = `${(item.percentSVA * 100).toFixed(2)}%`;
                    row.insertCell().textContent = formatCurrency(item.valorSCM);
                    row.insertCell().textContent = formatCurrency(item.valorSCI);
                    row.insertCell().textContent = formatCurrency(item.valorSVA);
                });
            } else {
                showMessage(transferenciasMessage, 'Nenhum dado de transferência encontrado para o período selecionado.', 'info');
            }

            // Preenche o painel de resumo
            if (result.transferencias.transferPanelLines && result.transferencias.transferPanelLines.length > 0) {
                result.transferencias.transferPanelLines.forEach(item => {
                    const panelItem = document.createElement('div');
                    panelItem.className = 'transfer-panel-item';
                    panelItem.innerHTML = `
                        <div class="transfer-panel-date">${item.data}</div>
                        <div class="transfer-panel-scm">SCM: ${formatCurrency(item.totalSCM)} (${(item.percentSCM * 100).toFixed(2)}%)</div>
                        <div class="transfer-panel-sva">SVA: ${formatCurrency(item.totalSVA)} (${(item.percentSVA * 100).toFixed(2)}%)</div>
                    `;
                    transferPanel.appendChild(panelItem);
                });
            }
            showMessage(transferenciasMessage, `Relatório de Transferências gerado para o período de ${dataInicio} a ${dataFim}.`, 'info');
        } else if (result) {
            showMessage(transferenciasMessage, 'Nenhum dado encontrado para o período selecionado.', 'info');
        }
    }

    // Dashboard
    async function fetchDashboardData() {
        const dataInicio = dateInputStartDashboard.value;
        const dataFim = dateInputEndDashboard.value;

        if (!dataInicio || !dataFim) {
            showMessage(dashboardMessage, 'Por favor, selecione as datas de início e fim.', 'error');
            return;
        }

        summaryCardsContainer.innerHTML = ''; // Limpa os cards
        clearTable(dashboardDailyTableBody);
        clearTable(dashboardPlanTableBody);

        const result = await fetchAllFinancialData('dashboard', dataInicio, dataFim);

        if (result && result.dashboard) {
            // Preenche os cards de resumo
            if (result.dashboard.summaryCards && result.dashboard.summaryCards.length > 0) {
                result.dashboard.summaryCards.forEach(cardData => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `<h3>${cardData.title}</h3><p>${cardData.value}</p>`;
                    summaryCardsContainer.appendChild(card);
                });
            }

            // Preenche a tabela de faturamento diário
            if (result.dashboard.dailySummary && result.dashboard.dailySummary.length > 0) {
                result.dashboard.dailySummary.forEach(item => {
                    const row = dashboardDailyTableBody.insertRow();
                    row.insertCell().textContent = item.data;
                    row.insertCell().textContent = formatCurrency(item.totalRecebido);
                    row.insertCell().textContent = item.totalPagamentos;
                    row.insertCell().textContent = formatCurrency(item.ticketMedio);
                });
            }

            // Preenche a tabela de faturamento por plano
            if (result.dashboard.planSummary && result.dashboard.planSummary.length > 0) {
                result.dashboard.planSummary.forEach(item => {
                    const row = dashboardPlanTableBody.insertRow();
                    row.insertCell().textContent = item.plano;
                    row.insertCell().textContent = item.pagamentos;
                    row.insertCell().textContent = formatCurrency(item.totalRecebido);
                    row.insertCell().textContent = formatCurrency(item.ticketMedio);
                });
            }
            showMessage(dashboardMessage, `Dashboard gerado para o período de ${dataInicio} a ${dataFim}.`, 'info');
        } else if (result) {
            showMessage(dashboardMessage, 'Nenhum dado encontrado para o período selecionado.', 'info');
        }
    }

    // --- Event Listeners ---
    fetchDetalhadoButton.addEventListener('click', fetchReportData);
    fetchTransferenciasButton.addEventListener('click', fetchTransferData);
    fetchDashboardButton.addEventListener('click', fetchDashboardData);

    // Inicialização
    setDefaultDates();
    // Carrega o relatório detalhado ao iniciar a página
    fetchReportData();
});
