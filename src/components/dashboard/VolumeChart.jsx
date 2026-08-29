import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  ComposedChart,
} from "recharts";

// Série histórica do volume de ações aeronáuticas.
// Linha suave + área sutil de fundo para reforçar a leitura de evolução.
export function VolumeChart({ data }) {
  // Agrega a série mensal por ano para que o eixo horizontal seja contado em anos.
  const yearly = useMemo(() => {
    const byYear = new Map();
    for (const d of data) {
      const y = (d.month || "").slice(0, 4);
      if (!y) continue;
      byYear.set(y, (byYear.get(y) || 0) + (d.count || 0));
    }
    return [...byYear.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, count]) => ({ year, count }));
  }, [data]);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold">
          Evolução do volume de ações aeronáuticas
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Novos processos por ano · assuntos: Atraso de vôo, Cancelamento de vôo, Extravio de bagagem
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={yearly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a5f" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#1e3a5f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
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
              formatter={(v) => [`${v} processos`, "Ajuizamentos"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="none"
              fill="url(#gradVolume)"
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#1e3a5f"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default VolumeChart;