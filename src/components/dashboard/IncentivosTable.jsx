import React, { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";

const soma = (ls, k) => ls.reduce((s, l) => s + (l[k] || 0), 0);
const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// Indicadores disponíveis: valor por tribunal e valor agregado (média ponderada).
const METRICAS = [
  { k: "acordo", nome: "Taxa de acordo", pct: true, v: (l) => (l.conhecimento ? (l.acordo / l.conhecimento) * 100 : 0) },
  { k: "execucao", nome: "Conversão em execução", pct: true, v: (l) => (l.conhecimento ? (l.cumprimento / l.conhecimento) * 100 : 0) },
  { k: "movimentos", nome: "Movimentos / processo", pct: false, v: (l) => l.movimentosPorProcesso || 0 },
  { k: "baixa", nome: "Índice de baixa", pct: true, v: (l) => (l.total ? (l.baixados / l.total) * 100 : 0) },
];

// Gráfico de acordo, execução, esforço processual e baixa por tribunal.
export function IncentivosTable({ data }) {
  const [sel, setSel] = useState("acordo");
  const m = METRICAS.find((x) => x.k === sel);
  const linhas = data?.linhas || [];
  const { serie, geral } = useMemo(() => {
    const t = soma(linhas, "total");
    const total = {
      total: t, conhecimento: soma(linhas, "conhecimento"), acordo: soma(linhas, "acordo"),
      cumprimento: soma(linhas, "cumprimento"), baixados: soma(linhas, "baixados"),
      movimentosPorProcesso: t ? linhas.reduce((s, l) => s + l.movimentosPorProcesso * l.total, 0) / t : 0,
    };
    const serie = linhas.map((l) => ({ tribunal: l.tribunal.toUpperCase(), valor: m.v(l), acoes: l.total })).sort((a, b) => b.valor - a.valor);
    return { serie, geral: m.v(total) };
  }, [linhas, m]);
  const f = (v) => `${fmt(v)}${m.pct ? "%" : ""}`;
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-heading text-base font-semibold">Acordo, execução, esforço e baixa por tribunal</h3>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{m.nome} · total</div>
          <div className="font-heading text-2xl font-semibold">{f(geral)}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {METRICAS.map((x) => (
          <Button key={x.k} size="sm" variant={x.k === sel ? "default" : "outline"} className="h-7 text-xs" onClick={() => setSel(x.k)}>{x.nome}</Button>
        ))}
      </div>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="tribunal" fontSize={10} interval={0} angle={-45} textAnchor="end" height={50} />
            <YAxis fontSize={11} tickFormatter={f} />
            <Tooltip formatter={(v, n, p) => [`${f(v)} (${fmt(p.payload.acoes)} ações)`, m.nome]} />
            <ReferenceLine y={geral} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Total", fontSize: 10, position: "right" }} />
            <Bar dataKey="valor" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default IncentivosTable;