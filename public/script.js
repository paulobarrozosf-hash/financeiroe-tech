        document.addEventListener('DOMContentLoaded', () => {
            // Seletores de elementos do DOM
            const dateInputStart = document.getElementById('dataInicio');
            const dateInputEnd = document.getElementById('dataFim');
            const fetchReportButton = document.getElementById('fetchReportButton');
            const tableHead = document.querySelector('#financialReportTable thead tr');
            const tableBody = document.querySelector('#financialReportTable tbody');
            const loadingDiv = document.getElementById('loading');
            const errorDiv = document.getElementById('error');
            const noDataDiv = document.getElementById('no-data');

            // --- Configuração da API do Cloudflare Worker ---
            // Substitua esta URL pela URL REAL do seu Cloudflare Worker!
            // Exemplo: https://relatorio-financeiro.paulo.workers.dev/pagamentos
            const workerApiBaseUrl = 'https://SEU_WORKER_URL.workers.dev/pagamentos'; 

            // --- Funções de Utilidade ---

            // Define as datas padrão (último mês até hoje)
            function setInitialDates() {
                const today = new Date();
                const lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);

                dateInputEnd.valueAsDate = today;
                dateInputStart.valueAsDate = lastMonth;
            }

            // Exibe uma mensagem de status e esconde as outras
            function showStatusMessage(type, message = '') {
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

            // --- Lógica Principal de Busca e Renderização ---

            async function fetchReportData() {
                showStatusMessage('loading'); // Exibe mensagem de carregamento
                tableBody.innerHTML = ''; // Limpa a tabela
                tableHead.innerHTML = ''; // Limpa cabeçalhos

                const dataInicio = dateInputStart.value;
                const dataFim = dateInputEnd.value;

                if (!dataInicio || !dataFim) {
                    showStatusMessage('error', 'Por favor, selecione as datas de início e fim para carregar o relatório.');
                    return;
                }

                const apiUrl = `${workerApiBaseUrl}?inicio=${dataInicio}&fim=${dataFim}`;

                try {
                    const response = await fetch(apiUrl);

                    if (!response.ok) {
                        // Tenta ler a mensagem de erro do corpo da resposta JSON
                        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                        throw new Error(`HTTP error! Status: ${response.status}, Detalhes: ${errorData.details || errorData.error || response.statusText}`);
                    }

                    const data = await response.json();
                    renderTable(data);

                } catch (error) {
                    console.error('Erro ao buscar dados do relatório:', error);
                    showStatusMessage('error', `Não foi possível carregar o relatório. ${error.message}`);
                } finally {
                    // O finally garante que a mensagem de carregamento seja escondida
                    // independentemente de sucesso ou falha.
                    if (loadingDiv.style.display === 'block') {
                        loadingDiv.style.display = 'none';
                    }
                }
            }

            function renderTable(data) {
                if (!data || data.length === 0) {
                    showStatusMessage('no-data');
                    return;
                }

                // Define a ordem e os nomes de exibição das colunas
                // Adapte esta lista para as colunas que você quer exibir e na ordem desejada
                const columnOrder = [
                    { key: 'dataPagamento', label: 'Data Pagamento' },
                    { key: 'cliente', label: 'Cliente' },
                    { key: 'plano', label: 'Plano' },
                    { key: 'valorPlanoRef', label: 'Valor Plano Ref.' },
                    { key: 'valorBoleto', label: 'Valor Boleto' },
                    { key: 'valorPago', label: 'Valor Pago' },
                    { key: 'valorSCM', label: 'Valor SCM' },
                    { key: 'valorSCI', label: 'Valor SCI' },
                    { key: 'valorSVA', label: 'Valor SVA' },
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

                // Cria os cabeçalhos da tabela na ordem definida
                columnOrder.forEach(col => {
                    const th = document.createElement('th');
                    th.textContent = col.label;
                    tableHead.appendChild(th);
                });

                // Preenche o corpo da tabela com os dados
                data.forEach(rowData => {
                    const tr = document.createElement('tr');
                    columnOrder.forEach(col => {
                        const td = document.createElement('td');
                        // Formatação para valores monetários
                        if (['valorPlanoRef', 'valorBoleto', 'valorPago', 'valorSCM', 'valorSCI', 'valorSVA'].includes(col.key)) {
                            td.textContent = Number(rowData[col.key]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            td.style.textAlign = 'right'; // Alinha valores à direita
                        } else {
                            td.textContent = rowData[col.key];
                        }
                        tr.appendChild(td);
                    });
                    tableBody.appendChild(tr);
                });
                showStatusMessage('none'); // Esconde todas as mensagens se os dados foram carregados
            }

            // --- Inicialização ---
            setInitialDates(); // Define as datas padrão ao carregar a página
            fetchReportButton.addEventListener('click', fetchReportData); // Adiciona o evento de clique ao botão
            fetchReportData(); // Carrega os dados iniciais ao carregar a página
        });
