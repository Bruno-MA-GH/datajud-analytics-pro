import React from "react";

const pct = (a, b) => (b ? `${((a / b) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—");
const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// Indicadores de incentivos e eficiência por tribunal.
export function IncentivosTable({ data }) {
  const linhas = data?.linhas || [];
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 overflow-x-auto">
      <h3 className="font-heading text-base font-semibold">Acordo, execução, esforço e baixa por tribunal</h3>
      <table className="mt-4 w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border/70 text-left">
            <th className="py-2 pr-3">Tribunal</th>
            <th className="py-2 pr-3 text-right">Ações</th>
            <th className="py-2 pr-3 text-right">Taxa de acordo</th>
            <th className="py-2 pr-3 text-right">Conversão em execução</th>
            <th className="py-2 pr-3 text-right">Movimentos / processo</th>
            <th className="py-2 text-right">Índice de baixa</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.tribunal} className="border-b border-border/40">
              <td className="py-2 pr-3 font-medium">{l.tribunal.toUpperCase()}</td>
              <td className="py-2 pr-3 text-right">{fmt(l.total)}</td>
              <td className="py-2 pr-3 text-right">{pct(l.acordo, l.conhecimento)}</td>
              <td className="py-2 pr-3 text-right">{pct(l.cumprimento, l.conhecimento)}</td>
              <td className="py-2 pr-3 text-right">{fmt(l.movimentosPorProcesso)}</td>
              <td className="py-2 text-right">{pct(l.baixados, l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IncentivosTable;