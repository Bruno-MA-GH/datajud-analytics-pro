import React, { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const p1 = (v) => `${(v * 100).toFixed(1)}%`;
const norm = (arr, k) => {
  const vs = arr.map((x) => x[k]), mn = Math.min(...vs), mx = Math.max(...vs);
  return (v) => (mx > mn ? (v - mn) / (mx - mn) : 0);
};

// Índice composto (0–100) por tribunal: média de % de ações em lote e taxa de acordo, normalizadas.
export function PredatoriaTable({ lotes, incentivos }) {
  const linhas = useMemo(() => {
    const inc = Object.fromEntries((incentivos?.linhas || []).map((l) => [l.tribunal, l]));
    const base = (lotes?.porTribunal || []).filter((t) => inc[t.tribunal] && t.acoes).map((t) => ({
      tribunal: t.tribunal,
      lote: t.acoesEmLote / t.acoes,
      acordo: inc[t.tribunal].conhecimento ? inc[t.tribunal].acordo / inc[t.tribunal].conhecimento : 0,
    }));
    if (!base.length) return [];
    const nl = norm(base, "lote"), na = norm(base, "acordo");
    return base.map((b) => ({ ...b, indice: ((nl(b.lote) + na(b.acordo)) / 2) * 100 })).sort((a, b) => b.indice - a.indice);
  }, [lotes, incentivos]);
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Índice de indícios de litigância predatória</h3>
      <Table className="mt-3 text-xs">
        <TableHeader><TableRow><TableHead>Tribunal</TableHead><TableHead className="text-right">% em lote</TableHead><TableHead className="text-right">Taxa de acordo</TableHead><TableHead className="text-right">Índice (0–100)</TableHead></TableRow></TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow key={l.tribunal}>
              <TableCell className="font-medium">{l.tribunal.toUpperCase()}</TableCell>
              <TableCell className="text-right">{p1(l.lote)}</TableCell>
              <TableCell className="text-right">{p1(l.acordo)}</TableCell>
              <TableCell className="text-right font-semibold">{l.indice.toFixed(0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PredatoriaTable;