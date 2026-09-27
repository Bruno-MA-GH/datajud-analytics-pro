import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotaMetodologica } from "@/components/dashboard/NotaMetodologica";

// Exibe uma análise por vez: título, conteúdo e nota metodológica.
export function AnalysisCarousel({ slides }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  const go = (d) => setI((i + d + slides.length) % slides.length);
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Análise {i + 1} de {slides.length}</div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">{s.titulo}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Próxima"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {slides.map((sl, k) => (
          <button key={sl.titulo} onClick={() => setI(k)}
            className={`rounded-full px-3 py-1 text-xs border ${k === i ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {sl.titulo}
          </button>
        ))}
      </div>
      <div className="mt-4" key={i}>
        {s.conteudo}
        <NotaMetodologica>{s.nota}</NotaMetodologica>
      </div>
    </section>
  );
}

export default AnalysisCarousel;