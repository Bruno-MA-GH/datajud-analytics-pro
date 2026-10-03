// Gera uma planilha Excel (SpreadsheetML, abre no Excel/LibreOffice) com os dados
// brutos de uma análise: cada lista de registros vira uma aba; os valores
// avulsos (totais, índices, metadados) vão para a aba "Resumo".

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ehObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const celula = (v) => {
  if (v === null || v === undefined) return "<Cell/>";
  if (typeof v === "number" && Number.isFinite(v)) return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
  const t = typeof v === "object" ? JSON.stringify(v) : v;
  return `<Cell><Data ss:Type="String">${esc(t)}</Data></Cell>`;
};

// Achata objetos aninhados em colunas "a.b".
function achatar(o, pre = "", out = {}) {
  for (const [k, v] of Object.entries(o || {})) {
    const c = pre ? `${pre}.${k}` : k;
    if (ehObj(v)) achatar(v, c, out);
    else out[c] = Array.isArray(v) && v.every((x) => typeof x !== "object") ? v.join(", ") : v;
  }
  return out;
}

function coletar(valor, caminho, abas, resumo) {
  if (Array.isArray(valor)) {
    if (valor.length && valor.every((x) => ehObj(x))) abas.push([caminho, valor.map((x) => achatar(x))]);
    else if (valor.length && valor.some((x) => typeof x === "object")) abas.push([caminho, valor.map((x) => ({ valor: x }))]);
    else resumo.push([caminho, valor.join(", ")]);
  } else if (ehObj(valor)) {
    for (const [k, v] of Object.entries(valor)) coletar(v, caminho ? `${caminho}.${k}` : k, abas, resumo);
  } else resumo.push([caminho, valor]);
}

function aba(nome, linhas) {
  const cols = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
  const corpo = [cols.map(celula).join(""), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(""))];
  return `<Worksheet ss:Name="${esc(nome)}"><Table>${corpo.map((r) => `<Row>${r}</Row>`).join("")}</Table></Worksheet>`;
}

export function exportarPlanilha(consultas, dados, arquivo) {
  const abas = [];
  const resumo = [];
  consultas.forEach(([fn, p], i) => {
    const prefixo = consultas.length > 1 ? `${fn}${p?.rito ? `_${p.rito}` : ""}` : "";
    coletar(dados[i], prefixo, abas, resumo);
  });
  const usados = new Set();
  const nomeAba = (n) => {
    let base = (n || "dados").replace(/[\\/?*[\]:]/g, "_").slice(-28) || "dados";
    let nome = base, k = 2;
    while (usados.has(nome)) nome = `${base}_${k++}`;
    usados.add(nome);
    return nome;
  };
  const folhas = [
    aba(nomeAba("Resumo"), resumo.map(([campo, valor]) => ({ campo, valor }))),
    ...abas.map(([n, linhas]) => aba(nomeAba(n), linhas)),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${folhas.join("")}</Workbook>`;
  const url = URL.createObjectURL(new Blob([xml], { type: "application/vnd.ms-excel" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${arquivo}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}