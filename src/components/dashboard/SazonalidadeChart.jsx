import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { SERIES_DANO } from "@/components/dashboard/TipoDanoChart";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");

// Sazonalidade (soma por mês do ano) e duração média por tipo de dano.
export function SazonalidadeChart({ data }) {
  const saz = useMemo(() => {
    const m = MESES.map((mes) => ({ mes, atraso: 0, cancelamento: 0, extravio: 0 }));
    for (const d of data?.serie || []) {
      const i = Number(d.month.slice(5, 7)) - 1;
      SERIES_DANO.forEach((s) => { m[i][s.key] += d[s.key]; });
    }
    return m;
  }, [data]);
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Sazonalidade do ajuizamento</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={saz}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="mes" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={fmt} />
            <Tooltip formatter={(v, n) => [fmt(v), n]} />
            {SERIES_DANO.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.nome} stackId="a" fill={s.cor} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {(data?.duracao || []).map((d) => (
          <div key={d.tipo} className="rounded-lg bg-muted/40 p-2">
            <div className="text-muted-foreground">{SERIES_DANO.find((s) => s.key === d.tipo)?.nome}</div>
            <div className="font-heading text-base font-semibold">{fmt(d.mediaDias)} dias</div>
            <div className="text-muted-foreground">duração média</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SazonalidadeChart;