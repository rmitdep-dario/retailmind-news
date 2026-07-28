# Radar de Notícias — Retail Mind Group

Ferramenta interna que recolhe diariamente notícias de retalho e imobiliário comercial de
~20 fontes portuguesas, classifica-as por **país** e **tema**, guarda-as num histórico
versionado e mostra-as numa página web filtrável. Envia também um email-resumo diário às 07:00.

## Como funciona

```
GitHub Action diária 07:00 (.github/workflows/collect.yml)
  → scripts/collect-rss.mjs lê os feeds RSS das fontes
  → classifica por país + tema por regras (contexto + gatilho), dedupe
  → escreve public/data/articles.json → commit + push
  → Vercel reconstrói e publica a página
  → envia email-resumo (Gmail SMTP, ou Resend)
```

**Custo: zero.** Corre no plano gratuito do GitHub Actions e usa apenas feeds
RSS públicos — não há nenhuma API paga no circuito.

### Como funciona a classificação

Um artigo só é aceite se tiver **dois sinais**: um termo de **contexto**
(retalho / imobiliário comercial) e um **gatilho** de tema (`abriu`, `adquiriu`,
`expansão`…). A comparação é por palavra inteira — sem isso `reabre` casaria com
`abre` e `encerrado` com `encerra`. Em fontes generalistas (ECO, Negócios…) o
gatilho tem ainda de estar no **título**; nas especialistas (Distribuição Hoje,
Grande Consumo…) o contexto é implícito.

As regras vivem no topo de `scripts/collect-rss.mjs` (`CONTEXTO`, `GATILHOS`,
`EXCLUIR`) — é aí que se afina o que entra e o que fica de fora.

### Alternativa paga (opcional)

`scripts/collect.mjs` faz o mesmo com a API da Claude e **pesquisa web**: cobre
as 68 fontes (incluindo as sem RSS, como a Hipersuper e o Construir) e julga a
relevância com muito mais critério. Custa ~20 €/mês e exige o secret
`ANTHROPIC_API_KEY`. Para a usar, troca o passo "Recolher notícias" no workflow.

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

2. **Secrets e variables do repositório**

   Secrets (Settings → Secrets and variables → Actions → *Secrets*):

   | Nome | Para quê |
   |---|---|
   | `GMAIL_APP_PASSWORD` | Envio de email via Gmail |
   | `RESEND_API_KEY` | Alternativa ao Gmail |
   | `ANTHROPIC_API_KEY` | Só para a alternativa paga (ver acima) |

   Variables (mesma página, separador *Variables*):

   | Nome | Exemplo |
   |---|---|
   | `MAIL_TO` | `dario.rodrigues@retailmind.com` |
   | `GMAIL_USER` | `rmitdep@gmail.com` |
   | `MAIL_FROM` | `Radar <radar@dominio.pt>` (só com domínio verificado) |
   | `SITE_URL` | `https://retailmind-news.vercel.app` |

3. **Recolha diária** — já agendada em `.github/workflows/collect.yml` (07:00).
   Para testar sem esperar: Actions → *Recolha diária de notícias* → Run workflow.

## Estrutura

| Caminho | Papel |
|---|---|
| `src/data/sources.js` | As 68 fontes monitorizadas, por categoria |
| `src/data/themes.js` | Taxonomia de temas + países |
| `public/data/articles.json` | Histórico de artigos (a recolha escreve aqui) |
| `scripts/collect-rss.mjs` | **Recolha diária (RSS + regras, sem custos)** |
| `scripts/collect.mjs` | Alternativa paga (API da Claude + pesquisa web) |
| `scripts/collect.md` | Critérios de relevância e classificação (referência) |
| `scripts/send-email.mjs` | Geração e envio do email-resumo |
| `.github/workflows/collect.yml` | Agendamento diário + commit + email |
| `src/App.jsx`, `src/components/` | Frontend com filtros |
| `vercel.json` | Config de build/deploy no Vercel |

## Adaptar fontes / temas

- Nova fonte: adiciona uma linha em `src/data/sources.js`.
- Novo tema: adiciona um slug em `src/data/themes.js` (a UI e a recolha ficam logo alinhadas).
