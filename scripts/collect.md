# Procedimento diário de recolha — Radar de Notícias Retail Mind

Este ficheiro é o guião que o Claude Code executa todos os dias às 07:00 (via task agendada).
Segue estes passos por ordem.

## Objetivo

Recolher notícias das últimas 24h relevantes para retalho e imobiliário comercial em
Portugal (e Espanha/internacional quando relevante para o mercado português), classificá-las
por país e tema, acrescentá-las a `public/data/articles.json` sem duplicar, e enviar um
email-resumo.

## Passo 1 — Recolher

As fontes estão em `src/data/sources.js`, organizadas por `categoria`. Estratégia em 3 níveis
(para manter a recolha rápida com ~65 fontes):

1. **Feeds RSS** (fontes com `rss` preenchido): usa WebFetch no URL do feed e extrai os
   itens das últimas 24h. São a via principal — cobre a imprensa mais ativa.
2. **Media sem RSS** (categorias de imprensa com `rss: null`): WebSearch com o domínio,
   por exemplo: `site:construir.pt (retail OR imobiliário OR investimento) 2026` limitado
   a resultados recentes.
3. **Empresas, promotores, consultoras e associações** (categorias "Consultoras",
   "Promotores & investidores", "Associações", construtoras): NÃO pesquises uma a uma.
   Faz 3-4 pesquisas AGREGADAS por tópico que naturalmente apanham estas entidades, ex.:
   - `Portugal centro comercial OR "retail park" abertura OR investimento OR expansão [mês/ano]`
   - `Portugal imobiliário comercial fundo OR aquisição OR portefólio [mês/ano]`
   - `(Sonae Sierra OR Klépierre OR Mundicenter OR Nhood OR Merlin OR Castellana) Portugal [ano]`
   Estas entidades aparecem sobretudo COMO PROTAGONISTAS de notícias na imprensa — o que
   interessa é apanhar o facto, seja qual for o site onde saiu. Se o artigo sair num site
   que não é fonte oficial, usa como `fonte` o nome da fonte da lista mais próxima do tema
   (ex. notícia do Idealista sobre a Merlin → procura se saiu também numa fonte da lista;
   se não, usa o nome da publicação real e mantém o URL verdadeiro).

Foca-te em artigos que encaixem nos temas de `src/data/themes.js`. O critério de fundo é:
**tem potencial de negócio para a Retail Mind?** — uma marca a comprar outra marca, uma
abertura de loja, uma marca à procura de espaço ou de franchisados, um fundo a comprar
ativos, um promotor com projeto novo. Na dúvida entre incluir ou não um facto concreto
destes, INCLUI. Ignora opinião genérica, publirreportagem e conteúdo sem facto novo
(abertura, fecho, transação, licenciamento, nomeação, resultados, investimento).

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

## Passo 5 — Email-resumo (automático, NÃO é o agente que envia)

O agente **não** envia email. O envio é feito automaticamente por uma GitHub Action
(`.github/workflows/email.yml`) que dispara sempre que o push altera `articles.json`:

- corre `scripts/send-email.mjs`, que deteta os artigos NOVOS do último commit,
  agrupa-os por categoria e envia via Resend;
- a chave está no secret `RESEND_API_KEY` do repositório;
- remetente/destinatários vêm das *variables* `MAIL_FROM`, `MAIL_TO`, `SITE_URL`.

Ou seja: basta o agente fazer o push (Passo 4). O email sai sozinho a seguir.

Se não houver novidades no dia, envia à mesma um email curto a dizer "Sem novidades relevantes hoje".