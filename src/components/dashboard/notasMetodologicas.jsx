import React from "react";

const C = ({ children }) => <code className="rounded bg-muted px-1 py-0.5">{children}</code>;

export const notaVolume = (
  <>
    <p>Agregações <C>terms</C> com script de normalização sobre <C>dataAjuizamento</C>, evitando o limite de 10k hits da paginação.</p>
    <p>Critério de litigância aérea: assuntos "Atraso de vôo", "Cancelamento de vôo" e "Extravio de bagagem" (filtro por nome, estável nacionalmente).</p>
  </>
);

export const notaGratuidade = (
  <p>Dois critérios: (1) por assunto "Assistência Judiciária Gratuita" (TPU 10685); (2) por movimento de concessão "Gratuidade da Justiça" (mais fidedigno do deferimento efetivo). A divergência entre ambos evidencia o sub-registro da matéria como assunto.</p>
);

export const notaTramitacao = (
  <p>Tempo de tramitação: diferença em dias entre o último movimento processual e a <C>dataAjuizamento</C>, restrita a registros com data válida. Resultado do julgamento: varredura dos movimentos do TPU de Magistratura (procedência, improcedência, procedência em parte, extinção sem resolução do mérito e transação).</p>
);

export const notaRito = (
  <>
    <p>No JE a gratuidade é estrutural (Lei 9.099/95, art. 54) e não gera movimento de deferimento; na Justiça Comum ela é um benefício concedido caso a caso.</p>
    <p>Tipo de justiça definido pela <C>classe</C> processual, em todas as instâncias. Juizado Especial: "Procedimento do Juizado Especial Cível", "Recurso Inominado" e demais classes do microssistema; Justiça Comum: "Procedimento Comum Cível", "Apelação Cível" e congêneres. Desempate para classes genéricas pelo <C>grau</C>: JE e turmas recursais (TR/TRU/TNU) para o Juizado; G1, G2 e demais para a Justiça Comum. JE + Justiça Comum + cumprimento de sentença = total de ações aéreas.</p>
    <p>Cumprimento de sentença: categoria própria. Ao iniciar a execução, o processo passa à classe "Cumprimento de sentença", perdendo a classe original do rito. Não representa nova demanda; por isso não é atribuído a nenhum rito e é excluído do comparativo de tramitação e resultado.</p>
  </>
);

export const notaConcentracao = (
  <>
    <p>Índice de concentração (Gini adaptado, sem dados de renda dos autores): municípios ordenados pelo PIB per capita (PIB dos Municípios 2023 / população do Censo 2022, IBGE-SIDRA); área entre a curva e a diagonal, por trapézio. Valor positivo indica concentração nos municípios mais ricos. No tooltip, o índice é acumulado até o município sob o cursor.</p>
    <p>Contam apenas ações originárias (graus JE e G1), sem cumprimento de sentença, atribuídas ao município da vara (<C>orgaoJulgador.codigoMunicipioIBGE</C>). Universo: todos os municípios das UFs dos TJs consultados, inclusive os sem ações. Quando o município não é informado (sobretudo no TJSP), é recuperado pelo nome da vara; foros regionais da Capital são atribuídos a São Paulo, e o de Vila Mimosa, a Campinas. Varas sem localidade no nome (ex.: CEJUSC) ficam de fora. Limitação: a comarca pode abranger vários municípios, e a ação é atribuída à sede da vara.</p>
  </>
);