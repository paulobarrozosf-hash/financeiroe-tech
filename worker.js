// worker.js (no Cloudflare)

// --- Configurações da API SGP ---
const SGP_BASE_URL = "http://45.71.42.9:8000/api/ura/clientes/"; // Verifique se esta URL está correta e acessível do Worker
const TZ = "America/Sao_Paulo"; // Fuso horário para formatação de datas

// --- Tabelas de Configuração (replicadas do seu App Script) ---
const tabelaEspecialClientes = [ /* ... seu array ... */ ];
const tabelaTipos = { /* ... seu objeto ... */ };
const planosTabela = { /* ... seu objeto ... */ };

// --- Funções utilitárias (replicadas do seu App Script) ---
function round2_(num) { /* ... */ }
function normalize_(str) { /* ... */ }
function extrairDataPagamentoISO_(dataPgRaw, tz) { /* ... */ }
function empresaFromPortador_(portador) { /* ... */ }
function buscarClienteEspecial(nome, contratoId) { /* ... */ }
function extrairIdsTitulo_(titulo) { /* ... */ }
function resolvePlanoInfo_(planoDesc, valorRecebido, valorBoleto) { /* ... */ }
function pad2_(n) { /* ... */ } // Adicione esta função do seu App Script
function parseIsoYMD_(iso) { /* ... */ } // Adicione esta função do seu App Script
function monthsBetween_(startIso, endIso) { /* ... */ } // Adicione esta função do seu App Script

// --- Lógica Principal do Worker ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const SGP_APP_NAME = env.SGP_APP_NAME; // Variáveis de ambiente
    const SGP_TOKEN = env.SGP_TOKEN;       // Variáveis de ambiente

    // Adicione CORS para todas as respostas
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Ajuste para o domínio do Vercel em produção
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Secret-Token", // Se usar token
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      if (path === '/pagamentos') {
        return handlePagamentos(request, SGP_APP_NAME, SGP_TOKEN, headers);
      } else if (path === '/dashboard-mes') {
        return handleDashboardMes(request, SGP_APP_NAME, SGP_TOKEN, headers);
      } else if (path === '/transferencias-mes') {
        return handleTransferenciasMes(request, SGP_APP_NAME, SGP_TOKEN, headers);
      } else {
        return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), { status: 404, headers });
      }
    } catch (e) {
      console.error(`Erro no Worker para ${path}:`, e.message, e.stack);
      return new Response(JSON.stringify({ error: 'Erro interno do servidor', details: e.message }), { status: 500, headers });
    }
  },
};

// --- Funções de Manipulação de Endpoints ---

async function handlePagamentos(request, appName, token, headers) {
  const url = new URL(request.url);
  const dataInicio = url.searchParams.get('inicio');
  const dataFim = url.searchParams.get('fim');

  if (!dataInicio || !dataFim) {
    return new Response(JSON.stringify({ error: 'Parâmetros "inicio" e "fim" são obrigatórios.' }), { status: 400, headers });
  }

  // Lógica de pagamentosRecebidosPeriodo (do seu App Script) adaptada para Worker
  // (Já deve estar no seu Worker atual, apenas garanta que está completa)
  const processedData = await fetchAndProcessPayments(dataInicio, dataFim, appName, token);
  return new Response(JSON.stringify(processedData), { headers });
}

async function handleDashboardMes(request, appName, token, headers) {
  const url = new URL(request.url);
  const ano = url.searchParams.get('ano');
  const mes = url.searchParams.get('mes');

  if (!ano || !mes) {
    return new Response(JSON.stringify({ error: 'Parâmetros "ano" e "mes" são obrigatórios.' }), { status: 400, headers });
  }

  const startIso = `${ano}-${pad2_(mes)}-01`;
  const lastDay = new Date(Number(ano), Number(mes), 0).getDate();
  const endIso = `${ano}-${pad2_(mes)}-${pad2_(lastDay)}`;

  // 1. Buscar todos os pagamentos para o mês/ano
  const allPaymentsForMonth = await fetchAndProcessPayments(startIso, endIso, appName, token);

  // 2. Replicar a lógica de agregação do gerarDashboardMes_ (sem manipulação de planilha)
  const dashboardData = aggregateDashboardData(allPaymentsForMonth, startIso, endIso);

  return new Response(JSON.stringify(dashboardData), { headers });
}

async function handleTransferenciasMes(request, appName, token, headers) {
  const url = new URL(request.url);
  const ano = url.searchParams.get('ano');
  const mes = url.searchParams.get('mes');

  if (!ano || !mes) {
    return new Response(JSON.stringify({ error: 'Parâmetros "ano" e "mes" são obrigatórios.' }), { status: 400, headers });
  }

  const startIso = `${ano}-${pad2_(mes)}-01`;
  const lastDay = new Date(Number(ano), Number(mes), 0).getDate();
  const endIso = `${ano}-${pad2_(mes)}-${pad2_(lastDay)}`;

  // 1. Buscar todos os pagamentos para o mês/ano
  const allPaymentsForMonth = await fetchAndProcessPayments(startIso, endIso, appName, token);

  // 2. Replicar a lógica de agregação do rebuildTransferenciasMes_ (sem manipulação de planilha)
  const transferData = aggregateTransferData(allPaymentsForMonth, startIso, endIso);

  return new Response(JSON.stringify(transferData), { headers });
}

// --- Funções de Busca e Processamento de Dados (adaptadas do seu App Script) ---

// Esta função encapsula a lógica de buscar da API SGP e processar os pagamentos
// Ela será usada por handlePagamentos, handleDashboardMes e handleTransferenciasMes
async function fetchAndProcessPayments(dataInicio, dataFim, appName, token) {
  const SGP_API_URL = SGP_BASE_URL; // Use a URL base definida no topo
  let offset = 0;
  const limit = 100;
  let continuarConsulta = true;
  let todosRegistros = [];
  const seenKeys = new Set();

  while (continuarConsulta) {
    const payload = {
      app: appName,
      token: token,
      offset: offset,
      limit: limit,
      data_pagamento_inicio: dataInicio,
      data_pagamento_fim: dataFim,
      omitir_contratos: false,
      omitir_titulos: false,
      exibir_observacao_servicos: true
    };

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };

    const response = await fetch(SGP_API_URL, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API SGP retornou erro ${response.status}: ${errorText}`);
      throw new Error(`Erro na API SGP: ${response.status} - ${errorText}`);
    }

    const dados = await response.json();

    if (!dados.clientes || dados.clientes.length === 0) {
      continuarConsulta = false;
      break;
    }

    dados.clientes.forEach(cliente => {
      const nome = cliente.nome || "";
      const cpfcnpj = cliente.cpfcnpj || "";
      const endereco = (cliente.endereco && `${cliente.endereco.logradouro || ""} ${cliente.endereco.numero || ""}`.trim()) || "";
      const cidade = cliente.endereco?.cidade || "";
      const uf = cliente.endereco?.uf || "";

      (cliente.titulos || []).forEach(titulo => {
        const dataPgRaw = titulo.dataPagamento || titulo.dataPagamentoFormated || titulo.data_pagamento || "";
        const portador = titulo.portador || titulo.portador_nome || titulo.portador_banco || "";
        const formaPagamento = titulo.formaPagamento || titulo.forma_pagamento || "Boleto";

        const dataIso = extrairDataPagamentoISO_(dataPgRaw, TZ);
        if (!dataIso || dataIso < dataInicio || dataIso > dataFim) return;

        const empresa = empresaFromPortador_(portador);
        if (!empresa) return;

        const contratoId = (titulo.contrato || titulo.contratoId || titulo.clientecontrato_id || "").toString().trim();
        if (!contratoId) return;

        const contratoObj = cliente.contratos?.find(c => c.contrato == contratoId || c.id == contratoId) || null;
        const planoDescRaw = contratoObj?.servicos?.[0]?.plano?.descricao || "";
        const planoDesc = (planoDescRaw || "").toString().trim();

        let valorBoleto = round2_(titulo.valor);
        let valorPago = round2_(titulo.valorPago);
        const valorRecebidoFinal = valorPago > 0 ? valorPago : valorBoleto;

        const ids = extrairIdsTitulo_(titulo);
        const clienteEspecial = buscarClienteEspecial(nome, contratoId);

        let valorSCM = 0, valorSCI = 0, valorSVA = 0, valorPlanoRef = valorBoleto;

        if (clienteEspecial && clienteEspecial.contratoId == contratoId) {
          const pct = tabelaTipos[clienteEspecial.tipo];
          if (pct) {
            valorBoleto = clienteEspecial.valorBoleto;
            valorSCM = round2_(valorBoleto * pct.scm);
            valorSCI = round2_(valorBoleto * pct.sci);
            valorSVA = round2_(valorBoleto * pct.sva);
            valorPlanoRef = valorBoleto;
          }
        } else {
          const planoInfo = resolvePlanoInfo_(planoDesc, valorRecebidoFinal, valorBoleto, planosTabela);
          valorSCM = round2_(valorBoleto * planoInfo.scm);
          valorSCI = round2_(valorBoleto * planoInfo.sci);
          valorSVA = round2_(valorBoleto * planoInfo.sva);
          valorPlanoRef = planoInfo.valor;
        }

        let chaveUnica = "";
        if (ids.uniq) {
          chaveUnica = [contratoId, dataIso, ids.uniq].join("|");
        } else {
          chaveUnica = [
            contratoId,
            dataIso,
            valorRecebidoFinal.toFixed(2),
            normalize_(portador),
            planoDesc,
            formaPagamento
          ].join("|");
        }

        if (seenKeys.has(chaveUnica)) return;
        seenKeys.add(chaveUnica);

        todosRegistros.push({
          contratoId, cliente: nome, cpfcnpj, plano: planoDesc, valorPlanoRef,
          valorBoleto, valorPago: valorRecebidoFinal, dataPagamento: dataIso,
          portador, endereco, cidade, uf, valorSCM, valorSCI, valorSVA,
          formaPagamento, tituloId: ids.tituloId, nossoNumero: ids.nossoNumero,
          numeroDocumento: ids.numeroDocumento, chaveUnica
        });
      });
    });
    offset += limit;
    // await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay, se necessário
  }
  return todosRegistros;
}

// Adaptação da lógica de gerarDashboardMes_
function aggregateDashboardData(payments, startIso, endIso) {
  const seen = new Set();
  const rows = [];

  payments.forEach(r => {
    const data = r.dataPagamento; // Já está em ISO
    if (!data || data < startIso || data > endIso) return;

    const chave = r.chaveUnica;
    if (seen.has(chave)) return;
    seen.add(chave);
    rows.push(r);
  });

  const daily = {};
  const byPlan = {};
  let totalRecebido = 0;
  let totalPagamentos = 0;

  rows.forEach(r => {
    const data = r.dataPagamento;
    const plano = (r.plano || "").trim() || "SEM_PLANO";
    const recebido = r.valorPago; // Já é o valor final

    totalRecebido += recebido;
    totalPagamentos++;

    if (!daily[data]) daily[data] = { count: 0, total: 0 };
    daily[data].count++;
    daily[data].total += recebido;

    if (!byPlan[plano]) byPlan[plano] = { count: 0, total: 0 };
    byPlan[plano].count++;
    byPlan[plano].total += recebido;
  });

  const ticketGeral = totalPagamentos ? totalRecebido / totalPagamentos : 0;

  const dailyRows = Object.keys(daily).sort().map(d => {
    const t = daily[d].total;
    const c = daily[d].count;
    return { dia: d, pagamentos: c, totalRecebido: round2_(t), ticketMedio: round2_(c ? t / c : 0) };
  });

  const planRows = Object.keys(byPlan).map(p => {
    const t = byPlan[p].total;
    const c = byPlan[p].count;
    return { plano: p, pagamentos: c, totalRecebido: round2_(t), ticketMedio: round2_(c ? t / c : 0) };
  }).sort((a, b) => b.totalRecebido - a.totalRecebido).slice(0, 20);

  return {
    summary: {
      totalRecebido: round2_(totalRecebido),
      totalPagamentos: totalPagamentos,
      ticketGeral: round2_(ticketGeral),
      registrosUnicos: seen.size
    },
    daily: dailyRows,
    byPlan: planRows
  };
}

// Adaptação da lógica de rebuildTransferenciasMes_
function aggregateTransferData(payments, startIso, endIso) {
  const seen = new Set();
  const rows = [];

  payments.forEach(r => {
    const data = r.dataPagamento;
    if (!data || data < startIso || data > endIso) return;

    const chave = r.chaveUnica;
    if (seen.has(chave)) return;
    seen.add(chave);
    rows.push(r);
  });

  const map = {}; // dataIso -> { seen:Set, regs:[] }
  rows.forEach(r => {
    const data = r.dataPagamento;
    const chave = r.chaveUnica;

    if (!map[data]) map[data] = { seen: new Set(), regs: [] };
    if (map[data].seen.has(chave)) return; // Deduplicação por dia
    map[data].seen.add(chave);

    map[data].regs.push({
      port: normalize_(r.portador),
      valorBoleto: r.valorBoleto,
      valorPago: r.valorPago,
      valorSCM: r.valorSCM,
      valorSCI: r.valorSCI,
      valorSVA: r.valorSVA
    });
  });

  const transferLines = [];
  const transferPanelLines = [];

  const startDate = new Date(startIso + "T00:00:00");
  const endDate = new Date(endIso + "T00:00:00");

  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    const iso = Utilities.formatDate(dt, TZ, "yyyy-MM-dd");
    const br = Utilities.formatDate(dt, TZ, "dd/MM/yyyy");

    const regs = (map[iso] ? map[iso].regs : []);
    const totalPag = regs.length;
    const totalBoleto = regs.reduce((s, x) => s + x.valorBoleto, 0);
    const totalReceb = regs.reduce((s, x) => s + x.valorPago, 0);

    const totalSCM_SC = regs.filter(x => x.port.includes("SCM")).reduce((s, x) => s + x.valorSCM, 0);
    const totalSCM_SCI = regs.filter(x => x.port.includes("SCM")).reduce((s, x) => s + x.valorSCI, 0);
    const totalSCM_SVA = regs.filter(x => x.port.includes("SCM")).reduce((s, x) => s + x.valorSVA, 0);
    const totalSCM_Total = totalSCM_SC + totalSCM_SCI + totalSCM_SVA;

    const totalSVA_SC = regs.filter(x => x.port.includes("SVA")).reduce((s, x) => s + x.valorSCM, 0);
    const totalSVA_SCI = regs.filter(x => x.port.includes("SVA")).reduce((s, x) => s + x.valorSCI, 0);
    const totalSVA_SVA = regs.filter(x => x.port.includes("SVA")).reduce((s, x) => s + x.valorSVA, 0);
    const totalSVA_Total = totalSVA_SC + totalSVA_SCI + totalSVA_SVA;

    transferLines.push({
      data: br,
      totalPagamentos: totalPag,
      valorTotalBoleto: round2_(totalBoleto),
      totalRecebido: round2_(totalReceb),
      totalSCM_Total: round2_(totalSCM_Total),
      scmToSci: round2_(totalSCM_SCI),
      scmToSva: round2_(totalSCM_SVA),
      totalSVA_Total: round2_(totalSVA_Total),
      svaToScm: round2_(totalSVA_SC),
      svaToSci: round2_(totalSVA_SCI)
    });

    transferPanelLines.push({
      dataTxt: br,
      totalRecebido: round2_(totalReceb),
      scmToSci: round2_(totalSCM_SCI),
      scmToSva: round2_(totalSCM_SVA),
      svaToScm: round2_(totalSVA_SC),
      svaToSci: round2_(totalSVA_SCI)
    });
  }

  return { transferLines, transferPanelLines };
}
