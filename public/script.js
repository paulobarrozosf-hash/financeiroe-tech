// script.js - Código para o Frontend

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuração da API do Cloudflare Worker ---
    // Substitua esta URL pela URL BASE REAL do seu Cloudflare Worker!
    // Exemplo: 'https://pagamentos.paulo-barrozosf.workers.dev'
    const WORKER_BASE_URL = 'https://pagamentos.paulo-barrozosf.workers.dev'; 
    const WORKER_DATA_ENDPOINT = `${WORKER_BASE_URL}/dados-financeiros-periodo`;

    // --- Seletores de Elementos do DOM ---
    // Navegação
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Relatório Detalhado
    const dateInputStartDetalhado = document.getElementById('dataInicioDetalhado');
    const dateInputEndDetalhado = document.getElementById('dataFimDetalhado');
    const fetchReportButton = document.getElementById('fetchReportButton');
    const financialReportTableHead = document.querySelector('#financialReportTable thead tr');
    const financialReportTableBody = document.querySelector('#financialReportTable tbody');
    const loadingDetalhadoDiv = document.getElementById('loading-detalhado');
    const errorDetalhadoDiv = document.getElementById('error-detalhado');
    const noDataDetalhadoDiv = document.getElementById('no-data-detalhado');

    // Dashboard
    const dateInputStartDashboard = document.getElementById('dataInicioDashboard');
    const dateInputEndDashboard = document.getElementById('dataFimDashboard');
    const fetchDashboardButton = document.getElementById('fetchDashboardButton');
    const dashboardCardsContainer = document.querySelector('.dashboard-cards');
    const dailyTicketTableBody = document.querySelector('#dailyTicketTable tbody');
    const planTicketTableBody = document.querySelector('#planTicketTable tbody');
    const loadingDashboardDiv = document.getElementById('loading-dashboard');
    const errorDashboardDiv = document.getElementById('error-dashboard');
    const noDataDashboardDiv = document.getElementById('no-data-dashboard');

    // Transferências
    const dateInputStartTransfer = document.getElementById('dataInicioTransfer');
    const dateInputEndTransfer = document.getElementById('dataFimTransfer');
    const fetchTransferButton = document.getElementById('fetchTransferButton');
    const transferTableBody = document.querySelector('#transferTable tbody');
    const transferPanel = document.getElementById('transferPanel');
    const loadingTransferenciasDiv = document.getElementById('loading-transferencias');
    const errorTransferenciasDiv = document.getElementById('error-transferencias');
    const noDataTransferenciasDiv = document.getElementById('no-data-transferencias');

    // --- Funções Auxiliares ---

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function showStatusMessage(tabPrefix, type, message = '') {
        const loadingDiv = document.getElementById(`loading-${tabPrefix}`);
        const errorDiv = document.getElementById(`error-${tabPrefix}`);
        const noDataDiv = document.getElementById(`no-data-${tabPrefix}`);

        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        noDataDiv.style.display = 'none';

        if (type === 'loading') {
            loadingDiv.style.display = 'block';
        } else if (type === 'error') {
            errorDiv.textContent = `Erro: ${message}`;
            errorDiv.style.display = 'block';
        } else if (type === 'no-data') {
            noDataDiv.style.display = 'block';
        }
    }

    function setInitialDates(startDateInput, endDateInput) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        endDateInput.valueAsDate = today;
        startDateInput.valueAsDate = firstDayOfMonth;
    }

    // --- Lógica de Navegação das Abas ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });

            // Carrega os dados da aba ativa automaticamente
            if (targetTab === 'relatorio-detalhado') {
                fetchReportData();
            } else if (targetTab === 'dashboard') {
                fetchDashboardData();
            } else if (targetTab === 'transferencias') {
                fetchTransferData();
            }
        });
    });

    // --- Função Centralizada para Buscar Dados do Worker ---
    async function fetchAllFinancialData(tabPrefix, dataInicio, dataFim) {
        showStatusMessage(tabPrefix, 'loading');

        if (!dataInicio || !dataFim) {
            showStatusMessage(tabPrefix, 'error', 'Por favor, selecione as datas de início e fim.');
            return null;
        }

        try {
            const url = new URL(WORKER_DATA_ENDPOINT);
            url.searchParams.append('data_inicio', dataInicio);
            url.searchParams.append('data_fim', dataFim);

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            showStatusMessage(tabPrefix, 'none'); // Esconde mensagens de status
            return data;

        } catch (error) {
            console.error(`Erro ao carregar dados para ${tabPrefix}:`, error);
            showStatusMessage(tabPrefix, 'error', error.message);
            return null;
        }
    }

    // --- Funções para Renderizar Dados em Cada Aba ---

    async function fetchReportData() {
        financialReportTableHead.innerHTML = '';
        financialReportTableBody.innerHTML = '';

        const dataInicio = dateInputStartDetalhado.value;
        const dataFim = dateInputEndDetalhado.value;

        const allData = await fetchAllFinancialData('detalhado', dataInicio, dataFim);
        if (allData && allData.pagamentosDetalhes) {
            renderDetalhado(allData.pagamentosDetalhes);
        } else if (!allData || allData.pagamentosDetalhes.length === 0) {
            showStatusMessage('detalhado', 'no-data');
        }
    }

    function renderDetalhado(data) {
        if (!data || data.length === 0) {
            showStatusMessage('detalhado', 'no-data');
            return;
        }

        // Cabeçalhos da tabela (ajustados para os campos do Worker)
        const headers = [
            "Data Pagamento", "Cliente", "Contrato ID", "Plano", "Portador",
            "Forma Pagamento", "Valor Boleto", "Valor Pago",
            "Valor SCM (R$)", "Valor SCI (R$)", "Valor SVA (R$)",
            "Título", "Chave Única"
        ];
        financialReportTableHead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');

        // Preencher corpo da tabela
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.dataPagamento}</td>
                <td>${item.cliente}</td>
                <td>${item.contratoID}</td>
                <td>${item.plano}</td>
                <td>${item.portador}</td>
                <td>${item.formaPagamento}</td>
                <td style="text-align: right;">${formatCurrency(item.valorBoleto)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorPago)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSCM)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSCI)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSVA)}</td>
                <td>${item.titulo}</td>
                <td>${item.chaveUnica}</td>
            `;
            financialReportTableBody.appendChild(tr);
        });
        showStatusMessage('detalhado', 'none');
    }

    async function fetchDashboardData() {
        dashboardCardsContainer.innerHTML = '';
        dailyTicketTableBody.innerHTML = '';
        planTicketTableBody.innerHTML = '';

        const dataInicio = dateInputStartDashboard.value;
        const dataFim = dateInputEndDashboard.value;

        const allData = await fetchAllFinancialData('dashboard', dataInicio, dataFim);
        if (allData && allData.dashboard) {
            renderDashboard(allData.dashboard);
        } else if (!allData || allData.dashboard.daily.length === 0) { // Verifica se há dados diários
            showStatusMessage('dashboard', 'no-data');
        }
    }

    function renderDashboard(data) {
        if (!data || data.daily.length === 0) {
            showStatusMessage('dashboard', 'no-data');
            return;
        }

        // Renderizar Cards de Resumo
        dashboardCardsContainer.innerHTML = `
            <div class="card">
                <h3>Total Recebido</h3>
                <p>${formatCurrency(data.summary.totalRecebido)}</p>
            </div>
            <div class="card">
                <h3>Total Pagamentos</h3>
                <p>${data.summary.totalPagamentos}</p>
            </div>
            <div class="card">
                <h3>Ticket Médio</h3>
                <p>${formatCurrency(data.summary.ticketGeral)}</p>
            </div>
            <div class="card">
                <h3>Registros Únicos</h3>
                <p>${data.summary.registrosUnicos}</p>
            </div>
        `;

        // Renderizar Ticket Médio por Dia
        data.daily.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.dia}</td>
                <td>${item.pagamentos}</td>
                <td style="text-align: right;">${formatCurrency(item.totalRecebido)}</td>
                <td style="text-align: right;">${formatCurrency(item.ticketMedio)}</td>
            `;
            dailyTicketTableBody.appendChild(tr);
        });

        // Renderizar Ticket Médio por Plano
        data.byPlan.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.plano}</td>
                <td>${item.pagamentos}</td>
                <td style="text-align: right;">${formatCurrency(item.totalRecebido)}</td>
                <td style="text-align: right;">${formatCurrency(item.ticketMedio)}</td>
            `;
            planTicketTableBody.appendChild(tr);
        });
        showStatusMessage('dashboard', 'none');
    }

    async function fetchTransferData() {
        transferTableBody.innerHTML = '';
        transferPanel.innerHTML = '';

        const dataInicio = dateInputStartTransfer.value;
        const dataFim = dateInputEndTransfer.value;

        const allData = await fetchAllFinancialData('transferencias', dataInicio, dataFim);
        if (allData && allData.transferencias) {
            renderTransferencias(allData.transferencias);
        } else if (!allData || allData.transferencias.transferLines.length === 0) {
            showStatusMessage('transferencias', 'no-data');
        }
    }

    function renderTransferencias(data) {
        if (!data || data.transferLines.length === 0) {
            showStatusMessage('transferencias', 'no-data');
            return;
        }

        // Renderizar Tabela de Transferências
        data.transferLines.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.data}</td>
                <td>${row.totalPagamentos}</td>
                <td style="text-align: right;">${formatCurrency(row.valorTotalBoleto)}</td>
                <td style="text-align: right;">${formatCurrency(row.totalRecebido)}</td>
                <td style="text-align: right;">${formatCurrency(row.totalSCM_Total)}</td>
                <td style="text-align: right;">${formatCurrency(row.scmToSci)}</td>
                <td style="text-align: right;">${formatCurrency(row.scmToSva)}</td>
                <td style="text-align: right;">${formatCurrency(row.totalSVA_Total)}</td>
                <td style="text-align: right;">${formatCurrency(row.svaToScm)}</td>
                <td style="text-align: right;">${formatCurrency(row.svaToSci)}</td>
            `;
            transferTableBody.appendChild(tr);
        });

        // Renderizar Painel de Transferências
        transferPanel.innerHTML = '<div class="transfer-panel-title">✅ O QUE TRANSFERIR POR DIA</div>'; // Título do painel
        data.transferPanelLines.forEach(item => {
            const panelItem = document.createElement('div');
            panelItem.classList.add('transfer-panel-item');
            panelItem.innerHTML = `
                <div class="transfer-panel-date">📅 ${item.dataTxt} • Recebido: ${formatCurrency(item.totalRecebido)}</div>
                <div class="transfer-panel-scm">SCM → SCI: ${formatCurrency(item.scmToSci)} | SCM → SVA: ${formatCurrency(item.scmToSva)}</div>
                <div class="transfer-panel-sva">SVA → SCM: ${formatCurrency(item.svaToScm)} | SVA → SCI: ${formatCurrency(item.svaToSci)}</div>
            `;
            transferPanel.appendChild(panelItem);
        });

        showStatusMessage('transferencias', 'none');
    }

    // --- Inicialização ---
    // Define as datas iniciais para todos os inputs de data
    setInitialDates(dateInputStartDetalhado, dateInputEndDetalhado);
    setInitialDates(dateInputStartDashboard, dateInputEndDashboard);
    setInitialDates(dateInputStartTransfer, dateInputEndTransfer);

    // Event Listeners para os botões de carregar
    fetchReportButton.addEventListener('click', fetchReportData);
    fetchDashboardButton.addEventListener('click', fetchDashboardData);
    fetchTransferButton.addEventListener('click', fetchTransferData);

    // Carrega os dados da primeira aba ativa ao iniciar
    const initialTab = document.querySelector('.tab-button.active');
    if (initialTab) {
        const targetTab = initialTab.dataset.tab;
        if (targetTab === 'relatorio-detalhado') {
            fetchReportData();
        } else if (targetTab === 'dashboard') {
            fetchDashboardData();
        } else if (targetTab === 'transferencias') {
            fetchTransferData();
        }
    }
});
