import React, { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

// Distribuição anual das ações aéreas por regime de gratuidade:
//   JE              -> gratuidade estrutural (Lei 9.099/95, art. 54)
//   Comum deferida  -> benefício real (movimento "Gratuidade da Justiça")
//   Comum sem registro -> Justiça Comum sem deferimento registrado
const SERIES = {
  je: "Juizado Especial (estrutural)",
  comumGratuidade: "Justiça Comum · gratuidade deferida",
  comumSem: "Justiça Comum · sem gratuidade registrada",
};

export function GratuidadeSegmentadaChart({ data }) {
  const yearly = useMemo(() => {
    const byYear = new Map();
    for (const d of data) {
      const y = (d.month || "").slice(0, 4);
      const cur = byYear.get(y) || { year: y, je: 0, comumGratuidade: 0, comumSem: 0 };
      cur.je += d.je || 0;
      cur.comumGratuidade += d.comumGratuidade || 0;
      cur.comumSem += Math.max((d.comum || 0) - (d.comumGratuidade || 0), 0);
      byYear.set(y, cur);
    }
    return [...byYear.values()].sort((a, b) => a.year.localeCompare(b.year));
  }, [data]);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold">
          Gratuidade estrutural (JE) × benefício real (Justiça Comum)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ações aéreas distribuídas por ano, segundo o grau de origem (JE ou G1)
        </p>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yearly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => v.toLocaleString("pt-BR")} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", fontSize: 12 }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(v, name) => [`${Number(v).toLocaleString("pt-BR")} processos`, SERIES[name]]}
            />
            <Legend
              formatter={(name) => <span className="text-muted-foreground">{SERIES[name]}</span>}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Bar dataKey="je" stackId="a" fill="#1e3a5f" />
            <Bar dataKey="comumGratuidade" stackId="a" fill="#c98a2a" />
            <Bar dataKey="comumSem" stackId="a" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GratuidadeSegmentadaChart;