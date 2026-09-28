import React from "react";

const C = ({ children }) => <code className="rounded bg-muted px-1 py-0.5">{children}</code>;

export const notaVolume = (
  <>
    <p>Em todas as análises, são excluídos os processos cuja data de ajuizamento, gravada como dígitos, forma data impossível (ex.: mês 13 ou dia 00), por indicarem erro de cadastro no tribunal de origem.</p>
    <p>Agregações <C>terms</C> com script de normalização sobre <C>dataAjuizamento</C>, evitando o limite de 10k hits da paginação.</p>
    <p>Critério de litigância aérea: assuntos "Atraso de vôo", "Cancelamento de vôo" e "Extravio de bagagem" (filtro por nome, estável nacionalmente).</p>
  </>
);

export const notaGratuidade = (
  <p>Dois critérios: (1) por assunto "Assistência Judiciária Gratuita" (TPU 10685); (2) por movimento de concessão "Gratuidade da Justiça" (mais fidedigno do deferimento efetivo). A divergência entre ambos evidencia o sub-registro da matéria como assunto.</p>
);

export const notaTramitacao = (
  <p>Tempo de tramitação: diferença em dias entre o último movimento processual e a <C>dataAjuizamento</C>. Todas as datas são reconstruídas antes do cálculo: as gravadas como dígitos "yyyyMMddHHmmss" são decompostas e remontadas, de modo que nenhum processo é excluído pelo formato de armazenamento. Exceção: processos cujos dígitos formam data impossível (ex.: mês 13 ou dia 00) são excluídos, por indicarem erro de cadastro no tribunal de origem. Resultado do julgamento: varredura dos movimentos do TPU de Magistratura (procedência, improcedência, procedência em parte, extinção sem resolução do mérito e transação).</p>
);

export const notaRito = (
  <>
    <p>No JE a gratuidade é estrutural (Lei 9.099/95, art. 54) e não gera movimento de deferimento; na Justiça Comum ela é um benefício concedido caso a caso.</p>
    <p>Tipo de justiça definido pela <C>classe</C> processual, em todas as instâncias. Juizado Especial: "Procedimento do Juizado Especial Cível", "Recurso Inominado" e demais classes do microssistema; Justiça Comum: "Procedimento Comum Cível", "Apelação Cível" e congêneres. Desempate para classes genéricas pelo <C>grau</C>: JE e turmas recursais (TR/TRU/TNU) para o Juizado; G1, G2 e demais para a Justiça Comum. JE + Justiça Comum + cumprimento de sentença = total de ações aéreas.</p>
    <p>Cumprimento de sentença: categoria própria. Ao iniciar a execução, o processo passa à classe "Cumprimento de sentença", perdendo a classe original do rito. Não representa nova demanda; por isso não é atribuído a nenhum rito e é excluído do comparativo de tramitação e resultado.</p>
  </>
);

export const notaLotes = (
  <p>Lote: par órgão julgador + dia de <C>dataAjuizamento</C> com 10 ou mais ações aéreas originárias (graus JE e G1). Datas gravadas como dígitos (yyyyMMddHHmmss) são reconstruídas. Lotes indicam protocolo em bloco, mas também podem refletir redistribuição ou migração de sistema em uma data única, o que exige leitura qualitativa dos maiores casos.</p>
);

export const notaIncentivos = (
  <>
    <p>Taxa de acordo: processos com movimento de homologação de transação ÷ ações de conhecimento. Conversão em execução: registros na classe "Cumprimento de sentença" ÷ ações de conhecimento; indica se o réu precisou ser executado em vez de pagar espontaneamente.</p>
    <p>Movimentos por processo: total de movimentos registrados ÷ processos, como aproximação do esforço processual. Índice de baixa: processos com movimento de arquivamento ou baixa definitiva ÷ total distribuído no tribunal, uma medida de vazão proporcional ao volume.</p>
  </>
);

export const notaTipoDano = (
  <p>Séries separadas pelo assunto (atraso, cancelamento e extravio de bagagem; as grafias "vôo" e "voo" são unificadas). Um processo com mais de um desses assuntos é contado em cada um. Sazonalidade: soma de todos os anos por mês do calendário. A duração média inclui todos os registros, com as datas de ajuizamento e de movimentação normalizadas antes do cálculo. Processos com data de ajuizamento impossível (ex.: mês 13 ou dia 00) são excluídos por erro de cadastro no tribunal de origem.</p>
);

export const notaTema = (
  <>
    <p>Marco: decisão do Min. Dias Toffoli no ARE 1.560.244/RJ, de 26/11/2025, que suspendeu nacionalmente os processos sobre o Tema 1.417 da Repercussão Geral (regime de responsabilidade por cancelamento, alteração ou atraso de voo: CBA × CDC). A repercussão geral foi reconhecida em 22/8/2025.</p>
    <p>Estudo de evento: ações aéreas originárias (JE/G1) por mês de ajuizamento. A média "antes" usa nov/2024 a out/2025; a média "depois", dez/2025 em diante. O mês corrente fica fora das médias, e os meses mais recentes tendem a ser subestimados pelo atraso de envio dos tribunais ao DataJud.</p>
    <p>Suspensos (aproximação): processos com movimento "Suspensão ou Sobrestamento", "Sobrestado" ou "Cumprimento de Suspensão ou Sobrestamento" e com alguma movimentação a partir de 26/11/2025. O DataJud não permite vincular a data ao movimento específico, então a contagem pode incluir suspensões anteriores por outros motivos. A suspensão alcança também o extravio de bagagem apenas se o tribunal assim a aplicar.</p>
  </>
);

export const notaPredatoria = (
  <p>Índice exploratório (0–100) por tribunal: média simples de dois indicadores normalizados entre o menor e o maior valor dos tribunais consultados, que são o percentual de ações originárias ajuizadas em lote (10 ou mais na mesma vara e no mesmo dia) e a taxa de acordo homologado. É um índice relativo entre os tribunais selecionados: um valor alto indica indícios, não a comprovação de litigância predatória, que exigiria dados de advogados e partes, ausentes na API pública.</p>
);

export const notaAcesso = (
  <>
    <p>Taxa: ações aéreas originárias (graus JE e G1, sem cumprimento de sentença) ajuizadas de 2015 a 2025 no TJ da UF ÷ passageiros pagos no mesmo período × 100 mil. Apenas TJs estaduais, pois os TRFs abrangem várias UFs.</p>
    <p>Alinhamento temporal: a ANAC publica dados mensais, mas a série usada termina em 2025, último ano completo disponível. Por isso, as ações do DataJud desta análise também são limitadas a 2015–2025, e 2026 fica fora das duas fontes. Assim, numerador e denominador cobrem o mesmo período, sem comparar anos com cobertura diferente.</p>
    <p>Fonte externa: ANAC, "Dados Estatísticos do Transporte Aéreo" (dados abertos, arquivo Dados_Estatisticos.csv, versão de 27/09/2026). Passageiros pagos nos aeroportos da UF, em voos domésticos e internacionais, contados uma única vez (como no critério IATA/IBAER): a soma de embarcados e desembarcados é dividida por 2, já que cada viagem aparece na origem e no destino. A divisão é aproximada, porque em voos internacionais só uma das pontas fica no Brasil. A ação é atribuída à UF do tribunal, que pode não coincidir com a do voo. Tribunais com baixa cobertura histórica no DataJud têm a taxa subestimada.</p>
  </>
);

export const notaParados = (
  <p>Universo: ações aéreas (todos os graus) sem movimento de arquivamento ou baixa definitiva. Tempo parado: dias entre hoje e o último movimento registrado, com datas normalizadas. "Parados" corresponde às faixas acima de 180 dias. "Sem movimento": processos sem nenhuma data de movimentação. O DataJud reflete a última carga enviada por cada tribunal, então atrasos de envio podem inflar as faixas mais longas. Classes limitadas às 8 principais por tribunal.</p>
);

export const notaConcentracao = (
  <>
    <p>Índice de concentração (Gini adaptado, sem dados de renda dos autores): municípios ordenados pelo PIB per capita (PIB dos Municípios 2023 / população do Censo 2022, IBGE-SIDRA); área entre a curva e a diagonal, por trapézio. Valor positivo indica concentração nos municípios mais ricos. No tooltip, o índice é acumulado até o município sob o cursor.</p>
    <p>Contam apenas ações originárias (graus JE e G1), sem cumprimento de sentença, atribuídas ao município da vara (<C>orgaoJulgador.codigoMunicipioIBGE</C>). Universo: todos os municípios das UFs dos TJs consultados, inclusive os sem ações. Quando o município não é informado (sobretudo no TJSP), é recuperado pelo nome da vara; foros regionais da Capital são atribuídos a São Paulo, e o de Vila Mimosa, a Campinas. Varas sem localidade no nome (ex.: CEJUSC) ficam de fora. Limitação: a comarca pode abranger vários municípios, e a ação é atribuída à sede da vara.</p>
  </>
);