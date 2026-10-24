import { base44 } from "@/api/base44Client";

// Resultados das análises ficam gravados no servidor (entidade AnaliseSalva +
// arquivo privado), iguais para todos os acessos. Só consulta o DataJud quando
// a análise ainda não foi salva, ou quando o usuário pede "Atualizar".
let forcar = false;
const refeitas = new Set();

const chaveDe = (fn, payload) => `${fn}:${JSON.stringify(payload)}`;

async function lerSalva(chave) {
  const { items } = await base44.entities.AnaliseSalva.filter({ chave }, { sort: "-created_date", limit: 1 });
  const reg = items[0];
  if (!reg) return null;
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: reg.arquivo });
  const dados = await (await fetch(signed_url)).json();
  return { ...dados, consultado_em: reg.created_date };
}

async function salvar(chave, fn, dados) {
  const file = new File([JSON.stringify(dados)], "analise.json", { type: "application/json" });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const { items } = await base44.entities.AnaliseSalva.filter({ chave }, { limit: 20 });
  await base44.entities.AnaliseSalva.create({ chave, funcao: fn, arquivo: file_uri });
  await Promise.all(items.map((r) => base44.entities.AnaliseSalva.delete(r.id)));
}

export function analiseQuery(fn, payload) {
  const chave = chaveDe(fn, payload);
  return {
    queryKey: ["analise", fn, payload],
    queryFn: async () => {
      const refazer = forcar && !refeitas.has(chave);
      if (!refazer) {
        const salva = await lerSalva(chave);
        if (salva) return salva;
      }
      const r = await base44.functions.invoke(fn, payload);
      const dados = r.data;
      // Resultado incompleto (tribunais sem resposta) não é gravado como definitivo.
      if (!dados?.tribunais_falhas?.length) await salvar(chave, fn, dados);
      refeitas.add(chave);
      return { ...dados, consultado_em: new Date().toISOString() };
    },
    staleTime: Infinity,
    gcTime: Infinity,
    // "PARCIAL": o servidor guardou o que já obteve do CNJ e pede nova chamada
    // para concluir os tribunais restantes.
    retry: (n, e) => (mensagemErro(e).startsWith("PARCIAL") ? n < 15 : n < 1),
    retryDelay: (n, e) => (mensagemErro(e).startsWith("PARCIAL") ? 500 : 2000),
    refetchOnWindowFocus: false,
  };
}

// "Atualizar": as análises exibidas são consultadas de novo e as salvas substituídas.
export function limparCacheAnalises() {
  forcar = true;
  refeitas.clear();
}

export const mensagemErro = (e) => e?.response?.data?.error || e?.message || "Falha ao consultar o DataJud.";