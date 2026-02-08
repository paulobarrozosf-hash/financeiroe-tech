document.addEventListener('DOMContentLoaded', () => {
    // --- Configuração da API do Cloudflare Worker ---
    // ATENÇÃO: A URL BASE agora aponta para o NOVO endpoint único!
    const WORKER_DATA_ENDPOINT = 'https://pagamentos.paulo-barrozosf.workers.dev/dados-financeiros-periodo';

    // --- Seletores de Elementos do DOM ---
    // Navegação
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Relatório Detalhado (Diário)
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
    const transferPanel = document.getElementById('transfer-panel');
    const loadingTransferDiv = document.getElementById('loading-transfer');
    const errorTransferDiv = document.getElementById('error-transfer');
    const noDataTransferDiv = document.getElementById('no-data-transfer');

    // --- Funções de Utilidade ---

    // Exibe uma mensagem de status e esconde as outras para uma seção específica
    function showStatusMessage(section, type, message = '') {
        const loadingDiv = document.getElementById(`loading-${section}`);
        const errorDiv = document.getElementById(`error-${section}`);
        const noDataDiv = document.getElementById(`no-data-${section}`);

        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        noDataDiv.style.display = 'none';

        if (type === 'loading') {
            loadingDiv.style.display = 'block';
        } else if (type === 'error') {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else if (type === 'no-data') {
            noDataDiv.style.display = 'block';
        }
    }

    // Formata um número para moeda BRL
    function formatCurrency(value) {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Define as datas padrão (último mês até hoje) para um conjunto de inputs
    function setInitialDates(startDateInput, endDateInput) {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        startDateInput.valueAsDate = lastMonth;
        endDateInput.valueAsDate = today;
    }

    // --- Lógica de Navegação entre Abas ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(targetTab).style.display = 'block';
            button.classList.add('active');

            // Carrega dados automaticamente ao mudar de aba, se as datas estiverem preenchidas
            if (targetTab === 'relatorio-diario') {
                fetchReportData();
            } else if (targetTab === 'dashboard-mensal') {
                fetchDashboardData();
            } else if (targetTab === 'transferencias') {
                fetchTransferData();
            }
        });
    });

    // --- Funções de Busca de Dados (TODAS CHAMAM O MESMO ENDPOINT DO WORKER) ---

    async function fetchAllFinancialData(section, dataInicio, dataFim) {
        if (!dataInicio || !dataFim) {
            showStatusMessage(section, 'error', 'Por favor, selecione as datas de início e fim.');
            return null;
        }

        showStatusMessage(section, 'loading');
        try {
            const response = await fetch(`${WORKER_DATA_ENDPOINT}?inicio=${dataInicio}&fim=${dataFim}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }
            const data = await response.json();
            showStatusMessage(section, 'none'); // Esconde loading/erro
            return data;
        } catch (error) {
            console.error(`Erro ao carregar dados para ${section}:`, error);
            showStatusMessage(section, 'error', `Não foi possível carregar os dados. ${error.message}`);
            return null;
        }
    }

    // --- Funções Específicas para Cada Aba ---

    async function fetchReportData() {
        financialReportTableBody.innerHTML = ''; // Limpa a tabela
        financialReportTableHead.innerHTML = ''; // Limpa o cabeçalho

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

        // Define os cabeçalhos da tabela (pode ser fixo ou dinâmico baseado nos dados)
        const headers = [
            "Data Pagamento", "Cliente", "CPF/CNPJ", "Plano", "Valor Plano Ref",
            "Valor Boleto", "Valor Pago", "Portador", "Endereço", "Cidade", "UF",
            "Valor SCM", "Valor SCI", "Valor SVA", "Forma Pagamento"
        ];
        financialReportTableHead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.dataPagamento}</td>
                <td>${item.cliente}</td>
                <td>${item.cpfcnpj}</td>
                <td>${item.plano}</td>
                <td style="text-align: right;">${formatCurrency(item.valorPlanoRef)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorBoleto)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorPago)}</td>
                <td>${item.portador}</td>
                <td>${item.endereco}</td>
                <td>${item.cidade}</td>
                <td>${item.uf}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSCM)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSCI)}</td>
                <td style="text-align: right;">${formatCurrency(item.valorSVA)}</td>
                <td>${item.formaPagamento}</td>
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
        } else if (!allData || allData.dashboard.totalPagamentos === 0) {
            showStatusMessage('dashboard', 'no-data');
        }
    }

    function renderDashboard(data) {
        if (!data || data.summary.totalPagamentos === 0) {
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
