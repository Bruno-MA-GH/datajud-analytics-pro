import React from "react";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

// Decomposição das ações fora da curva, por causa real.
export function ConcentracaoCobertura({ cobertura: c, recuperacao = [] }) {
  if (!c) return null;
  const itens = [
    ["Na curva", c.noUniverso],
    ["Município sem PIB na base do IBGE", c.semPib],
    ["Sem município identificável (nem pelo nome da vara)", c.semMunicipio],
    ["Código de município fora das UFs consultadas", c.foraDoUniverso],
  ];
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
      <div className="space-y-1">
        <div className="font-medium">Cobertura ({fmt(c.totalOrigem)} ações ainda sem execução)</div>
        {itens.map(([n, v]) => (
          <div key={n} className="flex justify-between gap-2 text-muted-foreground">
            <span>{n}</span><b className="text-foreground">{fmt(v)}</b>
          </div>
        ))}
        {c.municipiosSemPib?.length > 0 && (
          <p className="text-muted-foreground">Sem PIB: {c.municipiosSemPib.map((m) => `${m.nome} (${fmt(m.acoes)})`).join(", ")}</p>
        )}
      </div>
      <div className="space-y-1">
        <div className="font-medium">Recuperação pelo nome da vara ({fmt(c.recuperados)} recuperadas)</div>
        {recuperacao.map((r) => (
          <div key={r.tribunal} className="flex justify-between gap-2 text-muted-foreground">
            <span>{r.tribunal.toUpperCase()}: {fmt(r.semMunicipio)} sem código</span>
            <span><b className="text-foreground">{fmt(r.recuperados)}</b> recuperadas · {fmt(r.naoRecuperadosTotal)} não</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConcentracaoCobertura;