import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export function ConcentracaoRendaChart({ data }) {
  const curva = (data?.curva || []).map((p) => ({ ...p, igualdade: p.pop }));
  const indice = data?.indice ?? 0;
  const c = data?.cobertura;
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">Curva de concentração por PIB per capita</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Municípios ordenados do menor para o maior PIB per capita (IBGE 2023). Eixo X: população
            acumulada; eixo Y: ações aéreas acumuladas. Curva abaixo da diagonal indica litigância
            concentrada nos municípios mais ricos.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Índice de concentração</div>
          <div className="font-heading text-3xl font-semibold">{indice.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
        </div>
      </div>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curva} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="pop" type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11}
              label={{ value: "População acumulada (menor → maior PIB per capita)", position: "insideBottom", offset: -10, fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
            <Tooltip
              formatter={(v, n) => [`${Number(v).toLocaleString("pt-BR")}%`, n]}
              labelFormatter={(v, p) => `${v}% da população · PIB per capita até R$ ${(p?.[0]?.payload?.pibpc || 0).toLocaleString("pt-BR")}`}
            />
            <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="igualdade" name="Igualdade" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
            <Line dataKey="casos" name="Ações aéreas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {c && (
        <p className="mt-3 text-xs text-muted-foreground">
          {c.noUniverso.toLocaleString("pt-BR")} ações originárias em {c.municipios.toLocaleString("pt-BR")} municípios
          ({c.populacao.toLocaleString("pt-BR")} habitantes) · {(c.totalOrigem - c.noUniverso).toLocaleString("pt-BR")} sem
          município identificável ou fora das UFs consultadas.
        </p>
      )}
    </div>
  );
}

export default ConcentracaoRendaChart;