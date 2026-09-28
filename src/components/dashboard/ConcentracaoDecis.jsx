import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

// Taxa de ações por 100 mil habitantes em cada decil populacional (menor → maior PIB per capita).
export function ConcentracaoDecis({ decis = [] }) {
  if (!decis.length) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold">Ações por 100 mil habitantes, por decil de PIB per capita</h4>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={decis} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="decil" tickFormatter={(v) => `D${v}`} fontSize={11} />
            <YAxis fontSize={11} tickFormatter={fmt} />
            <Tooltip
              labelFormatter={(v, p) => `Decil ${v} · PIB per capita até R$ ${fmt(p?.[0]?.payload?.pibpcMax)}`}
              formatter={(v, n, p) => [`${fmt(v)} (${fmt(p.payload.casos)} ações / ${fmt(p.payload.pop)} hab.)`, "Taxa"]}
            />
            <Bar dataKey="taxa100k" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ConcentracaoDecis;