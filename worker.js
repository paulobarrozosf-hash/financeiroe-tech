// worker.js (JavaScript puro)

// --- Configurações da API SGP ---
const SGP_BASE_URL = "https://sgp.etechinformaticatelecom.com.br/api/ura/clientes/";
const TZ = "America/Sao_Paulo"; // Fuso horário para formatação de datas

// --- Tabelas de Configuração (replicadas do seu App Script) ---
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
  "FTTH_700MB RESIDENCIAL":    { valor:150,  scm:0.156, sci:0.6213, sva:0.2227 },

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
  "📶Max": { valor: 179.99, scm:0.1300, sci:0.6844, sva:0.1856 },
  "📶Premium Ultra": { valor: 159.99, scm:0.1463, sci:0.6449, sva:0.2088 },
  "📶Plus Max": { valor: 199.99, scm:0.1170, sci:0.7160, sva:0.1670 },

  "🎬Absolut Cinema": { valor: 159.99, scm:0.1463, sci:0.6449, sva:0.2088 },
  "🍿Cinema Premium": { valor: 189.99, scm:0.1232, sci:0.7010, sva:0.1758 },
  "📺E-Tech&SkyFull": { valor: 189.99, scm:0.1232, sci:0.7010, sva:0.1758 },
  "🩺Saúde Digital": { valor: 149.99, scm:0.1560, sci:0.6213, sva:0.2227 },
  "🧘🏻‍♀️Zen & Music": { valor: 149.99, scm:0.1560, sci:0.6213, sva:0.2227 },
  "🧸Kids": { valor: 129.99, scm:0.1800, sci:0.5631, sva:0.2569 },
  "📚Estudo & Leitura": { valor: 129.99, scm:0.1800, sci:0.5631, sva:0.2569 },
  "🎮Gamer Max": { valor: 119.99, scm:0.1950, sci:0.5267, sva:0.2783 },
  "🎧Sound e Bem-Estar": { valor: 119.99, scm:0.1950, sci:0.5267, sva:0.2783 }
};

// --- Funções utilitárias (replicadas do seu App Script) ---
function round2_(num) {
  return Math.round(num * 100) / 100;
}

function normalize_(str) {
  return (str || "").toString().trim().toUpperCase();
}

function extrairDataPagamentoISO_(dataPgRaw, tz) {
  if (!dataPgRaw) return null;

  let d;
  if (dataPgRaw instanceof Date) {
    d = dataPgRaw;
  } else if (typeof dataPgRaw === 'string') {
    // Tenta YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataPgRaw)) {
      d = new Date(dataPgRaw + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso horário
    }
    // Tenta DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataPgRaw)) {
      const parts = dataPgRaw.split('/');
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    }
    // Tenta string com hora (ISO ou similar)
    else {
      d = new Date(dataPgRaw);
    }
  }

  if (isNaN(d.getTime())) return null; // Data inválida

  // Formata para YYYY-MM-DD no fuso horário especificado
  return d.toLocaleString('sv', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
}

function empresaFromPortador_(portador) {
  const p = normalize_(portador);
  if (p.includes("SCM")) return "SCM";
  if (p.includes("SVA")) return "SVA";
  return null;
}

function buscarClienteEspecial(nome, contratoId) {
  return tabelaEspecialClientes.find(c => c.nome === nome || c.contratoId == contratoId);
}

function extrairIdsTitulo_(titulo) {
  const tituloId = titulo.tituloId || titulo.id || "";
  const nossoNumero = titulo.nosso_numero || titulo.nossoNumero || titulo.nossonumero || "";
  const numeroDocumento = titulo.numero_documento || titulo.numeroDocumento || "";

  const uniq = (tituloId || nossoNumero || numeroDocumento || "").toString().trim();

  return {
    tituloId: (tituloId || "").toString().trim(),
    nossoNumero: (nossoNumero || "").toString().trim(),
    numeroDocumento: (numeroDocumento || "").toString().trim(),
    uniq
  };
}

