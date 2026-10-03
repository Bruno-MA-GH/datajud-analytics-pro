import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryTribunais, TRIBUNAIS_DEFAULT, ASSUNTOS_AEREA_NOMES, GRAUS_ORIGEM, SCRIPT_DATA_AJUIZAMENTO_YYYYMM,
  toYearMonth, queryRitoJE, queryCumprimento, PAINLESS_NORMALIZA_DATA,
} from "../../shared/datajud.ts";

// =============================================================================
// Tema 1.417/STF (ARE 1.560.244): suspensão nacional determinada em 26/11/2025.
// 1) Estudo de evento: ajuizamentos mensais de ações aéreas originárias
//    (JE/G1) de jan/2024 até o mês corrente.
// 2) Perfil dos possivelmente suspensos: processos com movimento de suspensão/
//    sobrestamento e com alguma movimentação a partir de 26/11/2025. Como os
//    movimentos não são indexados como nested, não é possível exigir que a
//    própria suspensão seja posterior à data — por isso é uma aproximação.
// =============================================================================
const DATA_SUSPENSAO = "2025-11-26";
const MOV_SUSPENSAO = ["Suspensão ou Sobrestamento", "Sobrestado", "Cumprimento de Suspensão ou Sobrestamento"];
const tipo = (n) => n.startsWith("Atraso") ? "atraso" : n.startsWith("Cancelamento") ? "cancelamento" : "extravio";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const tribunals = Array.isArray(body.tribunals) && body.tribunals.length ? body.tribunals : TRIBUNAIS_DEFAULT;

    const dsl = {
      size: 0,
      query: { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
      aggs: {
        origem: {
          filter: { terms: { "grau.keyword": GRAUS_ORIGEM } },
          aggs: { mes: { terms: { script: { source: SCRIPT_DATA_AJUIZAMENTO_YYYYMM }, size: 400 } } },
        },
        suspensos: {
          filter: { bool: { filter: [
            { terms: { "movimentos.nome.keyword": MOV_SUSPENSAO } },
            // Datas de movimento normalizadas (evita que datas em dígitos, lidas como ano > 2100, passem no filtro).
            { script: { script: { params: { lim: Date.UTC(2025, 10, 26) }, source: PAINLESS_NORMALIZA_DATA +
              "for(d in doc['movimentos.dataHora']){ if(normData(d)>=params.lim) return true; } return false;" } } },
          ] } },
          aggs: {
            rito: { filters: { filters: { je: queryRitoJE(), cumprimento: queryCumprimento() } } },
            // Só os três tipos de dano do perfil (os demais assuntos aéreos não têm categoria aqui).
            assunto: { terms: { field: "assuntos.nome.keyword", include: ASSUNTOS_AEREA_NOMES.filter((n) => /^(Atraso|Cancelamento|Extravio)/.test(n)), size: 10 } },
            grau: { terms: { field: "grau.keyword", size: 10 } },
          },
        },
      },
    };
    // Exceção ao corte de 2025: o estudo de evento depende dos meses após a suspensão.
    const results = await queryTribunais(tribunals, dsl, { incluirPosAnoFinal: true, req });

    const now = new Date();
    const limite = now.getFullYear() * 100 + now.getMonth() + 1;
    const meses = {}, porTribunal = [], ok = [], falhas = [];
    const perfil = { total: 0, je: 0, cumprimento: 0, comum: 0, atraso: 0, cancelamento: 0, extravio: 0, graus: {} };

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") { falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) }); return; }
      ok.push(t);
      const a = r.value?.aggregations || {};
      for (const m of a.origem?.mes?.buckets || []) {
        const k = Number(m.key);
        if (k < 202401 || k > limite) continue;
        const ym = toYearMonth(k);
        meses[ym] = (meses[ym] || 0) + m.doc_count;
      }
      const s = a.suspensos || {};
      const je = s.rito?.buckets?.je?.doc_count || 0, cu = s.rito?.buckets?.cumprimento?.doc_count || 0;
      perfil.total += s.doc_count || 0; perfil.je += je; perfil.cumprimento += cu;
      perfil.comum += Math.max(0, (s.doc_count || 0) - je - cu);
      for (const b of s.assunto?.buckets || []) perfil[tipo(b.key)] += b.doc_count;
      for (const b of s.grau?.buckets || []) perfil.graus[b.key] = (perfil.graus[b.key] || 0) + b.doc_count;
      porTribunal.push({ tribunal: t, suspensos: s.doc_count || 0 });
    });

    return Response.json({
      dataSuspensao: DATA_SUSPENSAO,
      serie: Object.entries(meses).map(([month, count]) => ({ month, count })).sort((x, y) => x.month.localeCompare(y.month)),
      perfil,
      porTribunal: porTribunal.sort((x, y) => y.suspensos - x.suspensos),
      tribunais_ok: ok,
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}