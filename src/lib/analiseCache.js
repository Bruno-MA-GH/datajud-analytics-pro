// Versão pública: lê apenas os resultados reais exportados para /public/data.
// Não chama Base44, DataJud nem IBGE. A rotina original de coleta está em
// src/lib/analiseCacheColeta.js (uso administrativo no ambiente Base44).
import { DEFAULT_TRIBUNALS } from "@/lib/tribunals";

let manifestoP = null;
const carregarManifesto = () =>
  (manifestoP ||= fetch("/data/manifest.json", { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error("Manifesto de dados publicados não encontrado.");
    return r.json();
  }).catch((e) => { manifestoP = null; throw e; }));

const mesmaSelecao = (a = [], b = []) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function analiseQuery(fn, payload) {
  return {
    queryKey: ["analise", fn, payload],
    queryFn: async () => {
      const man = await carregarManifesto();
      const tribs = payload?.tribunals?.length ? payload.tribunals : DEFAULT_TRIBUNALS;
      const doFn = man.analises.filter((a) => a.funcao === fn && (a.parametros.rito || null) === (payload?.rito || null));
      if (!doFn.length) throw new Error("Esta análise ainda não foi coletada e não está disponível nos dados publicados.");
      const a = doFn.find((x) => mesmaSelecao(x.parametros.tribunals, tribs));
      if (!a) throw new Error(`Os dados publicados desta análise cobrem apenas a seleção de ${doFn[0].parametros.tribunals.length} tribunais (${doFn[0].parametros.tribunals.join(", ").toUpperCase()}). A seleção atual não pode ser recalculada com os dados disponíveis.`);
      const r = await fetch(`/data/${a.arquivo}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`Arquivo de dados ${a.arquivo} não encontrado.`);
      return { ...(await r.json()), consultado_em: a.consultado_em };
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  };
}

// "Recarregar dados publicados": relê os arquivos estáticos, sem nova coleta.
export function limparCacheAnalises() {
  manifestoP = null;
}

export const mensagemErro = (e) => e?.message || "Falha ao carregar os dados publicados.";