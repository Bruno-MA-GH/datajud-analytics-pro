import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryTribunais,
  TRIBUNAIS_DEFAULT,
  ASSUNTOS_AEREA_NOMES,
  SCRIPT_DATA_AJUIZAMENTO_YYYYMM,
  toYearMonth,
} from "../../shared/datajud.ts";

// =============================================================================
// Função BFF: Evolução do volume de ações aeronáuticas (série histórica)
// -----------------------------------------------------------------------------
// Entrada (JSON): { "tribunals": ["tjsp", ...] }  (opcional; usa default se vazio)
// Saída: { "serie": [{ "month": "yyyy-MM", "count": N }],
//          "tribunais_ok": [...], "tribunais_falhas": [{tribunal, erro}] }
// =============================================================================

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tribunals =
      Array.isArray(body.tribunals) && body.tribunals.length
        ? body.tribunals
        : TRIBUNAIS_DEFAULT;

    // -------------------------------------------------------------------------
    // Query DSL (Elasticsearch) enviada ao DataJud.
    //
    // - "size": 0 -> retorna SOMENTE agregações (sem documentos), evitando o
    //   limite de 10k hits da paginação e reduzindo o payload.
    //
    // - "query.terms" sobre "assuntos.nome.keyword": filtra processos cujo
    //   assunto (TPU/CNJ) seja um dos nomes de Direito Aeronáutico (atraso,
    //   cancelamento e extravio de bagagem). Filtra por NOME (não por código)
    //   porque o código estadual varia por tribunal, enquanto o nome é
    //   padronizado nacionalmente — escolha metodológica para consistência.
    //
    // - "aggs.por_mes.terms" com "script": agrega por mês usando o script
    //   SCRIPT_DATA_AJUIZAMENTO_YYYYMM, que normaliza o dataAjuizamento
    //   (formatos mistos ISO/dígitos) em yyyyMM. size: 400 cobre ~33 anos.
    //   (Usamos terms+script em vez de date_histogram puro porque o
    //   date_histogram gera anos espúrios 26xx para registros mal-formatados.)
    // -------------------------------------------------------------------------
    const dsl = {
      size: 0,
      query: { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
      aggs: {
        por_mes: {
          terms: { script: { source: SCRIPT_DATA_AJUIZAMENTO_YYYYMM }, size: 400 },
        },
      },
    };

    // Dispara todos os tribunais em paralelo; falhas individuais não derrubam
    // o agregado (alguns índices podem estar indisponíveis).
    const results = await queryTribunais(tribunals, dsl, { req });

    const merged = new Map(); // "yyyy-MM" -> count
    const ok = [];
    const falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status === "fulfilled") {
        const buckets = r.value?.aggregations?.por_mes?.buckets || [];
        for (const b of buckets) {
          const month = toYearMonth(b.key);
          merged.set(month, (merged.get(month) || 0) + (b.doc_count || 0));
        }
        ok.push(t);
      } else {
        falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) });
      }
    });

    // Janela de estudo: de 2000-01 (início do histórico útil no DataJud para
    // esses assuntos) até o mês corrente. Remove artefatos de data
    // mal-formatada (ex.: "1900-01") e datas futuras espúrias.
    const agora = new Date();
    const corteSup = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    const serie = [...merged.entries()]
      .filter(([m]) => m >= "2000-01" && m <= corteSup)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    return Response.json({ serie, tribunais_ok: ok, tribunais_falhas: falhas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}