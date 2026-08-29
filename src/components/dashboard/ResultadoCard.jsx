import React, { useMemo } from "react";
import { Gavel } from "lucide-react";

// Card "Taxa de procedência/improcedência".
// Varredura dos movimentos do TPU de Magistratura que registram o resultado do
// julgamento (procedência, improcedência, procedência em parte, extinção sem
// resolução do mérito e transação/acordo). Permite contrastar o BENEFÍCIO
// ESPERADO pelo autor com o RESULTADO REAL da base.
const CATEGORIAS = [
  { key: "procedencia", label: "Procedência", cor: "bg-emerald-600" },
  { key: "parcial", label: "Procedência em parte", cor: "bg-emerald-400" },
  { key: "acordo", label: "Transação / acordo", cor: "bg-sky-500" },
  { key: "improcedencia", label: "Improcedência", cor: "bg-rose-500" },
  { key: "semMerito", label: "Sem resolução do mérito", cor: "bg-slate-400" },
];

export function ResultadoCard({ resultado }) {
  const { julgados = 0 } = resultado || {};

  const linhas = useMemo(
    () =>
      CATEGORIAS.map((c) => {
        const n = resultado?.[c.key] || 0;
        return { ...c, n, pct: julgados ? (n / julgados) * 100 : 0 };
      }),
    [resultado, julgados]
  );

  // Êxito do autor = procedência + procedência em parte + acordo homologado.
  const exito = linhas
    .filter((l) => ["procedencia", "parcial", "acordo"].includes(l.key))
    .reduce((s, l) => s + l.pct, 0);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">
            Taxa de procedência e improcedência
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Movimentos do TPU de Magistratura · benefício esperado vs. resultado real
          </p>
        </div>
        <div className="rounded-lg border border-border/70 bg-muted/40 p-2">
          <Gavel className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="mb-4">
        <div className="font-heading text-3xl font-semibold text-emerald-700">
          {exito.toFixed(1)}%
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Êxito do autor (procedência total, parcial ou acordo homologado)
        </p>
      </div>

      <div className="space-y-2.5">
        {linhas.map((l) => (
          <div key={l.key}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{l.label}</span>
              <span className="font-medium text-foreground">
                {l.pct.toFixed(1)}%
                <span className="ml-1 text-muted-foreground">
                  ({l.n.toLocaleString("pt-BR")})
                </span>
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${l.cor}`}
                style={{ width: `${Math.min(l.pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        Base: {julgados.toLocaleString("pt-BR")} movimentos de resultado. Um
        processo pode registrar mais de um movimento (ex.: sentença seguida de
        reforma em grau recursal), de modo que os percentuais medem a incidência
        de cada desfecho, não uma partição exata dos autos.
      </p>
    </div>
  );
}

export default ResultadoCard;