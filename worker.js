// worker.js - Código para o Cloudflare Worker

// --- Configurações da API SGP ---
const SGP_BASE_URL = "https://sgp.etechinformaticatelecom.com.br/api/ura/clientes/";
const SGP_APP_NAME = "webchat"; // Confirme se este é o appName correto
const SGP_TOKEN = "3c39b482-5a6f-4319-abba-f58d2b2218d8"; // Confirme se este é o token correto

const TZ = "America/Sao_Paulo"; // Fuso horário para formatação de datas

// --- Tabelas de Configuração (Copiadas diretamente do seu App Script) ---
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
  "FTTH_200MB CORPORATIVO ESPECIAL": { valor:180, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_50MB LINHA DEDICADA":  { valor:180,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_10MB LINHA DEDICADA":  { valor:200,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_10MB LINHA DEDICADA (250)": { valor:250, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_20MB EMPRESARIAL":     { valor:200,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_300MB EMPRESARIAL":    { valor:400,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_300MB EMPRESARIAL (200)": { valor:200, scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_500MB CORPORATIVO":    { valor:200,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_700MB RESIDENCIAL (ESPECIAL) 1": { valor:200, scm:0.1170, sci:0.7160, sva:0.1670 },
  "FTTH_700MB RESIDENCIAL (ESPECIAL) 2": { valor:210, scm:0.1114, sci:0.7295, sva:0.1591 },
  "FTTH_100MB EMPRESARIAL (80)": { valor:80, scm:1.0, sci:0.0, sva:0.0 }, // redundante, mas ok
  "FTTH_700MB CORPORATIVO":    { valor:250,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_30MB LINHA DEDICADA":  { valor:300,  scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_40MB CORPORATIVO":     { valor:70,   scm:1.0, sci:0.0, sva:0.0 },
  "PLANO FUNCIONÁRIOS":        { valor:70,   scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_40MB RESIDENCIAL":     { valor:70,   scm:0.3343, sci:0.1886, sva:0.4771 },
  "HFC_20MB RESIDENCIAL":      { valor:70,   scm:0.3343, sci:0.1886, sva:0.4771 },
  "HFC_50MB RESIDENCIAL":      { valor:80,   scm:0.2925, sci:0.29, sva:0.4175 },
  "FTTH_100MB RESIDENCIAL":    { valor:80,   scm:0.2925, sci:0.29, sva:0.4175 },
  "FTTH_120MB EMPRESARIAL":    { valor:90,   scm:1.0, sci:0.0, sva:0.0 },
  "FTTH_120MB RESIDENCIAL":    { valor:90,   scm:0.26, sci:0.3689, sva:0.3711 },
  "HFC_80MB RESIDENCIAL":      { valor:90,   scm:0.26, sci:0.3689, sva:0.3711 },
  "📶Essencial": { valor: 84.99, scm:0.2753, sci:0.3317, sva:0.3930 },
  "📶Mini Plus": { valor: 109.99, scm:0.2128, sci:0.4836, sva:0.3036 },
  "📶Plus": { valor: 119.99, scm:0.1950, sci:0.5267, sva:0.2783 },
  "📶Ultra": { valor: 149.99, scm:0.1560, sci:0.6213, sva:0.2227 },
  "📶Max": { valor: 199.99, scm:0.1170, sci:0.7160, sva:0.1670 },
  "📶Premium": { valor: 209.99, scm:0.1114, sci:0.7295, sva:0.1591 },
  "📶Premium Plus": { valor: 249.99, scm:0.0936, sci:0.7738, sva:0.1326 },
  "📶Top": { valor: 299.99, scm:0.0780, sci:0.8179, sva:0.1041 },
  "📶Top Plus": { valor: 399.99, scm:0.0585, sci:0.8759, sva:0.0656 },
  "📶Ultimate": { valor: 499.99, scm:0.0468, sci:0.9087, sva:0.0445 },
  "📶Ultimate Plus": { valor: 599.99, scm:0.0390, sci:0.9298, sva:0.0312 },
  "📶Infinity": { valor: 799.99, scm:0.0293, sci:0.9549, sva:0.0158 },
  "📶Infinity Plus": { valor: 999.99, scm:0.0234, sci:0.9679, sva:0.0087 },
  "📶Gigabit": { valor: 1199.99, scm:0.0195, sci:0.9766, sva:0.0039 },
  "📶Gigabit Plus": { valor: 1499.99, scm:0.0156, sci:0.9845, sva:0.0000 }
};

// --- Funções Auxiliares (Adaptadas do seu App Script) ---

function pad2_(n) {
  n = Number(n) || 0;
  return (n < 10 ? "0" : "") + n;
}

function normalize_(s) {
  return (s || "").toString().trim().toUpperCase();
}

function round2_(n) {
  return Math.round(n * 100) / 100;
}

function extrairDataPagamentoISO_(rawDate, tz) {
  if (!rawDate) return null;

  let dateObj;
  if (rawDate instanceof Date) {
    dateObj = rawDate;
  } else {
    // Tenta parsear como string (YYYY-MM-DD, DD/MM/YYYY, ou com hora)
    const dateStr = rawDate.toString().trim();
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) { // YYYY-MM-DD
      dateObj = new Date(dateStr + "T00:00:00"); // Força UTC para evitar problemas de fuso
    } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) { // DD/MM/YYYY
      const parts = dateStr.split('/');
      dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    } else {
      dateObj = new Date(dateStr);
    }
  }

  if (isNaN(dateObj.getTime())) return null;

  // Formata para ISO YYYY-MM-DD no fuso horário especificado
  return new Date(dateObj.toLocaleString("en-US", { timeZone: tz }))
    .toISOString().substring(0, 10);
}

function empresaFromPortador_(portador) {
  const p = normalize_(portador);
  if (p.includes("SCM")) return "SCM";
  if (p.includes("SVA")) return "SVA";
  if (p.includes("SCI")) return "SCI";
  return "OUTROS";
}

function extrairIdsTitulo_(titulo) {
  const t = (titulo || "").toString().trim();
  const matchTituloID = t.match(/TituloID:(\d+)/i);
  const matchNossoNumero = t.match(/NossoNumero:(\d+)/i);
  const matchNumeroDocumento = t.match(/NumeroDocumento:(\d+)/i);

  return {
    tituloID: matchTituloID ? parseInt(matchTituloID[1], 10) : null,
    nossoNumero: matchNossoNumero ? parseInt(matchNossoNumero[1], 10) : null,
    numeroDocumento: matchNumeroDocumento ? parseInt(matchNumeroDocumento[1], 10) : null,
  };
}

function resolvePlanoInfo_(planoDesc, valorRecebido, valorBoleto, planosTabela) {
  const p = normalize_(planoDesc);
  let info = planosTabela[p];

  // Se não encontrou pelo nome exato, tenta encontrar pelo valor aproximado
  if (!info) {
    for (const key in planosTabela) {
      if (Math.abs(planosTabela[key].valor - valorRecebido) < 0.01 || Math.abs(planosTabela[key].valor - valorBoleto) < 0.01) {
        info = planosTabela[key];
        break;
      }
    }
  }

  return info || { valor: 0, scm: 0, sci: 0, sva: 0 }; // Retorna default se não encontrar
}

// --- Função Principal de Busca e Processamento de Pagamentos ---
async function fetchAndProcessPayments(dataInicio, dataFim) {
  const url = new URL(SGP_BASE_URL);
  url.searchParams.append("app_name", SGP_APP_NAME);
  url.searchParams.append("token", SGP_TOKEN);
  url.searchParams.append("data_inicio", dataInicio);
  url.searchParams.append("data_fim", dataFim);

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  let response;
  try {
    response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API SGP Error: ${response.status} - ${errorText}`);
      throw new Error(`Erro ao buscar dados da API SGP: ${response.statusText}`);
    }
    const data = await response.json();

    const processedPayments = [];
    const seenKeys = new Set(); // Para deduplicação

    // Simula o HEADER_DB para mapear os campos
    const HEADER_DB = [
      "Data Pagamento", "Valor Boleto", "Valor Pago", "Portador", "Plano",
      "Forma Pagamento", "ContratoID", "TituloID", "NossoNumero", "NumeroDocumento",
      "Valor SCM (R$)", "Valor SCI (R$)", "Valor SVA (R$)", "ChaveUnica"
    ];
    const idx = {};
    HEADER_DB.forEach((h, i) => idx[h] = i);

    data.forEach(item => {
      const dataPagamento = extrairDataPagamentoISO_(item.data_pagamento, TZ);
      if (!dataPagamento) return; // Ignora pagamentos sem data válida

      const valorBoleto = Number(item.valor_boleto || 0);
      const valorPago = Number(item.valor_pago || 0);
      const portador = normalize_(item.portador);
      const plano = normalize_(item.plano);
      const formaPagamento = normalize_(item.forma_pagamento);
      const contratoID = (item.contrato_id || "").toString().trim();
      const titulo = item.titulo || ""; // Usado para extrair IDs

      const { tituloID, nossoNumero, numeroDocumento } = extrairIdsTitulo_(titulo);

      // Deduplicação (lógica do seu App Script)
      let chaveUnica = "";
      if (tituloID) chaveUnica = `TID:${tituloID}`;
      else if (nossoNumero) chaveUnica = `NN:${nossoNumero}`;
      else if (numeroDocumento) chaveUnica = `ND:${numeroDocumento}`;

      // Fallback key se não houver IDs únicos
      const fallbackKey = [
        contratoID,
        dataPagamento,
        valorPago.toFixed(2),
        portador,
        plano,
        formaPagamento
      ].join("|");

      const finalKey = chaveUnica || fallbackKey;
      if (seenKeys.has(finalKey)) return; // Já processado
      seenKeys.add(finalKey);

      // === Cálculo de SCM/SCI/SVA ===
      let valorSCM = 0, valorSCI = 0, valorSVA = 0;
      const valorRecebido = valorPago > 0 ? valorPago : valorBoleto;

      // 1. Clientes Especiais
      const clienteEspecial = tabelaEspecialClientes.find(c =>
        normalize_(c.nome) === normalize_(item.cliente) || c.contratoId === parseInt(contratoID, 10)
      );

      if (clienteEspecial) {
        const tipoInfo = tabelaTipos[clienteEspecial.tipo];
        if (tipoInfo) {
          valorSCM = round2_(valorRecebido * tipoInfo.scm);
          valorSCI = round2_(valorRecebido * tipoInfo.sci);
          valorSVA = round2_(valorRecebido * tipoInfo.sva);
        }
      } else {
        // 2. Planos
        const planoInfo = resolvePlanoInfo_(plano, valorRecebido, valorBoleto, planosTabela);
        if (planoInfo && planoInfo.scm !== undefined) {
          valorSCM = round2_(valorRecebido * planoInfo.scm);
          valorSCI = round2_(valorRecebido * planoInfo.sci);
          valorSVA = round2_(valorRecebido * planoInfo.sva);
        }
      }

      processedPayments.push({
        dataPagamento: dataPagamento,
        valorBoleto: valorBoleto,
        valorPago: valorPago,
        portador: portador,
        plano: plano,
        formaPagamento: formaPagamento,
        contratoID: contratoID,
        tituloID: tituloID,
        nossoNumero: nossoNumero,
        numeroDocumento: numeroDocumento,
        valorSCM: valorSCM,
        valorSCI: valorSCI,
        valorSVA: valorSVA,
        chaveUnica: finalKey,
        cliente: item.cliente, // Adiciona o cliente para o relatório detalhado
        titulo: titulo // Adiciona o título para o relatório detalhado
      });
    });

    return processedPayments;

  } catch (e) {
    console.error("Erro em fetchAndProcessPayments:", e.message);
    throw e;
  }
}

// --- Funções de Agregação (Adaptadas do seu App Script) ---

function aggregateDashboardData(payments, startIso, endIso) {
  const seen = new Set();
  const rows = [];

  // Filtra e deduplica os pagamentos para o dashboard
  payments.forEach(r => {
    const data = r.dataPagamento;
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
    const plano = r.plano || "SEM_PLANO";
    const boleto = r.valorBoleto;
    const pago = r.valorPago;
    const recebido = pago > 0 ? pago : boleto;

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

  // Filtra e deduplica os pagamentos para as transferências
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

  // Loop pelos dias do período
  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    const iso = new Date(dt.toLocaleString("en-US", { timeZone: TZ })).toISOString().substring(0, 10);
    const br = new Date(dt.toLocaleString("en-US", { timeZone: TZ })).toLocaleDateString('pt-BR');

    const regs = (map[iso] ? map[iso].regs : []);
    const totalPag = regs.length;
    const totalBoleto = regs.reduce((s, x) => s + x.valorBoleto, 0);
    const totalReceb = regs.reduce((s, x) => s + x.valorPago, 0);

    const totalSCM_SC = regs.filter(x => empresaFromPortador_(x.port) === "SCM").reduce((s, x) => s + x.valorSCM, 0);
    const totalSCM_SCI = regs.filter(x => empresaFromPortador_(x.port) === "SCM").reduce((s, x) => s + x.valorSCI, 0);
    const totalSCM_SVA = regs.filter(x => empresaFromPortador_(x.port) === "SCM").reduce((s, x) => s + x.valorSVA, 0);
    const totalSCM_Total = totalSCM_SC + totalSCM_SCI + totalSCM_SVA;

    const totalSVA_SC = regs.filter(x => empresaFromPortador_(x.port) === "SVA").reduce((s, x) => s + x.valorSCM, 0);
    const totalSVA_SCI = regs.filter(x => empresaFromPortador_(x.port) === "SVA").reduce((s, x) => s + x.valorSCI, 0);
    const totalSVA_SVA = regs.filter(x => empresaFromPortador_(x.port) === "SVA").reduce((s, x) => s + x.valorSVA, 0);
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


// --- Event Listener Principal do Cloudflare Worker ---
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Permite requisições de qualquer origem (CORS)
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Lida com requisições OPTIONS (preflight CORS)
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // Rota para o endpoint único de dados financeiros
  if (url.pathname === "/dados-financeiros-periodo") {
    try {
      const dataInicio = url.searchParams.get("data_inicio");
      const dataFim = url.searchParams.get("data_fim");

      if (!dataInicio || !dataFim) {
        return new Response(JSON.stringify({ error: "Parâmetros 'data_inicio' e 'data_fim' são obrigatórios." }), {
          status: 400,
          headers,
        });
      }

      // 1. Buscar e processar pagamentos brutos
      const processedPayments = await fetchAndProcessPayments(dataInicio, dataFim);

      // 2. Gerar dados para o Dashboard
      const dashboardData = aggregateDashboardData(processedPayments, dataInicio, dataFim);

      // 3. Gerar dados para as Transferências
      const transferenciasData = aggregateTransferData(processedPayments, dataInicio, dataFim);

      // 4. Retornar todos os dados em um único objeto
      return new Response(JSON.stringify({
        pagamentosDetalhes: processedPayments,
        dashboard: dashboardData,
        transferencias: transferenciasData,
      }), { headers });

    } catch (e) {
      console.error("Erro no Worker:", e);
      return new Response(JSON.stringify({ error: "Erro interno do servidor", details: e.message }), {
        status: 500,
        headers,
      });
    }
  }

  // Rota padrão (ex: para a URL raiz do Worker)
  return new Response("Bem-vindo ao Worker de Relatórios Financeiros E-TECH! Use o endpoint /dados-financeiros-periodo.", { headers });
}
