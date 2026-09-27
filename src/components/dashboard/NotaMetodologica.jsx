import React, { useState } from "react";
import { BookOpen, X } from "lucide-react";

// Nota metodológica recolhível exibida abaixo de cada gráfico.
export function NotaMetodologica({ children }) {
  const [aberta, setAberta] = useState(true);
  if (!aberta) {
    return (
      <button onClick={() => setAberta(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <BookOpen className="h-3.5 w-3.5" /> Mostrar nota metodológica
      </button>
    );
  }
  return (
    <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <BookOpen className="h-3.5 w-3.5" /> Nota metodológica
        </span>
        <button onClick={() => setAberta(false)} className="inline-flex items-center gap-1 hover:text-foreground">
          <X className="h-3.5 w-3.5" /> Fechar
        </button>
      </div>
      {children}
    </div>
  );
}

export default NotaMetodologica;