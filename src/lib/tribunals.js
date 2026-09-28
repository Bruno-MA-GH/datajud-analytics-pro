// Catálogo de tribunais do DataJud público com rótulos amigáveis.
// Mantido em src/lib para uso no filtro do dashboard.

export const TRIBUNAL_OPTIONS = [
  { value: "tjsp", label: "TJSP · São Paulo" },
  { value: "tjrj", label: "TJRJ · Rio de Janeiro" },
  { value: "tjmg", label: "TJMG · Minas Gerais" },
  { value: "tjrs", label: "TJRS · Rio Grande do Sul" },
  { value: "tjpr", label: "TJPR · Paraná" },
  { value: "tjba", label: "TJBA · Bahia" },
  { value: "tjce", label: "TJCE · Ceará" },
  { value: "tjpe", label: "TJPE · Pernambuco" },
  { value: "tjsc", label: "TJSC · Santa Catarina" },
  { value: "tjgo", label: "TJGO · Goiás" },
  { value: "tjdft", label: "TJDFT · Distrito Federal e Territórios" },
  { value: "tjes", label: "TJES · Espírito Santo" },
  { value: "tjmt", label: "TJMT · Mato Grosso" },
  { value: "tjms", label: "TJMS · Mato Grosso do Sul" },
  { value: "tjpa", label: "TJPA · Pará" },
  { value: "tjam", label: "TJAM · Amazonas" },
];

export const DEFAULT_TRIBUNALS = TRIBUNAL_OPTIONS.map((t) => t.value);