import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  queryTribunais,
  queryCumprimento,
  TRIBUNAIS_DEFAULT,
  ASSUNTOS_AEREA_NOMES,
  MOVIMENTOS_PROCEDENCIA_NOMES,
  MOVIMENTOS_IMPROCEDENCIA_NOMES,
  MOVIMENTOS_PARCIAL_NOMES,
  MOVIMENTOS_SEM_MERITO_NOMES,
  MOVIMENTOS_ACORDO_NOMES,
  SCRIPT_DURACAO_DIAS,
  queryRitoJE,
} from "../../shared/datajud.ts";

// =============================================================================
// Função BFF: (1) Tempo de tramitação e (2) Taxa de procedência/improcedência
// -----------------------------------------------------------------------------
// Entrada (JSON): { "tribunals": ["tjsp", ...] }  (opcional)
//
// (1) TEMPO DE TRAMITAÇÃO
//     Duração (em dias) = último movimento processual (max movimentos.dataHora)
//     menos dataAjuizamento. Calculada por documento via script Painless e
//     resumida em média + percentis (p50/p90). O filtro de range em
//     dataAjuizamento (2000-01-01 .. now) descarta os registros com data
//     mal-formatada (que o ES parseia como epoch_millis -> século 26).
//     Leitura teórica: cada dia de tramitação é custo social (Shavell) e custo
//     individual do litigante (Vitorelli) — o "preço" temporal do litígio.
//
// (2) RESULTADO DO JULGAMENTO
//     Contagem por classe de movimento do TPU de Magistratura: procedência,
//     improcedência, procedência em parte, extinção sem resolução do mérito e
//     acordo/transação. Permite contrastar o BENEFÍCIO ESPERADO pelo autor com
//     o RESULTADO REAL observado na base.
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
    // Recorte opcional por rito (classe processual + desempate por grau):
    // "JE" (Juizado Especial) ou "COMUM" (Justiça Comum). A fase de
    // cumprimento de sentença fica fora de ambos os recortes.
    const grauFiltro =
      body.rito === "JE"
        ? [queryRitoJE()]
        : body.rito === "COMUM"
        ? [{ bool: { must_not: [queryRitoJE(), queryCumprimento()] } }]
        : [];

    const dsl = {
      size: 0,
      track_total_hits: true,
      query: {
        bool: {
          filter: [
            { terms: { "assuntos.nome.keyword": ASSUNTOS_AEREA_NOMES } },
            { range: { dataAjuizamento: { gte: "2000-01-01", lte: "now" } } },
            ...grauFiltro,
          ],
        },
      },
      aggs: {
        // (1) Tempo de tramitação, em dias.
        duracao_media: { avg: { script: { source: SCRIPT_DURACAO_DIAS } } },
        duracao_percentis: {
          percentiles: { script: { source: SCRIPT_DURACAO_DIAS }, percents: [50, 90] },
        },
        // (2) Resultado do julgamento (TPU de Movimentos - Magistratura).
        procedencia: {
          filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_PROCEDENCIA_NOMES } },
        },
        improcedencia: {
          filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_IMPROCEDENCIA_NOMES } },
        },
        parcial: {
          filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_PARCIAL_NOMES } },
        },
        sem_merito: {
          filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_SEM_MERITO_NOMES } },
        },
        acordo: {
          filter: { terms: { "movimentos.nome.keyword": MOVIMENTOS_ACORDO_NOMES } },
        },
      },
    };

    const results = await queryTribunais(tribunals, dsl);

    let total = 0;
    let somaDias = 0; // média ponderada pelo nº de processos de cada tribunal
    let p50Acum = 0;
    let p90Acum = 0;
    const resultado = {
      procedencia: 0,
      improcedencia: 0,
      parcial: 0,
      semMerito: 0,
      acordo: 0,
    };
    const ok = [];
    const falhas = [];

    results.forEach((r, i) => {
      const t = tribunals[i];
      if (r.status !== "fulfilled") {
        falhas.push({ tribunal: t, erro: r.reason?.message || String(r.reason) });
        return;
      }
      const a = r.value?.aggregations || {};
      const n = r.value?.hits?.total?.value || 0;
      if (n > 0 && a.duracao_media?.value != null) {
        total += n;
        somaDias += a.duracao_media.value * n;
        p50Acum += (a.duracao_percentis?.values?.["50.0"] || 0) * n;
        p90Acum += (a.duracao_percentis?.values?.["90.0"] || 0) * n;
      }
      resultado.procedencia += a.procedencia?.doc_count || 0;
      resultado.improcedencia += a.improcedencia?.doc_count || 0;
      resultado.parcial += a.parcial?.doc_count || 0;
      resultado.semMerito += a.sem_merito?.doc_count || 0;
      resultado.acordo += a.acordo?.doc_count || 0;
      ok.push(t);
    });

    const julgados =
      resultado.procedencia +
      resultado.improcedencia +
      resultado.parcial +
      resultado.semMerito +
      resultado.acordo;

    return Response.json({
      tramitacao: {
        processosComData: total,
        mediaDias: total ? Math.round(somaDias / total) : 0,
        medianaDias: total ? Math.round(p50Acum / total) : 0,
        p90Dias: total ? Math.round(p90Acum / total) : 0,
      },
      resultado: { ...resultado, julgados },
      tribunais_ok: ok,
      tribunais_falhas: falhas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}