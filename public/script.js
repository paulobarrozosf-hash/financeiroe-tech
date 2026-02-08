document.addEventListener('DOMContentLoaded', () => {
    // --- Configuração da API do Cloudflare Worker ---
    // Substitua esta URL pela URL BASE REAL do seu Cloudflare Worker!
    // Exemplo: 'https://pagamentos.paulo-barrozosf.workers.dev'
    const WORKER_BASE_URL = 'https://pagamentos.paulo-barrozosf.workers.dev/'; 

    // --- Seletores de Elementos do DOM ---
    // Navegação
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Relatório Diário
    const dateInputStart = document.getElementById('dataInicio');
    const dateInputEnd = document.getElementById('dataFim');
    const fetchReportButton = document.getElementById('fetchReportButton');
    const financialReportTableHead = document.querySelector('#financialReportTable thead tr');
    const financialReportTableBody = document.querySelector('#financialReportTable tbody');
    const loadingDiarioDiv = document.getElementById('loading-diario');
    const errorDiarioDiv = document.getElementById('error-diario');
    const noDataDiarioDiv = document.getElementById('no-data-diario');

    // Dashboard Mensal
    const dashboardMesSelect = document.getElementById('dashboardMes');
    const dashboardAnoSelect = document.getElementById('dashboardAno');
    const fetchDashboardButton = document.getElementById('fetchDashboardButton');
    const dashboardCardsContainer = document.querySelector('.dashboard-cards');
    const dailyTicketTableBody = document.querySelector('#dailyTicketTable tbody');
    const planTicketTableBody = document.querySelector('#planTicketTable tbody');
    const loadingDashboardDiv = document.getElementById('loading-dashboard');
    const errorDashboardDiv = document.getElementById('error-dashboard');
    const noDataDashboardDiv = document.getElementById('no-data-dashboard');

    // Transferências
    const transferMesSelect = document.getElementById('transferMes');
    const transferAnoSelect = document.getElementById('transferAno');
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

    // Preenche os selects de mês e ano
    function populateMonthYearSelects() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // Mês é 0-indexado

        // Anos (ex: 5 anos para trás e 1 para frente)
        for (let i = currentYear - 5; i <= currentYear + 1; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            dashboardAnoSelect.appendChild(option.cloneNode(true));
            transferAnoSelect.appendChild(option);
        }
        dashboardAnoSelect.value = currentYear;
        transferAnoSelect.value = currentYear;

        // Meses
        const months = [
            { value: 1, text: 'Janeiro' }, { value: 2, text: 'Fevereiro' }, { value: 3, text: 'Março' },
            { value: 4, text: 'Abril' }, { value: 5, text: 'Maio' }, { value: 6, text: 'Junho' },
            { value: 7, text: 'Julho' }, { value: 8, text: 'Agosto' }, { value: 9, text: 'Setembro' },
            { value: 10, text: 'Outubro' }, { value: 11, text: 'Novembro' }, { value: 12, text: 'Dezembro' }
        ];
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.text;
            dashboardMesSelect.appendChild(option.cloneNode(true));
            transferMesSelect.appendChild(option);
        });
        dashboardMesSelect.value = currentMonth;
        transferMesSelect.value = currentMonth;
    }

    // --- Lógica de Navegação entre Abas ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Remove 'active' de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            // Adiciona 'active' ao botão clicado e exibe o conteúdo correspondente
            button.classList.add('active');
            document.getElementById(targetTab).style.display = 'block';

            // Carrega os dados da aba ativa (se ainda não carregados ou se precisar de refresh)
            if (targetTab === 'relatorio-diario') {
                fetchReportData();
            } else if (targetTab === 'dashboard-mensal') {
                fetchDashboardData();
            } else if (targetTab === 'transferencias') {
                fetchTransferData();
            }
        });
    });

    // --- Lógica para Relatório Diário ---
    async function fetchReportData() {
        showStatusMessage('diario', 'loading');
        financialReportTableBody.innerHTML = '';
        financialReportTableHead.innerHTML = '';

        const dataInicio = dateInputStart.value;
        const dataFim = dateInputEnd.value;

        if (!dataInicio || !dataFim) {
            showStatusMessage('diario', 'error', 'Por favor, selecione as datas de início e fim para carregar o relatório.');
            return;
        }

        const apiUrl = `${WORKER_BASE_URL}/pagamentos?inicio=${dataInicio}&fim=${dataFim}`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(`HTTP error! Status: ${response.status}, Detalhes: ${errorData.details || errorData.error || response.statusText}`);
            }

            const data = await response.json();
            renderFinancialReportTable(data);

        } catch (error) {
            console.error('Erro ao buscar dados do relatório diário:', error);
            showStatusMessage('diario', 'error', `Não foi possível carregar o relatório. ${error.message}`);
        } finally {
            if (loadingDiarioDiv.style.display === 'block') {
                loadingDiarioDiv.style.display = 'none';
            }
        }
    }

    function renderFinancialReportTable(data) {
        if (!data || data.length === 0) {
            showStatusMessage('diario', 'no-data');
            return;
        }

        const columnOrder = [
            { key: 'dataPagamento', label: 'Data Pagamento' },
            { key: 'cliente', label: 'Cliente' },
            { key: 'plano', label: 'Plano' },
            { key: 'valorPlanoRef', label: 'Valor Plano (ref)' },
            { key: 'valorBoleto', label: 'Valor Boleto' },
            { key: 'valorPago', label: 'Valor Pago' },
            { key: 'valorSCM', label: 'Valor SCM (R$)' },
            { key: 'valorSCI', label: 'Valor SCI (R$)' },
            { key: 'valorSVA', label: 'Valor SVA (R$)' },
            { key: 'formaPagamento', label: 'Forma Pagamento' },
            { key: 'portador', label: 'Portador' },
            { key: 'contratoId', label: 'Contrato ID' },
            { key: 'cpfcnpj', label: 'CPF/CNPJ' },
            { key: 'endereco', label: 'Endereço' },
            { key: 'cidade', label: 'Cidade' },
            { key: 'uf', label: 'UF' },
            { key: 'tituloId', label: 'Título ID' },
            { key: 'nossoNumero', label: 'Nosso Número' },
            { key: 'numeroDocumento', label: 'Número Documento' }
        ];

        columnOrder.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            financialReportTableHead.appendChild(th);
        });

        data.forEach(rowData => {
            const tr = document.createElement('tr');
            columnOrder.forEach(col => {
                const td = document.createElement('td');
                if (['valorPlanoRef', 'valorBoleto', 'valorPago', 'valorSCM', 'valorSCI', 'valorSVA'].includes(col.key)) {
                    td.textContent = formatCurrency(rowData[col.key]);
                    td.style.textAlign = 'right';
                } else {
                    td.textContent = rowData[col.key];
                }
                tr.appendChild(td);
            });
            financialReportTableBody.appendChild(tr);
        });
        showStatusMessage('diario', 'none');
    }

    // --- Lógica para Dashboard Mensal ---
    async function fetchDashboardData() {
        showStatusMessage('dashboard', 'loading');
        dashboardCardsContainer.innerHTML = '';
        dailyTicketTableBody.innerHTML = '';
        planTicketTableBody.innerHTML = '';

        const ano = dashboardAnoSelect.value;
        const mes = dashboardMesSelect.value;

        if (!ano || !mes) {
            showStatusMessage('dashboard', 'error', 'Por favor, selecione o mês e ano para o dashboard.');
            return;
        }

        const apiUrl = `${WORKER_BASE_URL}/dashboard-mes?ano=${ano}&mes=${mes}`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(`HTTP error! Status: ${response.status}, Detalhes: ${errorData.details || errorData.error || response.statusText}`);
            }

            const data = await response.json();
            renderDashboard(data);

        } catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error);
            showStatusMessage('dashboard', 'error', `Não foi possível carregar o dashboard. ${error.message}`);
        } finally {
            if (loadingDashboardDiv.style.display === 'block') {
                loadingDashboardDiv.style.display = 'none';
            }
        }
    }

    function renderDashboard(data) {
        if (!data || !data.summary || data.daily.length === 0) {
            showStatusMessage('dashboard', 'no-data');
            return;
        }

        // Renderizar Cards de Resumo
        const summary = data.summary;
        dashboardCardsContainer.innerHTML = `
            <div class="dashboard-card">
                <div class="dashboard-card-title">TOTAL RECEBIDO</div>
                <div class="dashboard-card-value">${formatCurrency(summary.totalRecebido)}</div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-card-title">TOTAL PAGAMENTOS</div>
                <div class="dashboard-card-value">${summary.totalPagamentos}</div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-card-title">TICKET MÉDIO</div>
                <div class="dashboard-card-value">${formatCurrency(summary.ticketGeral)}</div>
            </div>
            <div class="dashboard-card">
                <div class="dashboard-card-title">REGISTROS ÚNICOS</div>
                <div class="dashboard-card-value">${summary.registrosUnicos}</div>
            </div>
        `;

        // Renderizar Ticket Médio por Dia
        dailyTicketTableBody.innerHTML = '';
        data.daily.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.dia}</td>
                <td>${row.pagamentos}</td>
                <td style="text-align: right;">${formatCurrency(row.totalRecebido)}</td>
                <td style="text-align: right;">${formatCurrency(row.ticketMedio)}</td>
            `;
            dailyTicketTableBody.appendChild(tr);
        });

        // Renderizar Ticket Médio por Plano
        planTicketTableBody.innerHTML = '';
        data.byPlan.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.plano}</td>
                <td>${row.pagamentos}</td>
                <td style="text-align: right;">${formatCurrency(row.totalRecebido)}</td>
                <td style="text-align: right;">${formatCurrency(row.ticketMedio)}</td>
            `;
            planTicketTableBody.appendChild(tr);
        });

        showStatusMessage('dashboard', 'none');
    }

    // --- Lógica para Transferências ---
    async function fetchTransferData() {
        showStatusMessage('transfer', 'loading');
        transferTableBody.innerHTML = '';
        transferPanel.innerHTML = '';

        const ano = transferAnoSelect.value;
        const mes = transferMesSelect.value;

        if (!ano || !mes) {
            showStatusMessage('transfer', 'error', 'Por favor, selecione o mês e ano para as transferências.');
            return;
        }

        const apiUrl = `${WORKER_BASE_URL}/transferencias-mes?ano=${ano}&mes=${mes}`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(`HTTP error! Status: ${response.status}, Detalhes: ${errorData.details || errorData.error || response.statusText}`);
            }

            const data = await response.json();
            renderTransferencias(data);

        } catch (error) {
            console.error('Erro ao buscar dados de transferências:', error);
            showStatusMessage('transfer', 'error', `Não foi possível carregar as transferências. ${error.message}`);
        } finally {
            if (loadingTransferDiv.style.display === 'block') {
                loadingTransferDiv.style.display = 'none';
            }
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
    populateMonthYearSelects(); // Preenche os selects de mês/ano
    setInitialDates(); // Define as datas padrão para o relatório diário

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

    // Define as datas padrão (último mês até hoje) para o relatório diário
    function setInitialDates() {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        dateInputEnd.valueAsDate = today;
        dateInputStart.valueAsDate = lastMonth;
    }
});
