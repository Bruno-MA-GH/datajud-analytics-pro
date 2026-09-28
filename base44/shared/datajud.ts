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
  "Overbooking",
  "Transporte Aéreo",
  // Ressalva: no TJRJ aparece junto de "Acidente de Trânsito" (possível erro de cadastro).
  "Acidente Aéreo",
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
// Função Painless que reconstrói qualquer data do DataJud em epoch millis (UTC).
// Datas ISO são usadas diretamente; datas gravadas como dígitos
// "yyyyMMddHHmmss" (lidas pelo ES como epoch_millis → ano > 2100) são
// decompostas e remontadas. Retorna -1 só se os dígitos forem impossíveis
// (mês/dia inexistente). Deve ser prefixada a qualquer script que use datas.
export const PAINLESS_NORMALIZA_DATA =
  "long normData(def z){ if(z.getYear()<=2100){return z.toInstant().toEpochMilli();} long v=z.toInstant().toEpochMilli(); int y=(int)(v/10000000000L); int mo=(int)((v/100000000L)%100); int d=(int)((v/1000000L)%100); int h=(int)((v/10000L)%100); int mi=(int)((v/100L)%100); int s=(int)(v%100); if(mo<1||mo>12||d<1){return -1L;} int ult=LocalDate.of(y,mo,1).lengthOfMonth(); return ZonedDateTime.of(y,mo,(int)Math.min(d,ult),(int)Math.min(h,23),(int)Math.min(mi,59),(int)Math.min(s,59),0,ZoneId.of('Z')).toInstant().toEpochMilli(); } ";

// Exclui processos cuja dataAjuizamento em dígitos forma data impossível
// (ex.: mês 13, dia 00) — erro de cadastro no tribunal de origem.
// Também exclui ajuizamentos a partir de 2026 (ano incompleto), salvo quando
// a análise precisa do período posterior (ex.: estudo de evento do Tema 1.417).
export const ANO_FINAL = 2025;
const LIMITE_ANO_FINAL = Date.UTC(ANO_FINAL + 1, 0, 1);
export const queryDataPossivel = (lim = LIMITE_ANO_FINAL) => ({
  bool: { must_not: [{ script: { script: { params: { lim }, source: PAINLESS_NORMALIZA_DATA +
    "if(doc['dataAjuizamento'].size()==0) return false; long n=normData(doc['dataAjuizamento'].value); return n<0 || n>=params.lim;" } } }] },
});

// Movimentos que indicam arquivamento ou baixa definitiva do processo.
export const MOVIMENTOS_BAIXA_NOMES = [
  "Arquivamento", "Arquivado Definitivamente", "Baixa Definitiva", "Definitivo",
];

// Duração (dias) entre o ajuizamento e o último movimento, ambas as datas
// normalizadas — nenhum processo é excluído pelo formato de armazenamento.
export const SCRIPT_DURACAO_DIAS = PAINLESS_NORMALIZA_DATA +
  "if(doc['dataAjuizamento'].size()==0) return 0; long a=normData(doc['dataAjuizamento'].value); if(a<0) return 0; long mx=0; for(d in doc['movimentos.dataHora']){long v=normData(d); if(v>mx){mx=v;}} if(mx<=a) return 0; return (mx-a)/86400000L;";

// Graus de ORIGEM do processo (campo "grau.keyword"): JE = Juizado Especial,
// G1 = 1º grau da Justiça Comum. TR/G2 são fases recursais e duplicariam a
// contagem de distribuição.
export const GRAUS_ORIGEM = ["JE", "G1"];

// ---------------------------------------------------------------------------
// Classificação do RITO pela CLASSE processual (campo "classe.nome.keyword").
// A classe acompanha a natureza do processo e não muda na subida de instância
// (o recurso do Juizado é "Recurso Inominado"; o da Justiça Comum, "Apelação").
// Classes levantadas empiricamente no universo de ações aéreas do DataJud.
// ---------------------------------------------------------------------------
export const CLASSES_JE = [
  "Procedimento do Juizado Especial Cível",
  "Procedimento do Juizado Especial da Fazenda Pública",
  "Recurso Inominado Cível",
  "Recurso Inominado",
  "Pedido de Uniformização de Interpretação de Lei Cível",
  "Recurso de Medida Cautelar Cível",
];
export const CLASSES_COMUM = [
  "Procedimento Comum Cível",
  "Procedimento Comum",
  "Procedimento Sumário",
  "Apelação Cível",
  "Apelação / Remessa Necessária",
  "Ação Civil Pública",
  "Ação Civil Coletiva",
  "Monitória",
];
// Fase de CUMPRIMENTO DE SENTENÇA: registro autônomo no DataJud (a classe do
// processo é alterada ao iniciar a execução do julgado). Não é nova demanda,
// mas a fase executiva de uma ação já contada — por isso é individualizada.
export const CLASSES_CUMPRIMENTO = [
  "Cumprimento de sentença",
  "Cumprimento de Sentença",
  "Cumprimento Provisório de Sentença",
  "Cumprimento Provisório de Decisão",
  "Cumprimento de Sentença contra a Fazenda Pública",
];

