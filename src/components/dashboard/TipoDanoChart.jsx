import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export const SERIES_DANO = [
  { key: "atraso", nome: "Atraso de voo", cor: "hsl(var(--chart-1))" },
  { key: "cancelamento", nome: "Cancelamento de voo", cor: "hsl(var(--chart-2))" },
  { key: "extravio", nome: "Extravio de bagagem", cor: "hsl(var(--chart-4))" },
];
const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

// Série anual por tipo de dano.
export function TipoDanoChart({ data }) {
  const anual = useMemo(() => {
    const m = {};
    for (const d of data?.serie || []) {
      const a = d.month.slice(0, 4);
      m[a] = m[a] || { ano: a, atraso: 0, cancelamento: 0, extravio: 0 };
      SERIES_DANO.forEach((s) => { m[a][s.key] += d[s.key]; });
    }
    return Object.values(m).sort((a, b) => a.ano.localeCompare(b.ano));
  }, [data]);
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Ações por tipo de dano, por ano</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={anual}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="ano" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={fmt} />
            <Tooltip formatter={(v, n) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SERIES_DANO.map((s) => (
              <Line key={s.key} dataKey={s.key} name={s.nome} stroke={s.cor} strokeWidth={2} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TipoDanoChart;