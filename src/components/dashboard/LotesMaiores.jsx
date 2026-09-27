import React from "react";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

export function LotesMaiores({ data }) {
  const maiores = data?.maiores || [];
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Maiores lotes</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {(data?.faixas || []).map((f) => (
          <span key={f.faixa} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {f.faixa} ações: <b className="text-foreground">{fmt(f.lotes)}</b>
          </span>
        ))}
      </div>
      <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-border/60 text-xs">
        {maiores.length === 0 && <p className="py-3 text-muted-foreground">Nenhum lote identificado.</p>}
        {maiores.map((m, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <div className="truncate font-medium">{m.vara}</div>
              <div className="text-muted-foreground">{m.tribunal.toUpperCase()} · {m.data}</div>
            </div>
            <span className="font-heading text-sm font-semibold">{fmt(m.acoes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LotesMaiores;