# Radar de Notícias — Retail Mind Group

Ferramenta interna que recolhe diariamente notícias de retalho e imobiliário comercial de
~20 fontes portuguesas, classifica-as por **país** e **tema**, guarda-as num histórico
versionado e mostra-as numa página web filtrável. Envia também um email-resumo diário às 07:00.

## Como funciona

```
Task diária 07:00 (Claude Code)
  → recolhe RSS + WebSearch das fontes (src/data/sources.js)
  → classifica por país + tema (src/data/themes.js)
  → dedupe + acrescenta a public/data/articles.json
  → git push → Vercel reconstrói e publica a página
  → envia email-resumo (Resend)
```

- **Store de dados**: `public/data/articles.json` (a "base de dados"; fácil migrar para Supabase depois).
- **Frontend**: React + Vite estático, filtros client-side por país e tema.
- **Recolha**: guião em `scripts/collect.md`, executado pela task agendada.

## Correr localmente

```bash
npm install
npm run dev
```

Abre em http://localhost:5200 — a página lê `public/data/articles.json` (traz artigos de exemplo).

## Setup (uma vez)

1. **Repo + Vercel**
   - Cria o repo `retailmind-news` no GitHub e faz push.
   - Em vercel.com → **Add New Project** → importa o repo. O Vercel deteta Vite
     automaticamente (build `npm run build`, output `dist/`).
   - A cada `git push` o Vercel reconstrói e publica — inclusive os commits diários da task.
   - Alternativa por CLI: `npm i -g vercel` e depois `vercel` (preview) / `vercel --prod`.

2. **Email (Resend)**
   - Cria conta em resend.com, verifica um domínio de envio e gera uma API key.
   - Guarda-a como secret (para a task): `RESEND_API_KEY`.

3. **Task diária**
   - No Claude Code, agenda uma task recorrente às 07:00 que execute o guião `scripts/collect.md`.
   - Usa a skill `schedule` (ex.: "agenda todos os dias às 07:00 executar scripts/collect.md neste repo").

## Estrutura

| Caminho | Papel |
|---|---|
| `src/data/sources.js` | As 20 fontes (com RSS quando existe) |
| `src/data/themes.js` | Taxonomia de temas + países |
| `public/data/articles.json` | Histórico de artigos (a task escreve aqui) |
| `scripts/collect.md` | Guião diário de recolha/classificação/email |
| `src/App.jsx`, `src/components/` | Frontend com filtros |
| `vercel.json` | Config de build/deploy no Vercel |

## Adaptar fontes / temas

- Nova fonte: adiciona uma linha em `src/data/sources.js`.
- Novo tema: adiciona um slug em `src/data/themes.js` (a UI e a recolha ficam logo alinhadas).