export function queryCumprimento() {
  return { terms: { "classe.nome.keyword": CLASSES_CUMPRIMENTO } };
}

// Desempate para as demais classes genéricas (embargos, petição etc.): usa o
// grau — JE e turmas recursais (TR/TRU/TNU) -> Juizado.
export const GRAUS_DESEMPATE_JE = ["JE", "TR", "TRU", "TNU"];

// Query que identifica processos do rito do Juizado Especial (fase de
// conhecimento/recursal; cumprimento de sentença fica de fora). Todo o
// restante que não é cumprimento é Justiça Comum, de modo que
// JE + Comum + Cumprimento = universo total.
export function queryRitoJE() {
  return {
    bool: {
      should: [
        { terms: { "classe.nome.keyword": CLASSES_JE } },
        {
          bool: {
            filter: [{ terms: { "grau.keyword": GRAUS_DESEMPATE_JE } }],
            must_not: [
              {
                terms: {
                  "classe.nome.keyword": [...CLASSES_JE, ...CLASSES_COMUM, ...CLASSES_CUMPRIMENTO],
                },
              },
            ],
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

// Tribunais consultados por padrão: apenas TJs estaduais (TRFs fora do escopo).
export const TRIBUNAIS_DEFAULT = [
  "tjsp", "tjrj", "tjmg", "tjrs", "tjpr", "tjba", "tjce", "tjpe",
  "tjsc", "tjgo", "tjdft", "tjes", "tjmt", "tjms", "tjpa", "tjam",
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

  // O DataJud responde 429 (es_rejected_execution_exception) quando sua fila
  // de buscas satura; nesses casos (e em 5xx) repetimos com espera crescente.
  let res;
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    res = await fetch(url, {
      method: "POST",
      headers: {
        // Formato exigido pela Wiki do CNJ: "Authorization: APIKey <chave>"
        Authorization: `APIKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dsl),
    });
    if (res.status !== 429 && res.status < 500) break;
    if (tentativa < 4) {
      await res.body?.cancel();
      await new Promise((r) => setTimeout(r, 1500 * 2 ** tentativa + Math.random() * 1000));
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataJud ${tribunal} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return await res.json();
}

// Tribunais de índice pesado que falham sob carga concorrente: consultados à
// parte, após os demais, com uma nova tentativa em caso de falha.
export const TRIBUNAIS_ISOLADOS = ["tjrs"];
const CONCORRENCIA = 4;

const settle = (p) =>
  p.then((value) => ({ status: "fulfilled", value }), (reason) => ({ status: "rejected", reason }));

// Consulta todos os tribunais e devolve resultados no formato de
// Promise.allSettled, na mesma ordem da lista recebida.
export async function queryTribunais(tribunals, dslOriginal, { incluirPosAnoFinal = false } = {}) {
  // Todas as análises excluem processos com data de ajuizamento impossível
  // (erro de cadastro no tribunal de origem) e, salvo exceção, os de 2026.
  const filtroData = incluirPosAnoFinal ? queryDataPossivel(Number.MAX_SAFE_INTEGER) : queryDataPossivel();
  const dsl = { ...dslOriginal, query: { bool: { filter: [dslOriginal.query || { match_all: {} }, filtroData] } } };
  const demais = tribunals.filter((t) => !TRIBUNAIS_ISOLADOS.includes(t));
  const isolados = tribunals.filter((t) => TRIBUNAIS_ISOLADOS.includes(t));
  const res = new Map();
  // Concorrência limitada para não saturar a fila de buscas do DataJud.
  const fila = [...demais];
  const worker = async () => {
    while (fila.length) {
      const t = fila.shift();
      res.set(t, await settle(queryDataJudAggregation(t, dsl)));
    }
  };
  await Promise.all(Array.from({ length: CONCORRENCIA }, worker));
  for (const t of isolados) {
    let r = await settle(queryDataJudAggregation(t, dsl));
    if (r.status === "rejected") r = await settle(queryDataJudAggregation(t, dsl));
    res.set(t, r);
  }
  return tribunals.map((t) => res.get(t));
}