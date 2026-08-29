import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryDataJudAggregation,
  TRIBUNAIS_DEFAULT,
  TPU_AEREA,
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
    // Construção da query DSL (Elasticsearch) enviada ao DataJud.
    //
    // - "size": 0  -> não retorna documentos, SOMENTE agregações. Isso evita o
    //   limite de 10k hits da paginação e reduz drasticamente o payload.
    //
    // - "query.bool.must.terms" sobre "assunto.codigo": filtra os processos
    //   cujo assunto (TPU) seja um dos códigos de Direito Aeronáutico. O campo
    //   "assunto" no DataJud é um array de objetos {codigo, nome}; o subcampo
    //   "assunto.codigo" é indexado e aceita terms query diretamente.
    //
    // - "aggs.evolucao_mensal.date_histogram":
    //     * field = "dataAjuizamento" (data de ajuizamento do processo)
    //     * calendar_interval = "month"  -> buckets por mês civil
    //     * format = "yyyy-MM"            -> chave legível (ex.: "2019-03")
    //     * min_doc_count = 0             -> inclui meses sem processos,
    //       garantindo série temporal contínua (essencial para o gráfico).
    // -------------------------------------------------------------------------
    const dsl = {
      size: 0,
      query: {
        bool: {
          must: [{ terms: { "assunto.codigo": TPU_AEREA } }],
        },
      },
      aggs: {
        evolucao_mensal: {
          date_histogram: {
            field: "dataAjuizamento",
            calendar_interval: "month",
            format: "yyyy-MM",
            min_doc_count: 0,
          },
        },
      },
    };

    // Dispara todos os tribunais em paralelo; falhas individuais não derrubam
    // o resultado agregado (importante: alguns índices podem estar offline).
    const results = await Promise.allSettled(
      tribunals.map((t) => queryDataJudAggregation(t, dsl))
    );

    // Mescla os buckets mensais de cada tribunal somando doc_count por mês.
    const merged = new Map();
    const ok = [];
    const falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status === "fulfilled") {
        const agg = r.value?.aggregations?.evolucao_mensal;
        if (agg?.buckets) {
          for (const b of agg.buckets) {
            merged.set(b.key_as_string, (merged.get(b.key_as_string) || 0) + b.doc_count);
          }
        }
        ok.push(t);
      } else {
        falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) });
      }
    });

    const serie = [...merged.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    return Response.json({ serie, tribunais_ok: ok, tribunais_falhas: falhas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}