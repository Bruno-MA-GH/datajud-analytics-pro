import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Índice de Justiça Gratuita: compara dois critérios ao longo do tempo.
//  - proporcaoMovimento: concessão efetiva via movimento "Gratuidade da Justiça"
//  - proporcaoAssunto:   matéria "Assistência Judiciária Gratuita" (TPU 10685)
export function JusticeGratuitaChart({ data }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold">
          Índice de justiça gratuita
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Dois critérios comparados: concessão por movimento vs. assunto (TPU 10685)
        </p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
              width={44}
              tickFormatter={(v) => `${v}%`}
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
                const label =
                  name === "proporcaoMovimento"
                    ? "Por movimento (concessão)"
                    : "Por assunto (TPU 10685)";
                return [`${value}%`, label];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) =>
                value === "proporcaoMovimento"
                  ? "Por movimento (concessão)"
                  : "Por assunto (TPU 10685)"
              }
            />
            <Line
              type="monotone"
              dataKey="proporcaoMovimento"
              stroke="#c98a2a"
              strokeWidth={2}
              dot={false}
              name="proporcaoMovimento"
            />
            <Line
              type="monotone"
              dataKey="proporcaoAssunto"
              stroke="#5b7a99"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              name="proporcaoAssunto"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default JusticeGratuitaChart;