import { createClientFromRequest } from "npm:@base44/sdk@0.8.49";
import {
  queryTribunais,
  queryCumprimento,
  TRIBUNAIS_DEFAULT,
  ASSUNTOS_AEREA_NOMES,
} from "../../shared/datajud.ts";

// =============================================================================
// Função BFF: curva de concentração e índice de concentração (Gini adaptado)
// -----------------------------------------------------------------------------
// Municípios ordenados por PIB per capita (PIB 2023 / população Censo 2022,
// IBGE-SIDRA). X = população acumulada; Y = ações aéreas acumuladas.
// Índice > 0: litigância concentrada nos municípios mais ricos; < 0: nos pobres.
// Contagem: apenas ações originárias (graus JE/G1), sem cumprimento de sentença,
// para não atribuir recursos à sede do tribunal nem contar a mesma ação 2 vezes.
// Município ausente no DataJud (ex.: TJSP) é recuperado pelo nome da vara.
// =============================================================================

// Código IBGE da UF de cada TJ estadual (define o universo populacional).
const UF_TJ = {
  tjsp: "35", tjrj: "33", tjmg: "31", tjrs: "43", tjpr: "41", tjba: "29",
  tjce: "23", tjpe: "26", tjsc: "42", tjgo: "52", tjdft: "53", tjes: "32",
  tjmt: "51", tjms: "50", tjpa: "15", tjam: "13", tjal: "27", tjse: "28",
  tjpb: "25", tjrn: "24", tjpi: "22", tjma: "21", tjto: "17", tjro: "11",
  tjac: "12", tjap: "16", tjrr: "14",
};

// Foros regionais da Capital paulista (não são municípios).
const FOROS_SP_CAPITAL = [
  "CENTRAL", "JABAQUARA", "PINHEIROS", "SANTO AMARO", "LAPA", "SANTANA",
  "TATUAPE", "ITAQUERA", "PENHA", "PENHA DE FRANCA", "IPIRANGA", "VILA PRUDENTE",
  "BUTANTA", "NOSSA SENHORA DO O", "SAO MIGUEL PAULISTA", "PARELHEIROS",
  "VERGUEIRO", "FAZENDA PUBLICA", "JOAO MENDES", "EXPRESSO",
];

// Grafias divergentes nos nomes das varas (ortografia antiga, erros de digitação)
// e foro regional de Campinas (Vila Mimosa).
const ALIASES = [
  [/\bMOJI\b/g, "MOGI"],
  [/\bINDAIATUVA\b/g, "INDAIATUBA"],
  [/\bBRODOSQUI\b/g, "BRODOWSKI"],
  [/\bVILA MIMOSA\b/g, "CAMPINAS"],
];

// "Comarca da Capital" -> nome da capital da UF.
const CAPITAIS = { "42": "FLORIANOPOLIS", "51": "CUIABA", "50": "CAMPO GRANDE", "13": "MANAUS", "15": "BELEM" };

const norm = (s) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ").trim();

async function sidra(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`IBGE SIDRA HTTP ${r.status}`);
  return (await r.json()).slice(1);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tribunals =
      Array.isArray(body.tribunals) && body.tribunals.length ? body.tribunals : TRIBUNAIS_DEFAULT;

    const [pibRows, popRows] = await Promise.all([
      sidra("https://apisidra.ibge.gov.br/values/t/5938/n6/all/v/37/p/2023"),
      sidra("https://apisidra.ibge.gov.br/values/t/4709/n6/all/v/93/p/2022"),
    ]);
    const mun = new Map(); // codigo -> { nome, uf, pib, pop, casos }
    for (const r of popRows) {
      const pop = Number(r.V);
      if (pop > 0) mun.set(r.D1C, { nome: r.D1N, uf: r.D1C.slice(0, 2), pop, pib: null, casos: 0 });
    }
    for (const r of pibRows) {
      const m = mun.get(r.D1C);
      if (m && Number(r.V) > 0) m.pib = Number(r.V) * 1000;
    }
    // Índice de nomes por UF para a recuperação pelo nome da vara.
    const nomesPorUF = new Map();
    for (const [cod, m] of mun) {
      const n = norm(m.nome.replace(/ - [A-Z]{2}$/, ""));
      if (!nomesPorUF.has(m.uf)) nomesPorUF.set(m.uf, []);
      nomesPorUF.get(m.uf).push({ n, cod });
    }
    for (const l of nomesPorUF.values()) l.sort((a, b) => b.n.length - a.n.length);

    const dsl = {
      size: 0,
      track_total_hits: true,
      query: {
        bool: {
          filter: [
            { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
            { terms: { "grau.keyword": ["JE", "G1"] } },
          ],
          must_not: [queryCumprimento()],
        },
      },
      aggs: {
        mun: { terms: { field: "orgaoJulgador.codigoMunicipioIBGE", size: 1000 } },
        sem_mun: {
          missing: { field: "orgaoJulgador.codigoMunicipioIBGE" },
          aggs: { varas: { terms: { field: "orgaoJulgador.nome.keyword", size: 3000 } } },
        },
      },
    };

    const results = await queryTribunais(tribunals, dsl, { req });
    const ok = [];
    const falhas = [];
    const recuperacao = [];
    let totalOrigem = 0;
    let foraDoUniverso = 0;

    const somar = (cod, n) => {
      const m = mun.get(String(cod));
      if (m) m.casos += n; else foraDoUniverso += n;
    };

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") {
        falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) });
        return;
      }
      ok.push(t);
      const a = r.value.aggregations;
      totalOrigem += r.value.hits?.total?.value || 0;
      for (const b of a.mun.buckets) somar(b.key, b.doc_count);

      const semMun = a.sem_mun.doc_count;
      if (!semMun) return;
      const uf = UF_TJ[t];
      const lista = uf ? nomesPorUF.get(uf) || [] : [];
      const rel = { tribunal: t, semMunicipio: semMun, recuperados: 0, porForoCapital: 0, naoRecuperados: [] };
      for (const b of a.sem_mun.varas.buckets) {
        let nome = norm(b.key);
        for (const [de, para] of ALIASES) nome = nome.replace(de, para);
        // Sufixos de sistema (TJMT: "- SDCR") e trechos após "COMARCA DE X".
        nome = nome.replace(/ SDCR$/, "");
        const mCom = nome.match(/COMARCA (?:DE|DA|DO) (.+)$/);
        if (mCom) nome = mCom[1] === "CAPITAL" && CAPITAIS[uf] ? CAPITAIS[uf] : mCom[1];
        let cod = null;
        if (uf === "35" && FOROS_SP_CAPITAL.some((f) => nome.endsWith(" DE " + f) || nome.endsWith(" " + f))) {
          cod = "3550308";
          rel.porForoCapital += b.doc_count;
        } else {
          const hit = lista.find((x) => nome.endsWith(" " + x.n) || nome.startsWith(x.n + " ") || nome === x.n);
          if (hit) cod = hit.cod;
        }
        if (cod) { somar(cod, b.doc_count); rel.recuperados += b.doc_count; }
        else rel.naoRecuperados.push({ vara: b.key, processos: b.doc_count });
      }
      const outros = semMun - a.sem_mun.varas.buckets.reduce((s, b) => s + b.doc_count, 0);
      if (outros > 0) rel.naoRecuperados.push({ vara: "(demais varas fora da agregação)", processos: outros });
      rel.naoRecuperadosTotal = semMun - rel.recuperados;
      rel.naoRecuperados = rel.naoRecuperados.sort((x, y) => y.processos - x.processos).slice(0, 25);
      recuperacao.push(rel);
    });

    // Universo: municípios das UFs cujos TJs responderam, com PIB conhecido.
    const ufs = new Set(ok.map((t) => UF_TJ[t]).filter(Boolean));
    const universo = [...mun.values()]
      .filter((m) => ufs.has(m.uf) && m.pib)
      .map((m) => ({ ...m, pibpc: m.pib / m.pop }))
      .sort((a, b) => a.pibpc - b.pibpc);
    const casosForaUF = [...mun.values()].filter((m) => !ufs.has(m.uf)).reduce((s, m) => s + m.casos, 0);
    // Municípios das UFs consultadas sem PIB na base do IBGE: saem do universo.
    const semPibMun = [...mun.values()].filter((m) => ufs.has(m.uf) && !m.pib);
    const casosSemPib = semPibMun.reduce((s, m) => s + m.casos, 0);
    const semMunicipio = recuperacao.reduce((s, r) => s + r.naoRecuperadosTotal, 0);
    const recuperados = recuperacao.reduce((s, r) => s + r.recuperados, 0);

    const popTotal = universo.reduce((s, m) => s + m.pop, 0);
    const casosTotal = universo.reduce((s, m) => s + m.casos, 0);

    // Curva de concentração + índice (regra do trapézio).
    let x = 0, y = 0, soma = 0;
    const curva = [{ pop: 0, casos: 0 }];
    for (const m of universo) {
      const nx = x + m.pop / popTotal;
      const ny = y + m.casos / casosTotal;
      soma += (nx - x) * (ny + y);
      x = nx; y = ny;
      // Um ponto por município, para identificação no gráfico.
      curva.push({
        pop: +(x * 100).toFixed(3), casos: +(y * 100).toFixed(3), pibpc: Math.round(m.pibpc),
        municipio: m.nome, habitantes: m.pop, acoes: m.casos,
      });
    }
    const indice = 1 - soma;

    // Decis populacionais: taxa por 100 mil habitantes.
    const decis = Array.from({ length: 10 }, (_, i) => ({ decil: i + 1, pop: 0, casos: 0, pibpcMax: 0 }));
    let acc = 0;
    for (const m of universo) {
      const d = Math.min(9, Math.floor((acc / popTotal) * 10));
      decis[d].pop += m.pop; decis[d].casos += m.casos; decis[d].pibpcMax = Math.round(m.pibpc);
      acc += m.pop;
    }
    decis.forEach((d) => { d.taxa100k = d.pop ? +((d.casos / d.pop) * 1e5).toFixed(1) : 0; });

    return Response.json({
      indice: +indice.toFixed(4),
      curva,
      decis,
      cobertura: {
        totalOrigem,
        noUniverso: casosTotal,
        foraDoUniverso: foraDoUniverso + casosForaUF,
        semPib: casosSemPib,
        municipiosSemPib: semPibMun.filter((m) => m.casos).map((m) => ({ nome: m.nome, acoes: m.casos })),
        semMunicipio,
        recuperados,
        municipios: universo.length,
        populacao: popTotal,
        ufs: [...ufs],
      },
      recuperacao,
      tribunais_ok: ok,
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}