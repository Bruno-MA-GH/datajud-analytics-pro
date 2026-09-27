import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR");
const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");

// Perfil dos processos com suspensão/sobrestamento e movimentação após 26/11/2025.
export function TemaSuspensosPerfil({ data }) {
  const p = data?.perfil || {};
  const linhas = [
    ["Juizado Especial", p.je], ["Justiça Comum", p.comum], ["Cumprimento de sentença", p.cumprimento],
    ["Atraso de voo", p.atraso], ["Cancelamento de voo", p.cancelamento], ["Extravio de bagagem", p.extravio],
  ];
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Perfil dos processos suspensos</h3>
      <p className="text-xs text-muted-foreground mt-1">{fmt(p.total)} processos com suspensão/sobrestamento e movimentação desde 26/11/2025</p>
      <Table className="mt-3 text-xs">
        <TableHeader><TableRow><TableHead>Recorte</TableHead><TableHead className="text-right">Processos</TableHead><TableHead className="text-right">% do total</TableHead></TableRow></TableHeader>
        <TableBody>
          {linhas.map(([n, v]) => (
            <TableRow key={n}><TableCell>{n}</TableCell><TableCell className="text-right">{fmt(v)}</TableCell><TableCell className="text-right">{pct(v, p.total)}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {(data?.porTribunal || []).filter((t) => t.suspensos).map((t) => (
          <span key={t.tribunal} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {t.tribunal.toUpperCase()}: <b className="text-foreground">{fmt(t.suspensos)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export default TemaSuspensosPerfil;