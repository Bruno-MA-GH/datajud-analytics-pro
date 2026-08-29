import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Índice de Justiça Gratuita: barras empilhadas (com x sem gratuidade) por mês.
export function JusticeGratuitaChart({ data }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold">
          Índice de justiça gratuita
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Proporção de processos aeronáuticos com Assistência Judiciária Gratuita (TPU 10685)
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value, name) => {
                if (name === "proporcao") return [`${value}%`, "Com gratuidade"];
                return [value, name === "comGratuidade" ? "Com gratuidade" : "Sem gratuidade"];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) =>
                value === "comGratuidade" ? "Com gratuidade" : "Sem gratuidade"
              }
            />
            <Bar dataKey="semGratuidade" stackId="a" fill="#cfd8e3" radius={[0, 0, 0, 0]} />
            <Bar dataKey="comGratuidade" stackId="a" fill="#c98a2a" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default JusticeGratuitaChart;