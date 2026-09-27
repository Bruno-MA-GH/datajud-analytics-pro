import React from "react";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

// Faixa acima do gráfico com o município sob o cursor.
export function MunicipioHover({ ponto, taxaMedia }) {
  if (!ponto?.municipio) {
    return (
      <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Passe o mouse sobre a curva para identificar o município.
      </div>
    );
  }
  const taxa = ponto.habitantes ? (ponto.acoes / ponto.habitantes) * 1e5 : 0;
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs flex flex-wrap gap-x-4 gap-y-1">
      <span className="font-semibold text-foreground">{ponto.municipio}</span>
      <span className="text-muted-foreground">PIB per capita R$ {fmt(ponto.pibpc)}</span>
      <span className="text-muted-foreground">{fmt(ponto.habitantes)} hab.</span>
      <span className="text-muted-foreground">{fmt(ponto.acoes)} ações ({taxa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} por 100 mil)</span>
      <span className="text-muted-foreground">Acumulado: {fmt(ponto.pop)}% pop. · {fmt(ponto.casos)}% ações</span>
      <span className="text-muted-foreground">
        Distância da igualdade:{" "}
        <b className="text-foreground">{(ponto.casos - ponto.pop).toLocaleString("pt-BR", { maximumFractionDigits: 2, signDisplay: "exceptZero" })} p.p.</b>
      </span>
      {taxaMedia > 0 && (
        <span className="text-muted-foreground">
          Litigância relativa:{" "}
          <b className="text-foreground">{(taxa / (taxaMedia * 1e5)).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}× a média</b>
        </span>
      )}
    </div>
  );
}

export default MunicipioHover;