import React from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pct = (a, b) => (b ? `${((a / b) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—");
const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const soma = (ls, k) => ls.reduce((s, l) => s + (l[k] || 0), 0);

function Linha({ l, total }) {
  const C = total ? "font-semibold" : "";
  return (
    <TableRow>
      <TableCell className={`font-medium ${C}`}>{total ? "Total" : l.tribunal.toUpperCase()}</TableCell>
      <TableCell className={`text-right ${C}`}>{fmt(l.total)}</TableCell>
      <TableCell className={`text-right ${C}`}>{fmt(l.conhecimento)}</TableCell>
      <TableCell className={`text-right ${C}`}>{pct(l.acordo, l.conhecimento)}</TableCell>
      <TableCell className={`text-right ${C}`}>{pct(l.cumprimento, l.conhecimento)}</TableCell>
      <TableCell className={`text-right ${C}`}>{fmt(l.movimentosPorProcesso)}</TableCell>
      <TableCell className={`text-right ${C}`}>{pct(l.baixados, l.total)}</TableCell>
    </TableRow>
  );
}

// Tabela de acordo, execução, esforço processual e baixa por tribunal.
export function IncentivosTable({ data }) {
  const linhas = data?.linhas || [];
  const t = soma(linhas, "total");
  const total = {
    total: t, conhecimento: soma(linhas, "conhecimento"), acordo: soma(linhas, "acordo"),
    cumprimento: soma(linhas, "cumprimento"), baixados: soma(linhas, "baixados"),
    movimentosPorProcesso: t ? linhas.reduce((s, l) => s + l.movimentosPorProcesso * l.total, 0) / t : 0,
  };
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <h3 className="font-heading text-base font-semibold">Acordo, execução, esforço e baixa por tribunal</h3>
      <Table className="mt-3 text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Tribunal</TableHead><TableHead className="text-right">Ações</TableHead><TableHead className="text-right">Conhecimento</TableHead>
            <TableHead className="text-right">Taxa de acordo</TableHead><TableHead className="text-right">Conversão em execução</TableHead>
            <TableHead className="text-right">Movimentos / processo</TableHead><TableHead className="text-right">Índice de baixa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{linhas.map((l) => <Linha key={l.tribunal} l={l} />)}</TableBody>
        {linhas.length > 0 && <TableFooter><Linha l={total} total /></TableFooter>}
      </Table>
    </div>
  );
}

export default IncentivosTable;