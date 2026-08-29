import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryDataJudAggregation,
  TRIBUNAIS_DEFAULT,
  TPU_AEREA,
  TPU_JUS_GRATUITA,
} from "../../shared/datajud.ts";

// =============================================================================
// Função BFF: Índice de Justiça Gratuita no setor aéreo (proporção ao longo do tempo)
// -----------------------------------------------------------------------------
// Entrada (JSON): { "tribunals": ["tjsp", ...] }  (opcional)
// Saída: { "serie": [{ month, total, comGratuidade, semGratuidade, proporcao }],
//          "tribunais_ok": [...], "tribunais_falhas": [...] }
//
// Metodologia:
//   Dentro de cada bucket mensal (apenas processos aeronáuticos), conta-se
//   quantos possuem também o assunto "Assistência Judiciária Gratuita" (TPU 10685).
//   proporcao = comGratuidade / total * 100.
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
    // Query DSL (Elasticsearch) para o DataJud.
    //
    // - size: 0 -> apenas agregações, sem retorno de documentos.
    // - query.bool.must.terms sobre assunto.codigo -> filtra processos
    //   aeronáuticos (TPUs 11843/11844/11845).
    //
    // - aggs.evolucao_mensal.date_histogram (por mês, em dataAjuizamento):
    //     Dentro de cada mês, aninhamos uma sub-agregação "com_gratuidade" do
    //     tipo "filter", que conta os documentos daquele bucket que TAMBÉM
    //     possuem o assunto 10685 (Assistência Judiciária Gratuita).
    //     Assim obtemos, por mês: total (doc_count do bucket) e
    //     comGratuidade (com_gratuidade.doc_count).
    //
    // - min_doc_count: 1 aqui (somente meses com processos) para evitar ruído
    //   de meses vazios na análise de proporção.
    //
    // Nota metodológica alternativa:
    //   O deferimento da gratuidade também pode ser capturado via MOVIMENTOS
    //   processuais (ex.: movimento de nome "Concessão de benefício da
    //   gratuidade judiciária"). O campo "movimentos" é um array de objetos
    //   e exigiria uma query "nested" (movimentos.nome), que é mais custosa e
    //   varia entre tribunais. Para garantir cobertura nacional estável no
    //   DataJud público, optamos pelo critério de assunto (TPU 10685).
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
            min_doc_count: 1,
          },
          aggs: {
            com_gratuidade: {
              filter: {
                terms: { "assunto.codigo": [TPU_JUS_GRATUITA] },
              },
            },
          },
        },
      },
    };

    const results = await Promise.allSettled(
      tribunals.map((t) => queryDataJudAggregation(t, dsl))
    );

    const merged = new Map(); // month -> { total, comGratuidade }
    const ok = [];
    const falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status === "fulfilled") {
        const agg = r.value?.aggregations?.evolucao_mensal;
        if (agg?.buckets) {
          for (const b of agg.buckets) {
            const m = b.key_as_string;
            const cur = merged.get(m) || { total: 0, comGratuidade: 0 };
            cur.total += b.doc_count || 0;
            cur.comGratuidade += b.com_gratuidade?.doc_count || 0;
            merged.set(m, cur);
          }
        }
        ok.push(t);
      } else {
        falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) });
      }
    });

    const serie = [...merged.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({
        month,
        total: v.total,
        comGratuidade: v.comGratuidade,
        semGratuidade: v.total - v.comGratuidade,
        proporcao: v.total ? Number(((v.comGratuidade / v.total) * 100).toFixed(2)) : 0,
      }));

    return Response.json({ serie, tribunais_ok: ok, tribunais_falhas: falhas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}