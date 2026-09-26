import React from "react";

// Comparativo de eficiência e desfecho entre Juizado Especial e Justiça Comum.
const share = (r, keys) =>
  r?.julgados ? (keys.reduce((s, k) => s + (r[k] || 0), 0) / r.julgados) * 100 : 0;

const LINHAS = [
  { label: "Tempo médio de tramitação", fmt: (d) => `${(d.tramitacao?.mediaDias || 0).toLocaleString("pt-BR")} dias` },
  { label: "Mediana (p50)", fmt: (d) => `${(d.tramitacao?.medianaDias || 0).toLocaleString("pt-BR")} dias` },
  { label: "Cauda longa (p90)", fmt: (d) => `${(d.tramitacao?.p90Dias || 0).toLocaleString("pt-BR")} dias` },
  { label: "Êxito do autor", fmt: (d) => `${share(d.resultado, ["procedencia", "parcial", "acordo"]).toFixed(1)}%` },
  { label: "Transação / acordo", fmt: (d) => `${share(d.resultado, ["acordo"]).toFixed(1)}%` },
  { label: "Improcedência", fmt: (d) => `${share(d.resultado, ["improcedencia"]).toFixed(1)}%` },
  { label: "Sem resolução do mérito", fmt: (d) => `${share(d.resultado, ["semMerito"]).toFixed(1)}%` },
];

export function ComparativoRitoCard({ je, comum }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">
        Eficiência e desfecho por tipo de justiça
      </h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Rito sumaríssimo (JE) × rito comum · por classe processual
      </p>
      <div className="grid grid-cols-3 border-b border-border/70 pb-2 text-xs font-medium text-muted-foreground">
        <span>Indicador</span>
        <span className="text-right">Juizado Especial</span>
        <span className="text-right">Justiça Comum</span>
      </div>
      {LINHAS.map((l) => (
        <div key={l.label} className="grid grid-cols-3 border-b border-border/40 py-2.5 text-sm last:border-0">
          <span className="text-muted-foreground">{l.label}</span>
          <span className="text-right font-medium">{je ? l.fmt(je) : "—"}</span>
          <span className="text-right font-medium">{comum ? l.fmt(comum) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

export default ComparativoRitoCard;