function resolvePlanoInfo_(planoDesc, valorRecebido, valorBoleto) {
  const def = { valor: Number(valorBoleto || 0), scm: 1.0, sci: 0.0, sva: 0.0 };
  if (!planoDesc) return def;

  if (planosTabela[planoDesc]) return planosTabela[planoDesc];

  const pNorm = normalize_(planoDesc);
  if (planosTabela[pNorm]) return planosTabela[pNorm];

  const base = pNorm.replace(/\s+|$\d+$|\s*$/, "").trim();
  const alvo = Math.round(Number(valorRecebido || valorBoleto || 0));

  const candidates = Object.keys(planosTabela)
    .filter(k => k === base || k.startsWith(base + " ("));

  if (candidates.length === 1) return planosTabela[candidates[0]];

  for (const k of candidates) {
    const info = planosTabela[k];
    if (Math.round(Number(info.valor || 0)) === alvo) return info;
  }

  if (planosTabela[base]) return planosTabela[base];

  return def;
}

// --- Lógica Principal do Worker ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Acessa diretamente as variáveis de ambiente do objeto 'env'
    const SGP_APP_NAME = env.SGP_APP_NAME;
    const SGP_TOKEN = env.SGP_TOKEN;

    // Adicionando logs para depuração
    console.log("SGP_APP_NAME lido:", SGP_APP_NAME ? "OK" : "NÃO ENCONTRADO");
    console.log("SGP_TOKEN lido:", SGP_TOKEN ? "OK" : "NÃO ENCONTRADO");

    // Apenas aceita requisições GET para /pagamentos
    if (url.pathname !== "/pagamentos" || request.method !== "GET") {
      return new Response("Not Found", { status: 404 });
    }

    const dataInicio = url.searchParams.get("inicio");
    const dataFim = url.searchParams.get("fim");

    if (!dataInicio || !dataFim) {
      return new Response(
        JSON.stringify({ error: "Parâmetros 'inicio' e 'fim' (YYYY-MM-DD) são obrigatórios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let offset = 0;
    const limit = 100;
    let continuarConsulta = true;
    let todosRegistros = []; // Array para armazenar os pagamentos processados
    const seenKeys = new Set(); // Para deduplicação

    while (continuarConsulta) {
      const payload = {
        app: "webchat",
        token: "3c39b482-5a6f-4319-abba-f58d2b2218d8",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      console.log("Payload enviado para SGP:", JSON.stringify(payload, null, 2)); // Log do payload

      let response;
      try {
        response = await fetch(SGP_BASE_URL, options);
      } catch (e) {
        console.error("Erro ao chamar API SGP:", e.message);
        return new Response(
          JSON.stringify({ error: "Erro ao conectar com a API SGP.", details: e.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API SGP retornou erro ${response.status}: ${errorText}`);
        return new Response(
          JSON.stringify({ error: `API SGP retornou erro: ${response.status}`, details: errorText }),
          { status: response.status, headers: { "Content-Type": "application/json" } }
        );
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
          if (!empresa) return; // Apenas processa pagamentos de SCM/SVA

          const contratoId = (titulo.contrato || titulo.contratoId || titulo.clientecontrato_id || "").toString().trim();
          if (!contratoId) return; // Contrato ID é essencial

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
            const planoInfo = resolvePlanoInfo_(planoDesc, valorRecebidoFinal, valorBoleto);
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
            contratoId,
            cliente: nome,
            cpfcnpj,
            plano: planoDesc,
            valorPlanoRef,
            valorBoleto,
            valorPago: valorRecebidoFinal,
            dataPagamento: dataIso,
            portador,
            endereco,
            cidade,
            uf,
            valorSCM,
            valorSCI,
            valorSVA,
            formaPagamento,
            tituloId: ids.tituloId,
            nossoNumero: ids.nossoNumero,
            numeroDocumento: ids.numeroDocumento,
            chaveUnica
          });
        });
      });

      offset += limit;
      // Pequeno delay para não sobrecarregar a API SGP, se necessário.
      // await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Retorna os dados processados
    return new Response(JSON.stringify(todosRegistros), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Permite acesso de qualquer origem (ajuste se precisar de CORS mais restrito)
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  },
};
