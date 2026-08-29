import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, CheckCheck } from "lucide-react";
import { TRIBUNAL_OPTIONS, DEFAULT_TRIBUNALS } from "@/lib/tribunals";

// Filtro multi-seleção de tribunais do DataJud.
export function TribunalFilter({ value, onApply }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const sync = () => setDraft(value);

  const toggle = (v) => {
    setDraft((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const apply = () => {
    const next = draft.length ? draft : DEFAULT_TRIBUNALS;
    onApply(next);
    setOpen(false);
  };

  const selectAll = () => setDraft(DEFAULT_TRIBUNALS);
  const clear = () => setDraft([]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) sync();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span>Tribunais</span>
          <Badge variant="secondary" className="rounded-md">
            {value.length}
          </Badge>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/70">
          <span className="text-xs font-medium text-muted-foreground">
            {draft.length} selecionados
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
              Todos
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clear}>
              Limpar
            </Button>
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {TRIBUNAL_OPTIONS.map((t) => (
              <label
                key={t.value}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
              >
                <Checkbox
                  checked={draft.includes(t.value)}
                  onCheckedChange={() => toggle(t.value)}
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border/70">
          <Button className="w-full gap-2" onClick={apply}>
            <CheckCheck className="h-4 w-4" />
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default TribunalFilter;