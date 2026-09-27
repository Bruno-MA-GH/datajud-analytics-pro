import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (v, d = 0) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: d });

// Evolução anual da taxa para a UF escolhida.
export function AcessoPassageirosSerie({ data }) {
  const linhas = data?.linhas || [];
  const [uf, setUf] = useState(null);
  const l = linhas.find((x) => x.uf === uf) || linhas[0];
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold">Evolução anual</h3>
        <Select value={l?.uf || ""} onValueChange={setUf}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="UF" /></SelectTrigger>
          <SelectContent>{linhas.map((x) => <SelectItem key={x.uf} value={x.uf}>{x.uf}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={l?.serie || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="ano" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v, n, p) => [`${fmt(v, 1)} (${fmt(p.payload.acoes)} ações · ${fmt(p.payload.passageiros)} pax)`, "Ações / 100 mil pax"]} />
            <Line dataKey="taxa" stroke="hsl(var(--chart-1))" strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AcessoPassageirosSerie;