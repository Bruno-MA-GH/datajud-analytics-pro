import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const fmt = (v, d = 0) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: d });

// Ações aéreas originárias por 100 mil passageiros (ANAC), por UF.
export function AcessoPassageirosChart({ data }) {
  const linhas = data?.linhas || [];
  const [ini, fim] = data?.periodo || [];
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Ações por 100 mil passageiros, por UF</h3>
      <p className="text-xs text-muted-foreground mt-1">
        Ações originárias (JE/G1) de {ini} a {fim} ÷ passageiros pagos embarcados e desembarcados na UF no mesmo período (ANAC).
      </p>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={linhas} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="uf" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={(v) => fmt(v)} />
            <Tooltip
              formatter={(v) => [fmt(v, 1), "Ações / 100 mil passageiros"]}
              labelFormatter={(uf, p) => {
                const d = p?.[0]?.payload;
                return d ? `${uf} · ${fmt(d.acoes)} ações · ${fmt(d.passageiros)} passageiros` : uf;
              }}
            />
            <Bar dataKey="taxa" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AcessoPassageirosChart;