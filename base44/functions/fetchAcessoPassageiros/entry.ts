import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryTribunais, queryCumprimento, TRIBUNAIS_DEFAULT, ASSUNTOS_AEREA_NOMES, GRAUS_ORIGEM, SCRIPT_DATA_AJUIZAMENTO_YYYYMM,
} from "../../shared/datajud.ts";
import { ANAC_PASSAGEIROS_UF, ANAC_ANO_INICIAL, ANAC_ANO_FINAL } from "../../shared/anacPassageiros.ts";

// =============================================================================
// Acesso à justiça por UF: ações aéreas originárias (JE/G1) por 100 mil
// passageiros (ANAC), no mesmo recorte de anos (2015–2025). Apenas TJs.
// =============================================================================
const ufDe = (t) => (t === "tjdft" ? "DF" : t.slice(2).toUpperCase());

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const pedidos = Array.isArray(body.tribunals) && body.tribunals.length ? body.tribunals : TRIBUNAIS_DEFAULT;
    const tribunals = pedidos.filter((t) => t.startsWith("tj") && ANAC_PASSAGEIROS_UF[ufDe(t)]);

    const dsl = {
      size: 0,
      query: { bool: {
        filter: [
          { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
          { terms: { "grau.keyword": GRAUS_ORIGEM } },
        ],
        must_not: [queryCumprimento()],
      } },
      aggs: { mes: { terms: { script: { source: SCRIPT_DATA_AJUIZAMENTO_YYYYMM }, size: 1000 } } },
    };
    const results = await queryTribunais(tribunals, dsl);
    const linhas = [], falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") { falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) }); return; }
      const uf = ufDe(t);
      // Cada passageiro conta uma vez: a base soma embarques e desembarques, então divide-se por 2.
      const pax = ANAC_PASSAGEIROS_UF[uf].map((v) => Math.round(v / 2));
      const porAno = {};
      for (const b of r.value?.aggregations?.mes?.buckets || []) {
        const ano = Math.floor(Number(b.key) / 100);
        if (ano >= ANAC_ANO_INICIAL && ano <= ANAC_ANO_FINAL) porAno[ano] = (porAno[ano] || 0) + b.doc_count;
      }
      const acoes = Object.values(porAno).reduce((s, v) => s + v, 0);
      const passageiros = pax.reduce((s, v) => s + v, 0);
      linhas.push({
        tribunal: t, uf, acoes, passageiros,
        taxa: passageiros ? (acoes / passageiros) * 100000 : 0,
        serie: pax.map((p, k) => {
          const ano = ANAC_ANO_INICIAL + k;
          return { ano, acoes: porAno[ano] || 0, passageiros: p, taxa: p ? ((porAno[ano] || 0) / p) * 100000 : 0 };
        }),
      });
    });

    return Response.json({
      linhas: linhas.sort((a, b) => b.taxa - a.taxa),
      periodo: [ANAC_ANO_INICIAL, ANAC_ANO_FINAL],
      tribunais_ok: linhas.map((l) => l.tribunal),
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}