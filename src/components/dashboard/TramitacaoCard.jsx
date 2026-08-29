import React from "react";
import { Clock } from "lucide-react";

// Card "Tempo de tramitação e eficiência".
// Duração = último movimento processual menos dataAjuizamento (em dias).
// Leitura teórica: cada dia de tramitação é custo social (Shavell — o litigante
// não internaliza o custo público que impõe ao sistema) e custo individual
// (Vitorelli — tempo, desgaste e valor presente do direito postulado).
export function TramitacaoCard({ tramitacao }) {
  const { mediaDias = 0, medianaDias = 0, p90Dias = 0, processosComData = 0 } =
    tramitacao || {};

  const meses = (d) => (d / 30.44).toFixed(1);

  const linhas = [
    { label: "Média", dias: mediaDias, destaque: true },
    { label: "Mediana (p50)", dias: medianaDias },
    { label: "Cauda longa (p90)", dias: p90Dias },
  ];

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">
            Tempo de tramitação e eficiência
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Do ajuizamento ao último movimento processual · custo temporal do litígio
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-muted/40 p-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-3">
        {linhas.map((l) => (
          <div
            key={l.label}
            className="flex items-baseline justify-between border-b border-border/50 pb-2 last:border-0"
          >
            <span className="text-sm text-muted-foreground">{l.label}</span>
            <span className="text-right">
              <span
                className={
                  l.destaque
                    ? "font-heading text-2xl font-semibold text-foreground"
                    : "font-heading text-lg font-semibold text-foreground"
                }
              >
                {l.dias.toLocaleString("pt-BR")}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                dias · {meses(l.dias)} meses
              </span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        Base: {processosComData.toLocaleString("pt-BR")} processos com data de
        ajuizamento válida. O tempo médio de {meses(mediaDias)} meses é o preço
        temporal que o autor paga pelo benefício esperado — e, do lado público, o
        custo social da litigância que o litigante individual não internaliza
        (Shavell), agravado pela assimetria de custo denunciada por Vitorelli.
      </p>
    </div>
  );
}

export default TramitacaoCard;