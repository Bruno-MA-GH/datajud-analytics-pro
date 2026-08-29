import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryDataJudAggregation,
  TRIBUNAIS_DEFAULT,
  ASSUNTOS_AEREA_NOMES,
  ASSUNTOS_JUS_GRATUITA_NOMES,
  SCRIPT_DATA_AJUIZAMENTO_YYYYMM,
  toYearMonth,
} from "../../shared/datajud.ts";

// =============================================================================
// Função BFF: Índice de Justiça Gratuita no setor aéreo (proporção ao longo do tempo)
// -----------------------------------------------------------------------------
// Entrada (JSON): { "tribunals": ["tjsp", ...] }  (opcional)
// Saída: { "serie": [{ month, total, comGratuidade, semGratuidade, proporcao }],
//          "tribunais_ok": [...], "tribunais_falhas": [...] }
//
// Metodologia:
//   Em cada mês (apenas processos aeronáuticos), conta-se quantos possuem
//   também o assunto "Assistência Judiciária Gratuita". proporcao = com/total.
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
    // - size: 0 -> apenas agregações.
    // - query.terms sobre "assuntos.nome.keyword": filtra processos aéreos.
    //
    // - aggs.por_mes.terms com script: bucket por yyyyMM (data normalizada).
    //   Sub-agregação "com_gratuidade" (filter): dentro de cada mês, conta os
    //   documentos que TAMBÉM possuem o assunto "Assistência Judiciária
    //   Gratuita" (ou variante "Justiça Gratuita"). Assim, por mês obtemos:
    //     total = doc_count do bucket
    //     comGratuidade = com_gratuidade.doc_count
    //
    // Nota metodológica: o deferimento da gratuidade também pode ser capturado
    // via MOVIMENTOS processuais (ex.: "Concessão de benefício da gratuidade
    // judiciária"), mas "movimentos" é array aninhado e varia entre tribunais.
    // Para cobertura nacional estável no DataJud público, usamos o critério de
    // ASSUNTO (TPU 10685 / nome "Assistência Judiciária Gratuita").
    // -------------------------------------------------------------------------
    const dsl = {
      size: 0,
      query: { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
      aggs: {
        por_mes: {
          terms: { script: { source: SCRIPT_DATA_AJUIZAMENTO_YYYYMM }, size: 400 },
          aggs: {
            com_gratuidade: {
              filter: {
                terms: { "assuntos.nome.keyword": ASSUNTOS_JUS_GRATUITA_NOMES },
              },
            },
          },
        },
      },
    };

    const results = await Promise.allSettled(
      tribunals.map((t) => queryDataJudAggregation(t, dsl))
    );

    const merged = new Map(); // "yyyy-MM" -> { total, comGratuidade }
    const ok = [];
    const falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status === "fulfilled") {
        const buckets = r.value?.aggregations?.por_mes?.buckets || [];
        for (const b of buckets) {
          const month = toYearMonth(b.key);
          const cur = merged.get(month) || { total: 0, comGratuidade: 0 };
          cur.total += b.doc_count || 0;
          cur.comGratuidade += b.com_gratuidade?.doc_count || 0;
          merged.set(month, cur);
        }
        ok.push(t);
      } else {
        falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) });
      }
    });

    // Janela de estudo: de 2000-01 até o mês corrente (remove artefatos de data
    // mal-formatada e datas futuras espúrias).
    const agora = new Date();
    const corteSup = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    const serie = [...merged.entries()]
      .filter(([m]) => m >= "2000-01" && m <= corteSup)
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