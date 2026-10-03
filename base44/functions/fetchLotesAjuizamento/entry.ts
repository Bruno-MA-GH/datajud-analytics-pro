import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { queryTribunais, TRIBUNAIS_DEFAULT, ASSUNTOS_AEREA_NOMES, GRAUS_ORIGEM } from "../../shared/datajud.ts";

// =============================================================================
// Lotes de ajuizamento no mesmo dia: ações originárias (JE/G1) agrupadas por
// órgão julgador + dia de ajuizamento. Um "lote" é um par vara/dia com
// LOTE_MIN ou mais ações aéreas — assinatura de protocolo em bloco.
// Datas no formato yyyyMMddHHmmss (mal-parseadas como epoch) são reconstruídas.
// =============================================================================
const LOTE_MIN = 10;
const SCRIPT_VARA_DIA =
  "if(doc['dataAjuizamento'].size()==0 || doc['orgaoJulgador.nome.keyword'].size()==0) return null; def z=doc['dataAjuizamento'].value; long d = z.getYear()>2100 ? (long)(z.toInstant().toEpochMilli()/1000000L) : (long)(z.getYear()*10000+z.getMonthValue()*100+z.getDayOfMonth()); return doc['orgaoJulgador.nome.keyword'].value + '|' + d;";

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
        { terms: { "grau.keyword": GRAUS_ORIGEM } },
      ] } },
      aggs: { lotes: { terms: { script: { source: SCRIPT_VARA_DIA }, min_doc_count: LOTE_MIN, size: 10000 } } },
    };
    const results = await queryTribunais(tribunals, dsl, { req });

    const anoAtual = new Date().getFullYear();
    const porAno = {}; // ano -> { lotes, acoesEmLote }
    const porTribunal = [];
    const maiores = [];
    const faixas = { "10–19": 0, "20–49": 0, "50–99": 0, "100+": 0 };
    let totalAcoes = 0, acoesEmLote = 0, nLotes = 0;
    const ok = [], falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") { falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) }); return; }
      ok.push(t);
      const n = r.value?.hits?.total?.value || 0;
      totalAcoes += n;
      let emLoteT = 0, lotesT = 0;
      for (const b of r.value?.aggregations?.lotes?.buckets || []) {
        const [vara, dia] = String(b.key).split("|");
        const ano = Math.floor(Number(dia) / 10000);
        if (ano < 2000 || ano > anoAtual) continue;
        const c = b.doc_count;
        lotesT++; emLoteT += c;
        porAno[ano] = porAno[ano] || { lotes: 0, acoesEmLote: 0 };
        porAno[ano].lotes++; porAno[ano].acoesEmLote += c;
        faixas[c >= 100 ? "100+" : c >= 50 ? "50–99" : c >= 20 ? "20–49" : "10–19"]++;
        const ds = String(dia);
        maiores.push({ tribunal: t, vara, data: `${ds.slice(6, 8)}/${ds.slice(4, 6)}/${ds.slice(0, 4)}`, acoes: c });
      }
      nLotes += lotesT; acoesEmLote += emLoteT;
      porTribunal.push({ tribunal: t, acoes: n, lotes: lotesT, acoesEmLote: emLoteT });
    });

    maiores.sort((a, b) => b.acoes - a.acoes);
    return Response.json({
      loteMin: LOTE_MIN,
      resumo: { totalAcoes, acoesEmLote, nLotes },
      serie: Object.keys(porAno).sort().map((a) => ({ ano: a, ...porAno[a] })),
      faixas: Object.entries(faixas).map(([faixa, lotes]) => ({ faixa, lotes })),
      porTribunal: porTribunal.sort((a, b) => b.acoesEmLote - a.acoesEmLote),
      maiores: maiores.slice(0, 15),
      tribunais_ok: ok,
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}