// Recolha diária automática: pede à Claude (com pesquisa web) para procurar
// notícias reais nas fontes monitorizadas, classificá-las e devolvê-las em JSON.
// Corre na GitHub Action (.github/workflows/collect.yml), que tem permissão de
// escrita no repositório — por isso o commit/push acontece lá, não aqui.
//
// Variáveis de ambiente:
//   ANTHROPIC_API_KEY (secret)   — obrigatória
//   DRY (=1)                     — não escreve o ficheiro, só imprime o resultado

import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { SOURCES } from '../src/data/sources.js'
import { ALL_THEME_SLUGS, CATEGORIES, PAISES } from '../src/data/themes.js'

const ARTICLES_PATH = 'public/data/articles.json'
const MODEL = 'claude-opus-4-8'

const client = new Anthropic() // lê ANTHROPIC_API_KEY do ambiente

const hoje = new Date()
const iso = (d) => d.toISOString().slice(0, 10)
const diasAtras = (n) => iso(new Date(hoje.getTime() - n * 86400000))

const existente = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))
const idsExistentes = new Set(existente.articles.map((a) => a.id))
const urlsExistentes = new Set(existente.articles.map((a) => a.url))

// contexto para o modelo: que fontes seguir e que temas existem
const listaFontes = SOURCES.map((s) => `- ${s.nome}${s.site ? ` (${s.site})` : ''} [${s.categoria}]`).join('\n')
const listaTemas = CATEGORIES.map(
  (c) => `${c.label}:\n${c.themes.map((t) => `  - ${t.slug} = ${t.label}`).join('\n')}`
).join('\n')

// títulos recentes para o modelo evitar repetir o que já temos
const jaTemos = existente.articles.slice(0, 60).map((a) => `- ${a.titulo}`).join('\n')

const PROMPT = `És o analista de research da Retail Mind, uma empresa portuguesa de retail real estate
(desenvolve retail parks, faz expansão de marcas e comercialização de espaços comerciais).

TAREFA: procurar na web notícias PUBLICADAS ENTRE ${diasAtras(3)} E ${iso(hoje)} sobre retalho e
imobiliário comercial em Portugal, e devolvê-las classificadas.

CRITÉRIO DE RELEVÂNCIA — a pergunta a fazer a cada notícia é:
"isto tem potencial de negócio para a Retail Mind?"
SIM: uma marca compra outra marca · abre uma nova loja · uma marca em expansão ou à procura de espaço
ou de franchisados · um centro comercial com novas entradas · retail park novo ou em desenvolvimento ·
licenciamento de projeto · compra/venda de ativo imobiliário · fundo compra portefólio · M&A entre
operadores · investimento estrangeiro · mudança de CEO/direção · resultados de operadores · logística
e escritórios relevantes.
NÃO: opinião, publirreportagem, marketing de produto, política, desporto, ou qualquer conteúdo sem
facto novo de negócio.
Na dúvida entre incluir ou não um FACTO CONCRETO destes, INCLUI.

FONTES A PRIVILEGIAR (mas aceita a notícia venha de onde vier, desde que o facto seja real):
${listaFontes}

TEMAS PERMITIDOS (usa exclusivamente estes slugs):
${listaTemas}

PAÍSES PERMITIDOS: ${PAISES.join(' | ')}
("Portugal" se o facto ocorre/afeta PT; "Espanha" se for só ES; "Internacional" para operações
multi-país ou globais relevantes para o mercado português.)

JÁ TEMOS ESTAS NOTÍCIAS — não as repitas nem devolvas variações delas:
${jaTemos}

MÉTODO:
1. Faz várias pesquisas web dirigidas (aberturas de lojas, retail parks, investimento imobiliário
   comercial, expansão de marcas, transações de ativos, franchising) restritas aos últimos dias.
2. Confirma que cada notícia é real e recente. NUNCA inventes títulos, factos ou URLs.
3. Se não encontrares nada de relevante, devolve uma lista vazia — isso é uma resposta válida.

RESPOSTA: devolve APENAS um bloco de código JSON, sem texto antes ou depois, no formato:
\`\`\`json
{"articles":[
  {
    "id": "AAAA-MM-DD-slug-curto-do-titulo",
    "titulo": "Título factual da notícia",
    "resumo": "1-2 frases factuais em português com os números/nomes concretos.",
    "url": "https://url-real-da-noticia",
    "fonte": "Nome da publicação",
    "pais": "Portugal",
    "temas": ["nova-loja"],
    "data": "AAAA-MM-DD"
  }
]}
\`\`\`
O \`id\` é a data seguida de um slug curto do título (minúsculas, sem acentos, com hífens).
O \`data\` é a data de publicação da notícia, não a de hoje.`

async function pedirRecolha() {
  const messages = [{ role: 'user', content: PROMPT }]

  // O web search corre do lado do servidor; se a volta atingir o limite de
  // iterações devolve stop_reason "pause_turn" e retomamos reenviando o turno.
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 20 }],
      messages,
    })

    if (response.stop_reason === 'refusal') {
      throw new Error(`Pedido recusado: ${response.stop_details?.explanation ?? 'sem detalhe'}`)
    }

    if (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content })
      continue
    }

    return response
  }
  throw new Error('Excedidas as retomas de pause_turn sem resposta final.')
}

// extrai o JSON do último bloco de texto, tolerando cercas markdown
export function extrairArtigos(response) {
  const texto = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()

  const cerca = texto.match(/```(?:json)?\s*([\s\S]*?)```/)
  const bruto = cerca ? cerca[1] : texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)

  let dados
  try {
    dados = JSON.parse(bruto)
  } catch (e) {
    console.error('--- resposta do modelo ---\n' + texto.slice(0, 2000))
    throw new Error(`Não consegui interpretar o JSON devolvido: ${e.message}`)
  }
  return Array.isArray(dados.articles) ? dados.articles : []
}

// descarta o que já existe ou vem malformado
export function validar(artigos) {
  const vistos = new Set()
  return artigos.filter((a) => {
    if (!a || !a.id || !a.titulo || !a.url || !a.fonte || !a.data) return false
    if (!/^https?:\/\//.test(a.url)) return false
    if (!PAISES.includes(a.pais)) return false
    if (idsExistentes.has(a.id) || urlsExistentes.has(a.url)) return false
    if (vistos.has(a.id) || vistos.has(a.url)) return false
    vistos.add(a.id)
    vistos.add(a.url)
    a.temas = (a.temas || []).filter((t) => ALL_THEME_SLUGS.includes(t))
    if (a.temas.length === 0) return false
    a.resumo = a.resumo || a.titulo
    return true
  })
}

async function main() {
  const response = await pedirRecolha()
  const novos = validar(extrairArtigos(response))

  console.log(`Recolha ${iso(hoje)}: ${novos.length} artigos novos.`)
  for (const a of novos) console.log(`  • [${a.fonte}] ${a.titulo}`)

  const u = response.usage
  console.log(`Tokens — entrada: ${u.input_tokens}, saída: ${u.output_tokens}`)

  if (novos.length === 0) {
    console.log('Sem novidades relevantes — nada a escrever.')
    return
  }
  if (process.env.DRY === '1') {
    console.log('DRY-RUN — ficheiro não alterado.')
    return
  }

  existente.articles = [...novos, ...existente.articles].slice(0, 500)
  existente.updatedAt = new Date().toISOString()
  writeFileSync(ARTICLES_PATH, JSON.stringify(existente, null, 2) + '\n')
  console.log(`Escrito ${ARTICLES_PATH} (${existente.articles.length} artigos no total).`)
}

// só corre a recolha quando o ficheiro é executado diretamente,
// para que as funções acima possam ser testadas isoladamente
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
