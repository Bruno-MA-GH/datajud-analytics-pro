import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryTribunais, queryCumprimento, TRIBUNAIS_DEFAULT, ASSUNTOS_AEREA_NOMES, MOVIMENTOS_ACORDO_NOMES, MOVIMENTOS_BAIXA_NOMES,
} from "../../shared/datajud.ts";

// =============================================================================
// Indicadores por tribunal: taxa de acordo, conversão em execução, movimentos
// por processo e índice de baixa/arquivamento proporcional às distribuições.
// =============================================================================

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const tribunals = Array.isArray(body.tribunals) && body.tribunals.length ? body.tribunals : TRIBUNAIS_DEFAULT;

    const dsl = {
      size: 0,
      track_total_hits: true,
      query: { bool: { filter: [
        { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
      ] } },
      aggs: {
        cumprimento: { filter: queryCumprimento() },
        // Numerador restrito às ações de conhecimento, o mesmo universo do denominador.
        acordo: { filter: { bool: {
          filter: [{ terms: { "movimentos.nome.keyword": MOVIMENTOS_ACORDO_NOMES } }],
          must_not: [queryCumprimento()],
        } } },
        baixa: { filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_BAIXA_NOMES } } },
        movimentos: { value_count: { field: "movimentos.dataHora" } },
      },
    };
    const results = await queryTribunais(tribunals, dsl, { req });
    const linhas = [], falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") { falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) }); return; }
      const a = r.value?.aggregations || {};
      const total = r.value?.hits?.total?.value || 0;
      if (!total) return;
      const cumprimento = a.cumprimento?.doc_count || 0;
      const conhecimento = total - cumprimento;
      linhas.push({
        tribunal: t,
        total,
        conhecimento,
        cumprimento,
        acordo: a.acordo?.doc_count || 0,
        baixados: a.baixa?.doc_count || 0,
        movimentosPorProcesso: (a.movimentos?.value || 0) / total,
      });
    });

    return Response.json({
      linhas: linhas.sort((a, b) => b.total - a.total),
      tribunais_ok: linhas.map((l) => l.tribunal),
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}