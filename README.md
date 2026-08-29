# Legal Dashboard — Litigância Aérea (DataJud/CNJ)

Dashboard analítico para artigo científico sobre litigância abusiva no setor aéreo.
Consulta a **API Pública do DataJud (CNJ)** via agregações do Elasticsearch e exibe a
evolução temporal do volume de ações e do índice de justiça gratuita.

## Visão geral da arquitetura

```
Frontend (React + Tailwind + Recharts)
        │  base44.functions.invoke(...)
        ▼
Backend for Frontend (funções Node.js)
        │  POST https://api-publica.datajud.cnj.br/api/publico/<tribunal>/_search
        │  Authorization: ApiKey <DATAJUD_API_KEY>
        ▼
DataJud / Elasticsearch  (size:0 + date_histogram  →  apenas contagens por mês)
```

- **BFF**: `base44/functions/fetchAviationVolume` e `base44/functions/fetchJusticeGratuita`.
  Guardam a API Key, montam a query DSL, disparam os tribunais em paralelo e devolvem
  séries limpas. Lógica compartilhada em `base44/shared/datajud.ts`.
- **Frontend**: `src/pages/LegalDashboard.jsx` + componentes em `src/components/dashboard/`.
- **Visualização**: Recharts (linha/área para volume; barras empilhadas para justiça gratuita).

## Configuração da API Key (`.env`)

A chave é obtida gratuitamente em: **https://api-publica.datajud.cnj.br/**

Em um projeto Node convencional, crie um `.env` na raiz:

```bash
DATAJUD_API_KEY=sua_chave_datajud_aqui
```

> Nesta plataforma (Base44), a chave é cadastrada como **secret** em
> **Dashboard → Settings → Environment Variables** com o nome `DATAJUD_API_KEY`.
> As funções a leem via `secrets.get("DATAJUD_API_KEY")`. Não há arquivo `.env`
> versionado — a chave nunca fica no código nem no front.

## Rodando localmente

```bash
npm install
npm run dev      # sobe o frontend (Vite)
```

As funções de backend são deployadas pela própria plataforma; em ambiente local
de desenvolvimento do BFF, o mesmo segredo `DATAJUD_API_KEY` deve estar disponível
no ambiente de execução das funções.

## Estratégia de extração (notas metodológicas)

Para contornar o **limite de 10k hits** da paginação do DataJud, todas as consultas
usam `size: 0` com `date_histogram` (agregações) — retornam apenas a contagem de
processos agrupada por mês, poupando banda e processamento.

- **Volume de ações**: `terms` em `assunto.codigo` (TPUs 11843, 11844, 11845) +
  `date_histogram` mensal em `dataAjuizamento`.
- **Justiça gratuita**: mesmo filtro aéreo + `date_histogram` mensal com sub-agregação
  `filter` (TPU 10685) para obter, por mês, total e com-gratuidade.

Códigos de TPU usados:

| TPU   | Descrição |
|-------|-----------|
| 11843 | Atraso de voo |
| 11844 | Cancelamento de voo |
| 11845 | Extravio de bagagem |
| 10685 | Assistência Judiciária Gratuita |

As queries DSL estão comentadas linha a linha nos arquivos das funções
(`base44/functions/*/entry.ts`) para fins de validação metodológica.