import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryTribunais, TRIBUNAIS_DEFAULT, ASSUNTOS_AEREA_NOMES, SCRIPT_DATA_AJUIZAMENTO_YYYYMM, SCRIPT_DURACAO_DIAS, toYearMonth, queryDataPossivel,
} from "../../shared/datajud.ts";

// =============================================================================
// Recorte por tipo de dano: série mensal e duração média por assunto
// (atraso, cancelamento, extravio). Variantes "vôo/voo" são unificadas.
// Processo com mais de um assunto aéreo é contado em cada um deles.
// =============================================================================
const tipo = (nome) => nome.startsWith("Atraso") ? "atraso" : nome.startsWith("Cancelamento") ? "cancelamento" : "extravio";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const tribunals = Array.isArray(body.tribunals) && body.tribunals.length ? body.tribunals : TRIBUNAIS_DEFAULT;

    const dsl = {
      size: 0,
      query: { bool: { filter: [
        { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
      ] } },
      aggs: {
        assunto: {
          terms: { field: "assuntos.nome.keyword", include: ASSUNTOS_AEREA_NOMES, size: 10 },
          aggs: {
            mes: { terms: { script: { source: SCRIPT_DATA_AJUIZAMENTO_YYYYMM }, size: 400 } },
            // Duração com datas normalizadas (todos os formatos de armazenamento).
            duracao: { avg: { script: { source: SCRIPT_DURACAO_DIAS } } },
          },
        },
      },
    };
    const results = await queryTribunais(tribunals, dsl, { req });

    const now = new Date();
    const limite = now.getFullYear() * 100 + now.getMonth() + 1;
    const meses = {};
    const dur = { atraso: [0, 0], cancelamento: [0, 0], extravio: [0, 0] };
    const ok = [], falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") { falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) }); return; }
      ok.push(t);
      for (const b of r.value?.aggregations?.assunto?.buckets || []) {
        const k = tipo(b.key);
        if (b.duracao?.value != null) { dur[k][0] += b.duracao.value * b.doc_count; dur[k][1] += b.doc_count; }
        for (const m of b.mes?.buckets || []) {
          const key = Number(m.key);
          if (key < 200001 || key > limite) continue;
          const ym = toYearMonth(key);
          meses[ym] = meses[ym] || { month: ym, atraso: 0, cancelamento: 0, extravio: 0 };
          meses[ym][k] += m.doc_count;
        }
      }
    });

    return Response.json({
      serie: Object.values(meses).sort((a, b) => a.month.localeCompare(b.month)),
      duracao: Object.entries(dur).map(([k, [s, n]]) => ({ tipo: k, processos: n, mediaDias: n ? Math.round(s / n) : 0 })),
      tribunais_ok: ok,
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}