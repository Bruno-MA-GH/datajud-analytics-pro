import React from "react";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

function Lista({ titulo, itens, total, upper }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{titulo}</div>
      <ul className="mt-1 space-y-1">
        {itens.map((i) => (
          <li key={i.nome} className="text-xs">
            <div className="flex justify-between gap-2">
              <span className="truncate">{upper ? i.nome.toUpperCase() : i.nome}</span>
              <span className="tabular-nums">{fmt(i.total)}</span>
            </div>
            <div className="mt-0.5 h-1 rounded bg-muted">
              <div className="h-1 rounded bg-chart-3" style={{ width: `${total ? (i.total / total) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Perfil da faixa selecionada: tribunais, graus e classes.
export function ParadosDetalhe({ faixa }) {
  if (!faixa) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 space-y-4">
      <div>
        <div className="text-xs text-muted-foreground">Faixa selecionada</div>
        <div className="font-heading text-lg font-semibold">{faixa.nome} · {fmt(faixa.total)} processos</div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Lista titulo="Tribunal" itens={faixa.tribunais.slice(0, 8)} total={faixa.total} upper />
        <Lista titulo="Grau" itens={faixa.graus} total={faixa.total} />
        <Lista titulo="Classe (principais)" itens={faixa.classes} total={faixa.total} />
      </div>
    </div>
  );
}

export default ParadosDetalhe;