import React from "react";
import { useQueries } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { analiseQuery, mensagemErro } from "@/lib/analiseCache";

// Carrega as consultas de uma análise só quando ela é exibida.
// consultas: [[nomeDaFuncao, payload], ...]; children recebe os dados na mesma ordem.
export function Analise({ consultas, children }) {
  const qs = useQueries({ queries: consultas.map(([fn, p]) => analiseQuery(fn, p)) });
  const erro = qs.find((q) => q.isError);
  if (erro) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 mt-0.5" />
        <div>{mensagemErro(erro.error)}</div>
      </div>
    );
  }
  if (qs.some((q) => q.data === undefined)) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Consultando agregações do DataJud…</p>
      </div>
    );
  }
  return children(qs.map((q) => q.data));
}

export default Analise;