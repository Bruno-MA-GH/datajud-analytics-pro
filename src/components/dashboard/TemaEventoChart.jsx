import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const media = (a) => (a.length ? a.reduce((s, d) => s + d.count, 0) / a.length : 0);

// Estudo de evento: ajuizamentos mensais antes e depois da suspensão (26/11/2025).
export function TemaEventoChart({ data }) {
  const { serie, antes, depois } = useMemo(() => {
    const s = data?.serie || [];
    const completos = s.slice(0, -1); // o mês corrente ainda está incompleto
    return {
      serie: s,
      antes: media(completos.filter((d) => d.month >= "2024-11" && d.month <= "2025-10")),
      depois: media(completos.filter((d) => d.month >= "2025-12")),
    };
  }, [data]);
  const variacao = antes ? ((depois / antes - 1) * 100).toFixed(1) : "0.0";
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Novas ações antes e depois da suspensão</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">Média mensal (12 meses antes)</div><div className="font-heading text-lg font-semibold">{fmt(antes)}</div></div>
        <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">Média mensal (após dez/2025)</div><div className="font-heading text-lg font-semibold">{fmt(depois)}</div></div>
        <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">Variação</div><div className="font-heading text-lg font-semibold">{variacao}%</div></div>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={serie}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={fmt} />
            <Tooltip formatter={(v) => [fmt(v), "Ajuizamentos"]} />
            <ReferenceLine x="2025-11" stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Suspensão 26/11/2025", fontSize: 11, position: "insideTopLeft" }} />
            <Line dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TemaEventoChart;