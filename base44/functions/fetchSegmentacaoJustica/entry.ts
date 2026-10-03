import { createClientFromRequest } from "npm:@base44/sdk@0.8.49";
import {
  queryTribunais,
  queryCumprimento,
  TRIBUNAIS_DEFAULT,
  ASSUNTOS_AEREA_NOMES,
  MOVIMENTOS_JUS_GRATUITA_NOMES,
  MOVIMENTOS_INDEFERIMENTO_NOMES,
  SCRIPT_DATA_AJUIZAMENTO_YYYYMM,
  queryRitoJE,
  toYearMonth,
} from "../../shared/datajud.ts";

// =============================================================================
// Função BFF: segmentação Juizado Especial (JE) × Justiça Comum (G1)
// -----------------------------------------------------------------------------
// Entrada (JSON): { "tribunals": ["tjsp", ...] }  (opcional)
// Saída: { serie: [{ month, je, comum, comumGratuidade, comumIndeferimento,
//                    jeGratuidadeMovimento }], tribunais_ok, tribunais_falhas }
//
// Metodologia:
//   - Rito definido pela CLASSE processual (queryRitoJE), com desempate pelo
//     grau nas classes genéricas. Mesmo universo do gráfico de volume, de modo
//     que JE + Comum = total de ações aéreas.
//   - No JE a gratuidade é ESTRUTURAL (Lei 9.099/95, art. 54): todo processo
//     de 1º grau dispensa custas, sem necessidade de deferimento.
//   - Na Justiça Comum a gratuidade é um BENEFÍCIO REAL, registrado pelo
//     movimento de concessão "Gratuidade da Justiça".
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

    const dsl = {
      size: 0,
      query: {
        bool: {
          filter: [
            { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
          ],
        },
      },
      aggs: {
        por_mes: {
          terms: { script: { source: SCRIPT_DATA_AJUIZAMENTO_YYYYMM }, size: 400 },
          aggs: {
            por_rito: {
              filters: {
                filters: { JE: queryRitoJE(), CUMPRIMENTO: queryCumprimento() },
                other_bucket_key: "COMUM",
              },
              aggs: {
                gratuidade: {
                  filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_JUS_GRATUITA_NOMES } },
                },
                indeferimento: {
                  filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_INDEFERIMENTO_NOMES } },
                },
              },
            },
          },
        },
      },
    };

    const results = await queryTribunais(tribunals, dsl, { req });

    const merged = new Map();
    const ok = [];
    const falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") {
        falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) });
        return;
      }
      for (const b of r.value?.aggregations?.por_mes?.buckets || []) {
        const month = toYearMonth(b.key);
        const cur = merged.get(month) || {
          je: 0, comum: 0, cumprimento: 0, comumGratuidade: 0, comumIndeferimento: 0, jeGratuidadeMovimento: 0,
        };
        cur.cumprimento += b.por_rito?.buckets?.CUMPRIMENTO?.doc_count || 0;
        const je = b.por_rito?.buckets?.JE || {};
        const comum = b.por_rito?.buckets?.COMUM || {};
        cur.je += je.doc_count || 0;
        cur.jeGratuidadeMovimento += je.gratuidade?.doc_count || 0;
        cur.comum += comum.doc_count || 0;
        cur.comumGratuidade += comum.gratuidade?.doc_count || 0;
        cur.comumIndeferimento += comum.indeferimento?.doc_count || 0;
        merged.set(month, cur);
      }
      ok.push(t);
    });

    const agora = new Date();
    const corteSup = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    const serie = [...merged.entries()]
      .filter(([m]) => m >= "2000-01" && m <= corteSup)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, ...v }));

    return Response.json({ serie, tribunais_ok: ok, tribunais_falhas: falhas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}