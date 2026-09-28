import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const p1 = (v) => `${(v * 100).toFixed(1)}%`;
const norm = (arr, k) => {
  const vs = arr.map((x) => x[k]), mn = Math.min(...vs), mx = Math.max(...vs);
  return (v) => (mx > mn ? (v - mn) / (mx - mn) : 0);
};

// Índice composto (0–100) por tribunal: média de % de ações em lote e taxa de acordo, normalizadas.
// Barras empilhadas mostram a contribuição de cada componente ao índice.
export function PredatoriaTable({ lotes, incentivos }) {
  const linhas = useMemo(() => {
    const inc = Object.fromEntries((incentivos?.linhas || []).map((l) => [l.tribunal, l]));
    const base = (lotes?.porTribunal || []).filter((t) => inc[t.tribunal] && t.acoes).map((t) => ({
      tribunal: t.tribunal.toUpperCase(),
      lote: t.acoesEmLote / t.acoes,
      acordo: inc[t.tribunal].conhecimento ? inc[t.tribunal].acordo / inc[t.tribunal].conhecimento : 0,
    }));
    if (!base.length) return [];
    const nl = norm(base, "lote"), na = norm(base, "acordo");
    return base.map((b) => ({ ...b, cLote: nl(b.lote) * 50, cAcordo: na(b.acordo) * 50, indice: ((nl(b.lote) + na(b.acordo)) / 2) * 100 }))
      .sort((a, b) => b.indice - a.indice);
  }, [lotes, incentivos]);
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Índice de indícios de litigância predatória</h3>
      <p className="text-xs text-muted-foreground mt-1">Índice de 0 a 100 por tribunal, decomposto na contribuição de cada indicador.</p>
      <div className="mt-4" style={{ height: Math.max(240, linhas.length * 28 + 60) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={linhas} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} fontSize={11} />
            <YAxis type="category" dataKey="tribunal" fontSize={11} width={50} />
            <Tooltip
              formatter={(v, n, p) => [n === "% em lote" ? p1(p.payload.lote) : p1(p.payload.acordo), n]}
              labelFormatter={(t, p) => `${t} · índice ${p?.[0]?.payload.indice.toFixed(0) ?? ""}`}
            />
            <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="cLote" name="% em lote" stackId="i" fill="hsl(var(--chart-1))" isAnimationActive={false} />
            <Bar dataKey="cAcordo" name="Taxa de acordo" stackId="i" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PredatoriaTable;