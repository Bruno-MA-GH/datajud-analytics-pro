// =============================================================================
// Módulo compartilhado: integração com a API Pública do DataJud (CNJ)
// -----------------------------------------------------------------------------
// Endpoint por tribunal:
//   POST https://api-publica.datajud.cnj.jus.br/api_publica_<tribunal>/_search
// Autenticação (header): "Authorization: APIKey <chave>"  (chave PÚBLICA do CNJ)
//
// Para evitar o limite de 10k hits da paginação, TODAS as consultas usam
// agregações (size: 0), retornando apenas contagens agrupadas por mês.
// =============================================================================

import { secrets } from "base44:runtime";

// URL base da API Pública do DataJud (CNJ). Índices por tribunal:
//   /api_publica_<tribunal>/_search   (host ".jus.br")
export const DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// Chave pública vigente divulgada na Wiki do CNJ
// (https://datajud-wiki.cnj.jus.br/api-publica/acesso/). É PÚBLICA e pode ser
// alterada pelo CNJ a qualquer momento — usada como fallback caso o secret
// DATAJUD_API_KEY não esteja configurado (ou esteja desatualizado).
export const DATAJUD_API_KEY_PUBLICA =
  "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

// ---------------------------------------------------------------------------
// Filtro por NOME do assunto (TPU/CNJ).
// O DataJud indexa assuntos em dois sistemas de código que variam por
// tribunal (assuntos.codigo estadual e assuntos.codigoNacional/TPU). Para uma
// extração nacional consistente e metodologicamente defensável, filtramos pelo
// NOME padronizado do assunto, que é o mesmo em todo o Judiciário.
//   Ex.: TJSP -> Atraso=4829, Cancelamento=4830, Extravio=4832 (assuntos.codigo)
// Incluímos variantes com/sem acento ("vôo"/"voo") para maximizar a cobertura.
// ---------------------------------------------------------------------------
export const ASSUNTOS_AEREA_NOMES = [
  "Atraso de vôo",
  "Atraso de voo",
  "Cancelamento de vôo",
  "Cancelamento de voo",
  "Extravio de bagagem",
];

export const ASSUNTOS_JUS_GRATUITA_NOMES = [
  "Assistência Judiciária Gratuita",
  "Justiça Gratuita",
];

// Movimentos processuais que indicam a CONCESSÃO/DEFERIMENTO efetivo da
// justiça gratuita (campo "movimentos[].nome.keyword"). Descobertos
// empiricamente no DataJud: "Gratuidade da Justiça" é o movimento-padrão
// nacional de concessão. Mais fidedigno que o critério por assunto, pois
// registra o ato de deferimento (não apenas a matéria).
export const MOVIMENTOS_JUS_GRATUITA_NOMES = [
  "Gratuidade da Justiça",
  "Assistência Judiciária Gratuita",
];

// Movimento de INDEFERIMENTO. O DataJud não publica um movimento específico de
// "indeferimento da gratuidade" — a negativa é registrada pelo movimento
// genérico "Indeferimento" (o objeto indeferido consta apenas nos complementos,
// não expostos na API). Usado como proxy do indeferimento do benefício.
export const MOVIMENTOS_INDEFERIMENTO_NOMES = ["Indeferimento"];

// ---------------------------------------------------------------------------
// Movimentos do TPU de Magistratura que registram o RESULTADO do julgamento.
// Filtramos por NOME (movimentos.nome.keyword) pela mesma razão dos assuntos:
// o nome é padronizado nacionalmente, enquanto os códigos variam por tribunal.
//   Procedência (TPU 219) · Improcedência (220) · Procedência em Parte (221)
//   Extinção sem resolução do mérito (471/196) · Transação/Acordo (466/208)
// ---------------------------------------------------------------------------
export const MOVIMENTOS_PROCEDENCIA_NOMES = ["Procedência"];
export const MOVIMENTOS_IMPROCEDENCIA_NOMES = ["Improcedência"];
export const MOVIMENTOS_PARCIAL_NOMES = [
  "Procedência em Parte",
  "Procedência Parcial",
];
export const MOVIMENTOS_SEM_MERITO_NOMES = [
  "Extinção sem Resolução do Mérito",
  "Extinção do processo sem resolução do mérito",
  "Extinção do Processo Sem Resolução do Mérito",
  "Sem Resolução do Mérito",
  "Sem Resolução de Mérito",
  "Desistência",
];
export const MOVIMENTOS_ACORDO_NOMES = [
  "Homologação de Transação",
  "Transação",
  "Homologação de Acordo",
];

// ---------------------------------------------------------------------------
// Script Painless: duração da tramitação, em DIAS.
// Último movimento processual (max movimentos.dataHora) menos dataAjuizamento.
// Pressupõe query com range em dataAjuizamento (descarta datas mal-formatadas).
// Sem movimentos ou data inconsistente -> 0.
// ---------------------------------------------------------------------------
export const SCRIPT_DURACAO_DIAS =
  "if(doc['dataAjuizamento'].size()==0) return 0; long a=doc['dataAjuizamento'].value.toInstant().toEpochMilli(); long mx=0; for(d in doc['movimentos.dataHora']){long v=d.toInstant().toEpochMilli(); if(v>mx){mx=v;}} if(mx<=a) return 0; return (mx-a)/86400000L;";

// Tribunais consultados por padrão (principais TJ estaduais + TRF).
export const TRIBUNAIS_DEFAULT = [
  "tjsp", "tjrj", "tjmg", "tjrs", "tjpr", "tjba", "tjce", "tjpe",
  "tjsc", "tjgo", "tjdf", "tjes", "tjmt", "tjms", "tjpa", "tjam",
  "trf1", "trf2", "trf3", "trf4", "trf5", "trf6",
];

// ---------------------------------------------------------------------------
// Script Painless que normaliza "dataAjuizamento" em yyyyMM (long).
// -----------------------------------------------------------------------------
// O campo dataAjuizamento do DataJud público tem FORMATOS MISTOS:
//   - Parte dos registros vem como data ISO -> anos reais (2001-2025).
//   - Parte vem como string de dígitos "yyyyMMddHHmmss" (ex.: "20260630103144"),
//     que o Elasticsearch interpreta como epoch_millis, gerando anos espúrios
//     no século 26 (2606-2612). Um date_histogram puro, portanto, produz
//     buckets inválidos para esses registros.
//
// O script detecta ano > 2100 (mal-parseado) e RECONSTRÓI o yyyyMM a partir do
// valor original: quando o ES faz o fallback para epoch_millis, o valor
// armazenado É o número original (ex.: 20260630103144). Dividindo por 1e8
// obtemos os 6 primeiros dígitos = yyyyMM (ex.: 202606). Para registros com
// data ISO, usa o ano/mês diretamente. Ambas as populações resultam no mesmo
// formato yyyyMM, viabilizando a série histórica correta.
// ---------------------------------------------------------------------------
export const SCRIPT_DATA_AJUIZAMENTO_YYYYMM =
  "def z=doc['dataAjuizamento'].value; if(z.getYear()>2100){return (long)(z.toInstant().toEpochMilli()/100000000L);} else {return z.getYear()*100+z.getMonthValue();}";

// Converte chave yyyyMM (long, ex.: 202603) em "yyyy-MM" (ex.: "2026-03").
export function toYearMonth(k) {
  const y = Math.floor(k / 100);
  const m = k % 100;
  return `${y}-${String(m).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Executa uma query DSL contra o índice de um tribunal.
// ---------------------------------------------------------------------------
export async function queryDataJudAggregation(tribunal, dsl) {
  const url = `${DATAJUD_BASE_URL}/api_publica_${tribunal}/_search`;
  const apiKey = secrets.get("DATAJUD_API_KEY") || DATAJUD_API_KEY_PUBLICA;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      // Formato exigido pela Wiki do CNJ: "Authorization: APIKey <chave>"
      Authorization: `APIKey ${apiKey}`,
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