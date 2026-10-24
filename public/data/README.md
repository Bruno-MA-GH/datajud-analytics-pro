# Dados publicados

Resultados reais exportados da entidade `AnaliseSalva` (conteúdo dos arquivos privados, não URIs).
`manifest.json` lista cada análise, os parâmetros (tribunais), a data da coleta e falhas.

Pendências: `fetchTipoDano` não possui resultado salvo. Todas as análises cobrem apenas a
seleção padrão de 16 TJs; outras seleções não podem ser recalculadas (os resultados salvos já
vêm agregados).

## Atualizar
1. No app Base44 (ambiente administrativo), rode as análises para gravar em `AnaliseSalva`
   (rotina em `src/lib/analiseCacheColeta.js` + funções em `base44/functions`).
2. Peça ao assistente Base44 para reexportar `AnaliseSalva` para `public/data` e sincronizar com o GitHub.
3. A Vercel republica automaticamente.
