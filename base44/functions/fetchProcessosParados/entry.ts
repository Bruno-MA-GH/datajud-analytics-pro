import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryTribunais, TRIBUNAIS_DEFAULT, ASSUNTOS_AEREA_NOMES, MOVIMENTOS_BAIXA_NOMES, PAINLESS_NORMALIZA_DATA,
} from "../../shared/datajud.ts";

// =============================================================================
// Processos parados: ações aéreas sem baixa/arquivamento, agrupadas pelo tempo
// desde o último movimento (datas normalizadas). Por faixa: tribunal, grau e
// classe processual, para o perfil interativo.
// =============================================================================
export const FAIXAS = ["Até 90 dias", "91 a 180 dias", "181 dias a 1 ano", "1 a 2 anos", "2 a 5 anos", "Mais de 5 anos", "Sem movimento"];

const SCRIPT_FAIXA = PAINLESS_NORMALIZA_DATA +
  "long mx=-1; for(d in doc['movimentos.dataHora']){long v=normData(d); if(v>mx){mx=v;}} if(mx<0) return 6; long dias=(params.agora-mx)/86400000L; " +
  "if(dias<=90) return 0; if(dias<=180) return 1; if(dias<=365) return 2; if(dias<=730) return 3; if(dias<=1825) return 4; return 5;";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const tribunals = Array.isArray(body.tribunals) && body.tribunals.length ? body.tribunals : TRIBUNAIS_DEFAULT;

    const dsl = {
      size: 0,
      query: { bool: {
        filter: [{ terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } }],
        must_not: [{ terms: { "movimentos.nome.keyword": MOVIMENTOS_BAIXA_NOMES } }],
      } },
      aggs: {
        faixa: {
          terms: { script: { source: SCRIPT_FAIXA, params: { agora: Date.now() } }, size: 10 },
          aggs: {
            grau: { terms: { field: "grau.keyword", size: 10 } },
            classe: { terms: { field: "classe.nome.keyword", size: 8 } },
          },
        },
      },
    };
    const results = await queryTribunais(tribunals, dsl);
    const faixas = FAIXAS.map((nome) => ({ nome, total: 0, tribunais: {}, graus: {}, classes: {} }));
    const ok = [], falhas = [];
    const soma = (o, k, v) => { o[k] = (o[k] || 0) + v; };

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") { falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) }); return; }
      ok.push(t);
      for (const b of r.value?.aggregations?.faixa?.buckets || []) {
        const f = faixas[Number(b.key)];
        if (!f) continue;
        f.total += b.doc_count;
        soma(f.tribunais, t, b.doc_count);
        for (const g of b.grau?.buckets || []) soma(f.graus, g.key, g.doc_count);
        for (const c of b.classe?.buckets || []) soma(f.classes, c.key, c.doc_count);
      }
    });

    const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([nome, total]) => ({ nome, total }));
    return Response.json({
      faixas: faixas.map((f) => ({ nome: f.nome, total: f.total, tribunais: top(f.tribunais, 25), graus: top(f.graus, 10), classes: top(f.classes, 8) })),
      tribunais_ok: ok,
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}