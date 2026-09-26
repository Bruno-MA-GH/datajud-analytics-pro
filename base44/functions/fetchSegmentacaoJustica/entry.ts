import { createClientFromRequest } from "npm:@base44/sdk@0.8.49";
import {
  queryDataJudAggregation,
  TRIBUNAIS_DEFAULT,
  ASSUNTOS_AEREA_NOMES,
  MOVIMENTOS_JUS_GRATUITA_NOMES,
  MOVIMENTOS_INDEFERIMENTO_NOMES,
  SCRIPT_DATA_AJUIZAMENTO_YYYYMM,
  GRAUS_ORIGEM,
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
//   - Campo "grau.keyword" do DataJud: JE = Juizado Especial; G1 = 1º grau da
//     Justiça Comum. Contamos apenas os graus de ORIGEM (JE e G1) — TR e G2
//     são fases recursais do mesmo processo e duplicariam a contagem.
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
            { terms: { "grau.keyword": GRAUS_ORIGEM } },
          ],
        },
      },
      aggs: {
        por_mes: {
          terms: { script: { source: SCRIPT_DATA_AJUIZAMENTO_YYYYMM }, size: 400 },
          aggs: {
            por_grau: {
              terms: { field: "grau.keyword", size: 5 },
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

    const results = await Promise.allSettled(
      tribunals.map((t) => queryDataJudAggregation(t, dsl))
    );

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
          je: 0, comum: 0, comumGratuidade: 0, comumIndeferimento: 0, jeGratuidadeMovimento: 0,
        };
        for (const g of b.por_grau?.buckets || []) {
          if (g.key === "JE") {
            cur.je += g.doc_count || 0;
            cur.jeGratuidadeMovimento += g.gratuidade?.doc_count || 0;
          } else if (g.key === "G1") {
            cur.comum += g.doc_count || 0;
            cur.comumGratuidade += g.gratuidade?.doc_count || 0;
            cur.comumIndeferimento += g.indeferimento?.doc_count || 0;
          }
        }
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