import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { MunicipioHover } from "@/components/dashboard/MunicipioHover";

export function ConcentracaoRendaChart({ data }) {
  const [ponto, setPonto] = useState(null);
  // Índice acumulado (−1 a +1) até cada município: 2 × área entre diagonal e curva, por trapézio.
  // No último ponto coincide com o índice global.
  const curva = useMemo(() => {
    let area = 0, px = 0, py = 0;
    return (data?.curva || []).map((p) => {
      const x = p.pop / 100, y = p.casos / 100;
      area += (x - px) * ((px - py) + (x - y));
      px = x; py = y;
      return { ...p, igualdade: p.pop, indiceLocal: area };
    });
  }, [data]);
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
      <div className="mt-4">
        <MunicipioHover ponto={ponto} />
      </div>
      <div className="mt-2 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curva} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
            onMouseMove={(s) => { const p = s?.activePayload?.[0]?.payload; if (p && p !== ponto) setPonto(p); }}
            onMouseLeave={() => setPonto(null)}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="pop" type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11}
              label={{ value: "População acumulada (menor → maior PIB per capita)", position: "insideBottom", offset: -10, fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
            <Tooltip
              formatter={(v, n) => [`${Number(v).toLocaleString("pt-BR")}%`, n]}
              labelFormatter={(v, p) => {
                const d = p?.[0]?.payload;
                return d?.municipio
                  ? `${d.municipio} · PIB per capita R$ ${(d.pibpc || 0).toLocaleString("pt-BR")} · Índice: ${d.indiceLocal.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
                  : `${v}% da população`;
              }}
            />
            <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="igualdade" name="Igualdade" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line dataKey="casos" name="Ações aéreas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} isAnimationActive={false} />
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