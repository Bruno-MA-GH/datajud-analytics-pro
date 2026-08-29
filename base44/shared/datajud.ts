// =============================================================================
// Módulo compartilhado: integração com a API Pública do DataJud (CNJ)
// -----------------------------------------------------------------------------
// O DataJud expõe um endpoint Elasticsearch por tribunal. A consulta é feita
// via POST <base>/<tribunal>/_search com um payload DSL (Query JSON) e
// autenticação por API Key no header "Authorization: ApiKey <chave>".
//
// Para evitar o limite de 10k hits da paginação do DataJud, TODAS as consultas
// usam agregações (size: 0 + date_histogram), retornando apenas contagens
// agrupadas por mês — poupando banda e processamento.
// =============================================================================

import { secrets } from "base44:runtime";

// URL base da API Pública do DataJud (CNJ).
export const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.br/api/publico";

// ---------------------------------------------------------------------------
// Códigos de TPU (Tabela Processual Unificada) relevantes para o estudo.
// ---------------------------------------------------------------------------
// Litigância consumer contra companhias aéreas (Direito Aeronáutico):
//   11843 - Atraso de voo
//   11844 - Cancelamento de voo
//   11845 - Extravio de bagagem
export const TPU_AEREA = ["11843", "11844", "11845"];

// Assistência Judiciária Gratuita (indicador de gratuidade da justiça).
export const TPU_JUS_GRATUITA = "10685";

// ---------------------------------------------------------------------------
// Tribunais consultados por padrão.
// Índices do DataJud público são por tribunal; para uma visão nacional faz-se
// um agregado disparando requisições em paralelo para cada índice.
// Incluímos os principais Tribunais de Justiça estaduais (TJ) e Regionais
// Federais (TRF), pois ações aeronáuticas podem correr em ambas as jurisdições.
// ---------------------------------------------------------------------------
export const TRIBUNAIS_DEFAULT = [
  "tjsp", "tjrj", "tjmg", "tjrs", "tjpr", "tjba", "tjce", "tjpe",
  "tjsc", "tjgo", "tjdf", "tjes", "tjmt", "tjms", "tjpa", "tjam",
  "trf1", "trf2", "trf3", "trf4", "trf5", "trf6"
];

// ---------------------------------------------------------------------------
// Executa uma query DSL contra o índice de um tribunal do DataJud.
// Retorna o JSON completo da resposta Elasticsearch (aggregations incluídas).
// ---------------------------------------------------------------------------
export async function queryDataJudAggregation(tribunal, dsl) {
  const url = `${DATAJUD_BASE_URL}/${tribunal}/_search`;
  const apiKey = secrets.get("DATAJUD_API_KEY");
  if (!apiKey) {
    throw new Error("DATAJUD_API_KEY não configurada.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dsl),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataJud ${tribunal} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return await res.json();
}