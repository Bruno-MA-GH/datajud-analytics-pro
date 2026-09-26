import React, { useMemo } from "react";
import { Landmark, Scale, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : "0.0");

// Indicadores-síntese do recorte JE × Justiça Comum.
export function SegmentacaoResumo({ data }) {
  const t = useMemo(
    () =>
      data.reduce(
        (s, d) => ({
          je: s.je + (d.je || 0),
          comum: s.comum + (d.comum || 0),
          grat: s.grat + (d.comumGratuidade || 0),
          indef: s.indef + (d.comumIndeferimento || 0),
        }),
        { je: 0, comum: 0, grat: 0, indef: 0 }
      ),
    [data]
  );
  const total = t.je + t.comum;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard
        icon={Landmark}
        label="Distribuídas no Juizado Especial"
        value={`${pct(t.je, total)}%`}
        hint={`${t.je.toLocaleString("pt-BR")} JE · ${t.comum.toLocaleString("pt-BR")} Justiça Comum`}
      />
      <MetricCard
        icon={Scale}
        label="Gratuidade real na Justiça Comum"
        value={`${pct(t.grat, t.comum)}%`}
        hint={`${t.grat.toLocaleString("pt-BR")} deferimentos · ${t.indef.toLocaleString("pt-BR")} indeferimentos`}
        accent="text-amber-600"
      />
      <MetricCard
        icon={ShieldCheck}
        label="Ações sem custas iniciais"
        value={`${pct(t.je + t.grat, total)}%`}
        hint="JE (estrutural) + Justiça Comum com gratuidade deferida"
      />
    </div>
  );
}

export default SegmentacaoResumo;