// worker.js (Código completo e corrigido para o Cloudflare Worker)

const SGP_BASE_URL = "https://sgp.etechinformaticatelecom.com.br/api/ura/clientes/";
const SGP_APP_NAME = "webchat"; // Substitua pelo seu appName real
const SGP_TOKEN = "3c39b482-5a6f-4319-abba-f58d2b2218d8"; // Substitua pelo seu token real

const TZ = "America/Sao_Paulo"; // Fuso horário para formatação de datas

// --- Tabelas de Configuração (Copie do seu App Script) ---
const tabelaEspecialClientes = [
  { nome: "ALINE PEREIRA MARTINS", contratoId: 28, valorBoleto: 130, tipo: 9 },
  { nome: "ANTONIO AURELIANO DUARTE", contratoId: 174, valorBoleto: 130, tipo: 8 },
  { nome: "FRANCISCO EDVALDO SERGIO DA SILVA", contratoId: 6718, valorBoleto: 130, tipo: 4 },
  { nome: "EDUARDO MUNIZ RODRIGUES", contratoId: 2650, valorBoleto: 150, tipo: 6 },
  { nome: "FRANCISCA BRUNA SILVA BONFIM", contratoId: 4458, valorBoleto: 150, tipo: 5 },
  { nome: "MARINA PEREIRA DE AQUINO OLIVEIRA", contratoId: 5475, valorBoleto: 160, tipo: 2 },
  { nome: "FRANCISCO JOZINILTON GALDINO", contratoId: 2543, valorBoleto: 170, tipo: 10 },
  { nome: "NAYRA INGREDY SILVA COSTA", contratoId: 742, valorBoleto: 180, tipo: 10 },
  { nome: "RANIELLE MARIA DA SILVA SOUSA OLIVEIRA", contratoId: 5284, valorBoleto: 180, tipo: 1 },
  { nome: "RITA DE CASSIA QUEIROZ DA BANDEIRA", contratoId: 1965, valorBoleto: 180, tipo: 1 },
  { nome: "GERALDO MARINHO FILHO", contratoId: 975, valorBoleto: 200, tipo: 10 },
  { nome: "MARCIO CELIO DUARTE LIMA", contratoId: 3109, valorBoleto: 270, tipo: 3 },
  { nome: "ANTONIO CESAR DE SOUSA LOPES", contratoId: 601, valorBoleto: 420, tipo: 7 },
  { nome: "JAMILE BEZERRA PEREIRA FLORENCIO", contratoId: 3631, valorBoleto: 200, tipo: 10 }
];

const tabelaTipos = {
  1: { scm: 0.26, sci: 0.3689, sva: 0.3711 },
  2: { scm: 0.2632, sci: 0.3610, sva: 0.3758 },
  3: { scm: 0.2514, sci: 0.3899, sva: 0.3587 },
  4: { scm: 0.2925, sci: 0.29, sva: 0.4175 },
  5: { scm: 0.3120, sci: 0.2427, sva: 0.4453 },
  6: { scm: 0.3817, sci: 0.2675, sva: 0.3508 },
  7: { scm: 0.2730, sci: 0.3374, sva: 0.3896 },
  8: { scm: 0.3086, sci: 0.2510, sva: 0.4404 },
  9: { scm: 0.3670, sci: 0.2572, sva: 0.3758 },
  10:{ scm: 0.2340, sci: 0.4320, sva: 0.3340 }
};

const planosTabela = {
  "FTTH_150MB LINHA DEDICADA": { valor:1300, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_100MB LINHA DEDICADA": { valor:1500, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_100MB LINHA DEDICADA (240)": { valor:240, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_100MB CORPORATIVO":    { valor:100,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_100MB EMPRESARIAL":    { valor:250,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_100MB EMPRESARIAL (80)": { valor:80, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_200MB EMPRESARIAL":    { valor:600,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_200MB EMPRESARIAL (100)": { valor:100, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_300MB RESIDENCIAL":    { valor:100,  scm:0.234, sci:0.432, sva:0.334 },
  "HFC_100MB RESIDENCIAL":     { valor:100,  scm:0.234, sci:0.432, sva:0.334 },
  "FTTH_350MB RESIDENCIAL":    { valor:110,  scm:0.2127, sci:0.4836, sva:0.3036 },
  "FTTH_400MB RESIDENCIAL":    { valor:120,  scm:0.195, sci:0.5267, sva:0.2783 },
  "FTTH_200MB CORPORATIVO":    { valor:130,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_300MB - CORPORATIVO ESCOLA PDDE": { valor:130, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_400MB EMPRESARIAL":    { valor:130,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_500MB RESIDENCIAL":    { valor:130,  scm:0.18, sci:0.5631, sva:0.2569 },
  "HFC_130MB RESIDENCIAL":     { valor:130,  scm:0.18, sci:0.5631, sva:0.2569 },
  "FTTH_100MB LINK BACKUP":    { valor:150,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_200MB LINHA DEDICADA": { valor:150,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_300MB CORPORATIVO":    { valor:150,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_500MB EMPRESARIAL":    { valor:150,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_600MB RESIDENCIAL":    { valor:150,  scm:0.156, sci:0.6189, sva:0.2251 },
  "HFC_150MB RESIDENCIAL":     { valor:150,  scm:0.156, sci:0.6189, sva:0.2251 },
  "FTTH_1GB RESIDENCIAL":      { valor:200,  scm:0.117, sci:0.729, sva:0.154 },
  "HFC_200MB RESIDENCIAL":     { valor:200,  scm:0.117, sci:0.729, sva:0.154 },
  "FTTH_2GB RESIDENCIAL":      { valor:300,  scm:0.078, sci:0.838, sva:0.084 },
  "HFC_300MB RESIDENCIAL":     { valor:300,  scm:0.078, sci:0.838, sva:0.084 },
  "FTTH_3GB RESIDENCIAL":      { valor:400,  scm:0.0585, sci:0.889, sva:0.0525 },
  "HFC_400MB RESIDENCIAL":     { valor:400,  scm:0.0585, sci:0.889, sva:0.0525 },
  "FTTH_5GB RESIDENCIAL":      { valor:500,  scm:0.0468, sci:0.919, sva:0.0342 },
  "HFC_500MB RESIDENCIAL":     { valor:500,  scm:0.0468, sci:0.919, sva:0.0342 },
  "FTTH_10GB RESIDENCIAL":     { valor:1000, scm:0.0234, sci:0.959, sva:0.0176 },
  "HFC_1GB RESIDENCIAL":       { valor:1000, scm:0.0234, sci:0.959, sva:0.0176 },
  "FTTH_20GB RESIDENCIAL":     { valor:2000, scm:0.0117, sci:0.979, sva:0.0093 },
  "HFC_2GB RESIDENCIAL":       { valor:2000, scm:0.0117, sci:0.979, sva:0.0093 },
  "FTTH_50GB RESIDENCIAL":     { valor:5000, scm:0.00468, sci:0.991, sva:0.00432 },
  "HFC_5GB RESIDENCIAL":       { valor:5000, scm:0.00468, sci:0.991, sva:0.00432 },
  "FTTH_100GB RESIDENCIAL":    { valor:10000, scm:0.00234, sci:0.995, sva:0.00266 },
  "HFC_10GB RESIDENCIAL":      { valor:10000, scm:0.00234, sci:0.995, sva:0.00266 },
  "FTTH_200GB RESIDENCIAL":    { valor:20000, scm:0.00117, sci:0.997, sva:0.00183 },
  "HFC_20GB RESIDENCIAL":      { valor:20000, scm:0.00117, sci:0.997, sva:0.00183 },
  "FTTH_500GB RESIDENCIAL":    { valor:50000, scm:0.000468, sci:0.999, sva:0.000532 },
  "HFC_50GB RESIDENCIAL":      { valor:50000, scm:0.000468, sci:0.999, sva:0.000532 },
  "FTTH_1TB RESIDENCIAL":      { valor:100000, scm:0.000234, sci:0.999, sva:0.000766 },
  "HFC_100GB RESIDENCIAL":     { valor:100000, scm:0.000234, sci:0.999, sva:0.000766 }
};

// --- Funções Auxiliares (Copie do seu App Script) ---
function normalize_(s) {
  return (s || "").toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function round2_(n) {
  return Math.round(n * 100) / 100;
}

function extrairDataPagamentoISO_(rawDate, tz) {
  if (!rawDate) return null;

  let dateObj;
  if (rawDate instanceof Date) {
    dateObj = rawDate;
  } else if (typeof rawDate === 'string') {
    // Tenta parsear como YYYY-MM-DD
    const isoMatch = rawDate.match(/^(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) {
      dateObj = new Date(isoMatch[1] + 'T00:00:00'); // Garante fuso horário neutro para ISO
    } else {
      // Tenta parsear como DD/MM/YYYY ou outras strings comuns
      dateObj = new Date(rawDate);
    }
  }

  if (isNaN(dateObj.getTime())) {
    return null;
  }

  // Formata para ISO YYYY-MM-DD no fuso horário especificado
  return new Date(dateObj.toLocaleString("en-US", { timeZone: tz }))
    .toISOString().substring(0, 10);
}

function empresaFromPortador_(portador) {
  const p = normalize_(portador);
  if (p.includes("SCM")) return "SCM";
  if (p.includes("SVA")) return "SVA";
  return "OUTROS";
}

function extrairIdsTitulo_(titulo) {
  const s = (titulo || "").toString();
  const match = s.match(/(\d+)\/(\d+)\/(\d+)/); // TituloID/NossoNumero/NumeroDocumento
  if (match) {
    return {
      tituloId: match[1],
      nossoNumero: match[2],
      numeroDocumento: match[3]
    };
  }
  return { tituloId: "", nossoNumero: "", numeroDocumento: "" };
}

function resolvePlanoInfo_(planoDesc, valorRecebido, valorBoleto, planosTabela) {
  const def = { valor: 0, scm: 0, sci: 0, sva: 0 };
  if (!planoDesc) return def;

  const p = normalize_(planoDesc);
  const alvo = Math.round(valorRecebido > 0 ? valorRecebido : valorBoleto);

  // Tenta match exato
  if (planosTabela[planoDesc]) return planosTabela[planoDesc];

  // Tenta match parcial (ex: "FTTH_300MB RESIDENCIAL" vs "FTTH_300MB RESIDENCIAL (100)")
  const base = p.split('(')[0].trim();
  const candidates = Object.keys(planosTabela)
    .filter(k => k === base || k.startsWith(base + " ("));

  if (candidates.length === 1) return planosTabela[candidates[0]];

  // se houver vários, tenta pelo valor
  for (const k of candidates) {
    const info = planosTabela[k];
    if (Math.round(Number(info.valor||0)) === alvo) return info;
  }

  // fallback: se existir base direto, usa
  if (planosTabela[base]) return planosTabela[base];

  return def;
}

function indexByHeader_(header) {
  const idx = {};
  header.forEach((h, i) => { idx[h] = i; });
  return idx;
}

function rowToReg_(r, idx, dataIso) {
  const ids = extrairIdsTitulo_(r[idx["Título"]]);
  const planoInfo = resolvePlanoInfo_(
    r[idx["Plano"]],
    Number(r[idx["Valor Pago"]] || 0),
    Number(r[idx["Valor Boleto"]] || 0),
    planosTabela
  );

  const valorPago = Number(r[idx["Valor Pago"]] || 0);
  const valorBoleto = Number(r[idx["Valor Boleto"]] || 0);
  const valorRecebido = valorPago > 0 ? valorPago : valorBoleto;

  return {
    dataPagamento: dataIso,
    titulo: r[idx["Título"]],
    tituloId: ids.tituloId,
    nossoNumero: ids.nossoNumero,
    numeroDocumento: ids.numeroDocumento,
    cliente: r[idx["Cliente"]],
    contratoId: r[idx["ContratoID"]],
    plano: r[idx["Plano"]],
    formaPagamento: r[idx["Forma Pagamento"]],
    portador: r[idx["Portador"]],
    valorBoleto: valorBoleto,
    valorPago: valorPago,
    valorRecebido: valorRecebido,
    valorSCM: round2_(valorRecebido * planoInfo.scm),
    valorSCI: round2_(valorRecebido * planoInfo.sci),
    valorSVA: round2_(valorRecebido * planoInfo.sva),
    chaveUnica: `${ids.tituloId}|${ids.nossoNumero}|${ids.numeroDocumento}|${dataIso}|${valorPago.toFixed(2)}`
  };
}

// --- Funções de Fetch e Processamento da API SGP ---
async function fetchAndProcessPayments(dataInicio, dataFim) {
  const url = `${SGP_BASE_URL}?data_inicio=${dataInicio}&data_fim=${dataFim}&app_name=${SGP_APP_NAME}&token=${SGP_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na API SGP: ${response.status} - ${errorText}`);
      throw new Error(`Erro ao buscar dados da API SGP: ${response.statusText}`);
    }
    const rawData = await response.json();

    const header = [
      "Título", "Cliente", "ContratoID", "Plano", "Forma Pagamento",
      "Portador", "Valor Boleto", "Valor Pago", "Data Pagamento"
    ];
    const idx = indexByHeader_(header);

    const seen = new Set();
    const processedPayments = [];

    rawData.forEach(r => {
      const dataIso = extrairDataPagamentoISO_(r[idx["Data Pagamento"]], TZ);
      if (!dataIso) return; // Ignora registros sem data válida

      const reg = rowToReg_(r, idx, dataIso);

      // Deduplicação forte usando a chave única
      if (seen.has(reg.chaveUnica)) return;
      seen.add(reg.chaveUnica);

      processedPayments.push(reg);
    });

    return processedPayments;

  } catch (error) {
    console.error("Erro ao buscar ou processar pagamentos:", error);
    throw error;
  }
}

// --- Funções de Agregação (Dashboard e Transferências) ---
function aggregateDashboardData(payments, startIso, endIso) {
  const seen = new Set();
  const rows = [];

  payments.forEach(r => {
    // Filtra por período aqui, se a busca inicial trouxe mais dados
    if (!r.dataPagamento || r.dataPagamento < startIso || r.dataPagamento > endIso) return;

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
    const recebido = r.valorRecebido;

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

function aggregateTransferData(payments, startIso, endIso) {
  const seen = new Set();
  const rows = [];

  payments.forEach(r => {
    // Filtra por período aqui, se a busca inicial trouxe mais dados
    if (!r.dataPagamento || r.dataPagamento < startIso || r.dataPagamento > endIso) return;

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

  // Loop pelos dias do período
  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    const iso = new Date(dt.toLocaleString("en-US", { timeZone: TZ })).toISOString().substring(0, 10);
    const br = new Date(dt.toLocaleString("en-US", { timeZone: TZ })).toLocaleDateString('pt-BR');

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


// --- Handler Principal do Cloudflare Worker ---
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Permite qualquer origem para desenvolvimento
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Lida com requisições OPTIONS (preflight CORS)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (url.pathname === '/dados-financeiros-periodo') {
    const dataInicio = url.searchParams.get('inicio');
    const dataFim = url.searchParams.get('fim');

    if (!dataInicio || !dataFim) {
      return new Response(JSON.stringify({ error: 'Parâmetros "inicio" e "fim" são obrigatórios.' }), { status: 400, headers });
    }

    try {
      // 1. Busca e processa os pagamentos brutos da API SGP
      const processedPayments = await fetchAndProcessPayments(dataInicio, dataFim);

      // 2. Agrega os dados para o Dashboard
      const dashboardData = aggregateDashboardData(processedPayments, dataInicio, dataFim);

      // 3. Agrega os dados para as Transferências
      const transferData = aggregateTransferData(processedPayments, dataInicio, dataFim);

      // 4. Retorna todos os dados em uma única resposta
      return new Response(JSON.stringify({
        pagamentosDetalhes: processedPayments,
        dashboard: dashboardData,
        transferencias: transferData
      }), { headers });

    } catch (error) {
      console.error("Erro no Worker ao processar dados financeiros:", error);
      return new Response(JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }), { status: 500, headers });
    }
  }

  // Resposta padrão para rotas não encontradas
  return new Response(JSON.stringify({ message: 'Endpoint não encontrado. Tente /dados-financeiros-periodo' }), { status: 404, headers });
}
