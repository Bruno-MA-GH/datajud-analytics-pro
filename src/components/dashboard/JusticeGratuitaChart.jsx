import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Quantidade de processos com deferimento de justiça gratuita ao longo do
// tempo. Critério: presença do movimento "Gratuidade da Justiça" (concessão
// efetiva). Eixo X = anos; eixo Y = processos. Os dados mensais do BFF são
// agregados por ano para uma leitura mais limpa da série histórica.
export function JusticeGratuitaChart({ data }) {
  const yearly = useMemo(() => {
    const byYear = new Map();
    for (const d of data) {
      const y = (d.month || "").slice(0, 4);
      if (!y) continue;
      byYear.set(y, (byYear.get(y) || 0) + (d.comGratuidadeMovimento || 0));
    }
    return [...byYear.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, count]) => ({ year, count }));
  }, [data]);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold">
          Processos com deferimento de justiça gratuita
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Quantidade por ano · critério: movimento "Gratuidade da Justiça" (concessão efetiva)
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={yearly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradJG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c98a2a" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#c98a2a" stopOpacity={0} />
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
              width={56}
              tickFormatter={(v) => v.toLocaleString("pt-BR")}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600 }}
              labelFormatter={(y) => `${y}`}
              formatter={(v) => [`${Number(v).toLocaleString("pt-BR")} processos`, "Deferimentos"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#c98a2a"
              strokeWidth={2}
              fill="url(#gradJG)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default JusticeGratuitaChart;