import { base44 } from "@/api/base44Client";

// Resultados das análises ficam salvos no navegador por 24h, para não
// refazer as consultas ao DataJud a cada visita.
const TTL = 24 * 60 * 60 * 1000;
const PREFIXO = "datajud:";

const lerCache = (k) => {
  const c = JSON.parse(localStorage.getItem(k) || "null");
  return c && Date.now() - c.t < TTL ? c : null;
};

export function analiseQuery(fn, payload) {
  const k = PREFIXO + JSON.stringify([fn, payload]);
  return {
    queryKey: ["analise", fn, payload],
    queryFn: async () => {
      const r = await base44.functions.invoke(fn, payload);
      try {
        localStorage.setItem(k, JSON.stringify({ t: Date.now(), d: r.data }));
      } catch {
        // Armazenamento do navegador cheio: segue só com o cache em memória.
      }
      return r.data;
    },
    initialData: () => lerCache(k)?.d,
    initialDataUpdatedAt: () => lerCache(k)?.t,
    staleTime: TTL,
    gcTime: TTL,
    retry: 1,
    refetchOnWindowFocus: false,
  };
}

export function limparCacheAnalises() {
  Object.keys(localStorage).filter((k) => k.startsWith(PREFIXO)).forEach((k) => localStorage.removeItem(k));
}

export const mensagemErro = (e) => e?.response?.data?.error || e?.message || "Falha ao consultar o DataJud.";