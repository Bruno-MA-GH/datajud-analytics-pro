import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ParadosDetalhe } from "@/components/dashboard/ParadosDetalhe";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

// Processos sem baixa por tempo desde o último movimento; clique numa barra para o perfil.
export function ProcessosParadosPerfil({ data }) {
  const faixas = data?.faixas || [];
  const [sel, setSel] = useState(3);
  const ativos = faixas.reduce((s, f) => s + f.total, 0);
  const parados = faixas.slice(2).reduce((s, f) => s + f.total, 0);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-semibold">Tempo desde o último movimento</h3>
            <p className="text-xs text-muted-foreground mt-1">Processos sem baixa ou arquivamento. Clique numa faixa para ver o perfil.</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Parados há mais de 180 dias</div>
            <div className="font-heading text-2xl font-semibold">{ativos ? ((parados / ativos) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : 0}%</div>
            <div className="text-xs text-muted-foreground">{fmt(parados)} de {fmt(ativos)}</div>
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={faixas} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="nome" fontSize={10} interval={0} />
              <YAxis fontSize={11} tickFormatter={fmt} />
              <Tooltip formatter={(v) => [fmt(v), "Processos"]} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false} className="cursor-pointer"
                onClick={(_, i) => setSel(i)}>
                {faixas.map((f, i) => (
                  <Cell key={f.nome} fill={i === sel ? "hsl(var(--chart-1))" : "hsl(var(--muted-foreground) / 0.35)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ParadosDetalhe faixa={faixas[sel]} />
    </div>
  );
}

export default ProcessosParadosPerfil;