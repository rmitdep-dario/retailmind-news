# Procedimento diário de recolha — Radar de Notícias Retail Mind

Este ficheiro é o guião que o Claude Code executa todos os dias às 07:00 (via task agendada).
Segue estes passos por ordem.

## Objetivo

Recolher notícias das últimas 24h relevantes para retalho e imobiliário comercial em
Portugal (e Espanha/internacional quando relevante para o mercado português), classificá-las
por país e tema, acrescentá-las a `public/data/articles.json` sem duplicar, e enviar um
email-resumo.

## Passo 1 — Recolher

Para cada fonte em `src/data/sources.js`:

- Se tiver `rss`, usa WebFetch no URL do feed e extrai os itens das últimas 24h.
- Se `rss` for `null` (ou o feed falhar), usa WebSearch com o domínio, por exemplo:
  `site:cbre.pt (nova loja OR retail park OR investimento OR aquisição) after:AAAA-MM-DD`
  usando a data de ontem.

Foca-te em artigos que encaixem nos temas de `src/data/themes.js`. Ignora opinião genérica,
publirreportagem e conteúdo sem facto novo (abertura, fecho, transação, licenciamento,
nomeação, resultados, investimento).

## Passo 2 — Classificar

Para cada artigo relevante, cria um objeto:

```json
{
  "id": "AAAA-MM-DD-slug-curto",
  "titulo": "…",
  "resumo": "1–2 frases, factual, em português",
  "url": "https://…",
  "fonte": "Nome exato como em sources.js",
  "pais": "Portugal | Espanha | Internacional",
  "temas": ["slug1", "slug2"],
  "data": "AAAA-MM-DD"
}
```

Regras de classificação:
- `temas` usa **apenas** os slugs definidos em `src/data/themes.js` (podem ser vários).
- `pais`: "Portugal" se o facto ocorre/afeta PT; "Espanha" se for só ES; "Internacional"
  para operações multi-país ou globais relevantes para o mercado.
- `id`: data + slug curto derivado do título (sem acentos, minúsculas, hífens).

## Passo 3 — Dedupe + acrescentar

1. Lê `public/data/articles.json`.
2. Descarta qualquer artigo cujo `id` **ou** `url` já exista no ficheiro.
3. Junta os novos ao início da lista `articles`.
4. Atualiza `updatedAt` para o timestamp ISO atual.
5. (Opcional) mantém no máximo os últimos ~500 artigos para o ficheiro não crescer sem limite.
6. Escreve o ficheiro.

## Passo 4 — Commit + deploy

```bash
git add public/data/articles.json
git commit -m "Radar: recolha AAAA-MM-DD (N novos artigos)"
git push
```

O push dispara automaticamente um novo deploy no Vercel, que reconstrói e publica a página.

## Passo 5 — Email-resumo

Envia um email para a equipa com os destaques do dia. Usa a API do Resend
(a chave está no secret `RESEND_API_KEY`). Corpo sugerido:

- Assunto: `Radar Retail Mind — AAAA-MM-DD (N novidades)`
- Agrupar os novos artigos por categoria (Retalho, Imobiliário, Investimento, Corporate).
- Por artigo: título com link, fonte, país, 1 linha de resumo.
- Terminar com link para a página filtrável.

Exemplo de chamada (a partir de um pequeno script Node ou curl):

```bash
curl -s https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Radar Retail Mind <radar@teu-dominio.pt>",
    "to": ["rmitdep@gmail.com"],
    "subject": "Radar Retail Mind — AAAA-MM-DD",
    "html": "<html-do-resumo>"
  }'
```

Se não houver novidades no dia, envia à mesma um email curto a dizer "Sem novidades relevantes hoje".
