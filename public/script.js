// public/script.js (Código completo e corrigido para o Frontend)

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuração da API do Cloudflare Worker ---
    // Substitua esta URL pela URL BASE REAL do seu Cloudflare Worker!
    // Exemplo: 'https://pagamentos.paulo-barrozosf.workers.dev'
    const WORKER_BASE_URL = 'https://pagamentos.paulo-barrozosf.workers.dev/';
    const WORKER_DATA_ENDPOINT = WORKER_BASE_URL + 'dados-financeiros-periodo'; // Novo endpoint único

    // --- Seletores de Elementos do DOM ---
    // Navegação
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Relatório Detalhado
    const dateInputStartDiario = document.getElementById('dataInicioDiario');
    const dateInputEndDiario = document.getElementById('dataFimDiario');
    const fetchReportButton = document.getElementById('fetchReportButton');
    const financialReportTableHead = document.querySelector('#financialReportTable thead tr');
    const financialReportTableBody = document.querySelector('#financialReportTable tbody');
    const loadingDiarioDiv = document.getElementById('loading-diario');
    const errorDiarioDiv = document.getElementById('error-diario');
    const noDataDiarioDiv = document.getElementById('no-data-diario');

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
    const transferPanel = document.querySelector('.transfer-panel');
    const loadingTransferDiv = document.getElementById('loading-transfer');
    const errorTransferDiv = document.getElementById('error-transfer');
    const noDataTransferDiv = document.getElementById('no-data-transfer');

    // --- Funções Auxiliares ---
    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function showStatusMessage(tab, type, message = '') {
        const loadingDiv = document.getElementById(`loading-${tab}`);
        const errorDiv = document.getElementById(`error-${tab}`);
        const noDataDiv = document.getElementById(`no-data-${tab}`);

        // Esconde todas as mensagens primeiro
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';
        if (noDataDiv) noDataDiv.style.display = 'none';

        // Mostra a mensagem específica
        if (type === 'loading' && loadingDiv) {
            loadingDiv.style.display = 'block';
        } else if (type === 'error' && errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else if (type === 'no-data' && noDataDiv) {
            noDataDiv.style.display = 'block';
        }
    }

    function setInitialDates(startDateInput, endDateInput) {
        const today = new Date();
        const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        endDateInput.valueAsDate = today;
        startDateInput.valueAsDate = firstDayOfCurrentMonth;
    }

    // --- Navegação entre Abas ---
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

            // Dispara o fetch de dados para a aba ativa
            if (targetTab === 'relatorio-diario') {
                fetchReportData();
            } else if (targetTab === 'dashboard-mensal') {
                fetchDashboardData();
            } else if (targetTab === 'transferencias') {
                fetchTransferData();
            }
        });
    });

    // --- Função Centralizada para Buscar Todos os Dados Financeiros ---
    let cachedFinancialData = null; // Cache para evitar múltiplas chamadas para o mesmo período
    let lastFetchedPeriod = { inicio: null, fim: null };

    async function fetchAllFinancialData(tabName, dataInicio, dataFim) {
        // Verifica se já temos os dados em cache para o período
        if (cachedFinancialData && lastFetchedPeriod.inicio === dataInicio && lastFetchedPeriod.fim === dataFim) {
            console.log("Usando dados em cache para o período:", dataInicio, "-", dataFim);
            return cachedFinancialData;
        }

        showStatusMessage(tabName, 'loading');
        try {
            const url = `${WORKER_DATA_ENDPOINT}?inicio=${dataInicio}&fim=${dataFim}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao buscar dados: ${response.statusText}`);
            }

            const data = await response.json();
            cachedFinancialData = data; // Armazena em cache
            lastFetchedPeriod = { inicio: dataInicio, fim: dataFim }; // Atualiza o período do cache
            return data;

        } catch (error) {
            console.error(`Erro ao carregar dados para ${tabName}:`, error);
            showStatusMessage(tabName, 'error', `Não foi possível carregar os dados. ${error.message}`);
            cachedFinancialData = null; // Limpa o cache em caso de erro
            return null;
        }
    }

    // --- Funções de Fetch e Renderização para cada Aba ---
    async function fetchReportData() {
        financialReportTableHead.innerHTML = '';
        financialReportTableBody.innerHTML = '';

        const dataInicio = dateInputStartDiario.value;
        const dataFim = dateInputEndDiario.value;

        const allData = await fetchAllFinancialData('diario', dataInicio, dataFim);
        if (allData && allData.pagamentosDetalhes) {
            renderReportTable(allData.pagamentosDetalhes);
        } else if (!allData || allData.pagamentosDetalhes.length === 0) {
            showStatusMessage('diario', 'no-data');
        }
    }

    function renderReportTable(data) {
        if (!data || data.length === 0) {
            showStatusMessage('diario', 'no-data');
            return;
        }

        // Definir cabeçalhos da tabela (ajuste conforme os campos do seu `processedPayments`)
        const headers = [
            "Data Pagamento", "Cliente", "Plano", "Portador", "Valor Boleto",
            "Valor Pago", "Valor SCM", "Valor SCI", "Valor SVA"
        ];
        financialReportTableHead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.dataPagamento}</td>
                <td>${item.cliente}</td>
                <td>${item.plano}</td>
                <td>${item.portador}</td>
                <td style="text-align: right;">${formatCurrency(item.valorBoleto)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorPago)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSCM)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSCI)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSVA)}</td>
            `;
            financialReportTableBody.appendChild(tr);
        });
        showStatusMessage('diario', 'none');
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
        } else if (!allData || allData.dashboard.daily.length === 0) { // Verifica se há dados diários no dashboard
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

        const allData = await fetchAllFinancialData('transfer', dataInicio, dataFim);
        if (allData && allData.transferencias) {
            renderTransferencias(allData.transferencias);
        } else if (!allData || allData.transferencias.transferLines.length === 0) {
            showStatusMessage('transfer', 'no-data');
        }
    }

    function renderTransferencias(data) {
        if (!data || data.transferLines.length === 0) {
            showStatusMessage('transfer', 'no-data');
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
                <td style="text-align: right; background-color: #e8f1ff;">${formatCurrency(row.totalSCM_Total)}</td>
                <td style="text-align: right; background-color: #e8f1ff;">${formatCurrency(row.scmToSci)}</td>
                <td style="text-align: right; background-color: #e8f1ff;">${formatCurrency(row.scmToSva)}</td>
                <td style="text-align: right; background-color: #fff3e0;">${formatCurrency(row.totalSVA_Total)}</td>
                <td style="text-align: right; background-color: #fff3e0;">${formatCurrency(row.svaToScm)}</td>
                <td style="text-align: right; background-color: #fff3e0;">${formatCurrency(row.svaToSci)}</td>
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

        showStatusMessage('transfer', 'none');
    }

    // --- Inicialização ---
    setInitialDates(dateInputStartDiario, dateInputEndDiario);
    setInitialDates(dateInputStartDashboard, dateInputEndDashboard);
    setInitialDates(dateInputStartTransfer, dateInputEndTransfer);

    // Event Listeners
    fetchReportButton.addEventListener('click', fetchReportData);
    fetchDashboardButton.addEventListener('click', fetchDashboardData);
    fetchTransferButton.addEventListener('click', fetchTransferData);

    // Carrega a primeira aba ativa ao iniciar
    const initialTab = document.querySelector('.tab-button.active');
    if (initialTab) {
        const targetTab = initialTab.dataset.tab;
        if (targetTab === 'relatorio-diario') {
            fetchReportData();
        } else if (targetTab === 'dashboard-mensal') {
            fetchDashboardData();
        } else if (targetTab === 'transferencias') {
            fetchTransferData();
        }
    }
});
