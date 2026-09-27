import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { LotesMaiores } from "@/components/dashboard/LotesMaiores";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

export function LotesChart({ data }) {
  const r = data?.resumo || {};
  const pct = r.totalAcoes ? ((r.acoesEmLote / r.totalAcoes) * 100).toFixed(1) : "0.0";
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <h3 className="font-heading text-base font-semibold">Ações ajuizadas em lote, por ano</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {fmt(r.nLotes)} lotes (≥ {data?.loteMin} ações na mesma vara e no mesmo dia) · {fmt(r.acoesEmLote)} ações · {pct}% das ações originárias
        </p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.serie || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="ano" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={fmt} />
              <Tooltip formatter={(v, n) => [fmt(v), n]} />
              <Bar dataKey="acoesEmLote" name="Ações em lote" fill="hsl(var(--chart-1))" isAnimationActive={false} />
              <Bar dataKey="lotes" name="Lotes" fill="hsl(var(--chart-3))" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <LotesMaiores data={data} />
    </div>
  );
}

export default LotesChart;