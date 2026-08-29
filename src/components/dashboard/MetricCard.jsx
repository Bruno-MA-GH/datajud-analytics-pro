import React from "react";
import { Plane, Scale, CalendarRange, TrendingUp } from "lucide-react";

// Cartão de KPI com ícone, rótulo e valor destacados.
export function MetricCard({ icon: Icon, label, value, hint, accent = "text-foreground" }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
        <span className={`rounded-lg bg-muted/60 p-2 ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <div className="text-2xl font-heading font-semibold tracking-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
    </div>
  );
}

export default MetricCard;