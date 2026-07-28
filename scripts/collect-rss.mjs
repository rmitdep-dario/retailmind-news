// Recolha diária SEM CUSTOS: lê os feeds RSS das fontes e classifica por regras.
// Não usa nenhuma API paga — só os feeds públicos das publicações.
//
// A classificação exige DOIS sinais para aceitar um artigo:
//   1. um termo de CONTEXTO (retalho / imobiliário comercial), e
//   2. pelo menos um GATILHO de tema (abriu, adquiriu, expansão, ...).
// Exigir os dois é o que separa "a Mercadona abre loja em Braga" de
// "o Governo abre concurso para professores".
//
// Uso:
//   node scripts/collect-rss.mjs          escreve public/data/articles.json
//   DRY=1 node scripts/collect-rss.mjs    só mostra o que encontraria

import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { XMLParser } from 'fast-xml-parser'
import { SOURCES } from '../src/data/sources.js'

const ARTICLES_PATH = 'public/data/articles.json'
const DIAS = 4 // janela de recolha

// ── Regras de classificação ─────────────────────────────────────────
// Contexto: o artigo tem de falar do nosso mundo (retalho / imobiliário).
const CONTEXTO = [
  'loja', 'lojas', 'retalho', 'retail', 'centro comercial', 'centros comerciais',
  'shopping', 'retail park', 'imobiliário', 'imobiliária', 'insígnia', 'insígnias',
  'supermercado', 'supermercados', 'hipermercado', 'cadeia', 'espaço comercial',
  'superfície comercial', 'franchising', 'franchisado', 'franchisados', 'franquia',
  'logística', 'logístico', 'armazém', 'escritório', 'escritórios', 'portefólio',
  'arrendamento', 'comércio', 'marca', 'marcas', 'operador', 'operadores',
  'promotor', 'metros quadrados', 'outlet', 'restauração', 'distribuição',
  'unidade', 'unidades', 'espaço', 'ativos',
]

// Gatilhos: o facto concreto. Cada um mapeia para um tema da taxonomia.
const GATILHOS = [
  { tema: 'nova-loja', termos: ['abre', 'abriu', 'abertura', 'inaugura', 'inaugurou', 'nova loja', 'novas lojas', 'primeira loja', 'estreia'] },
  { tema: 'loja-encerrada', termos: ['fecha portas', 'fechou portas', 'encerra a loja', 'encerrou a loja', 'encerra lojas', 'encerramento de lojas', 'encerra as portas'] },
  { tema: 'marca-expansao', termos: ['expansão', 'expande', 'reforça a presença', 'reforça presença', 'plano de crescimento', 'novas aberturas', 'cresce em portugal'] },
  { tema: 'franchising', termos: ['franchising', 'franchisado', 'franquia', 'franchisados'] },
  { tema: 'marca-internacional-pt', termos: ['chega a portugal', 'entra em portugal', 'estreia em portugal', 'desembarca em portugal', 'aterra em portugal'] },
  { tema: 'cc-novas-entradas', termos: ['novas entradas', 'novos inquilinos', 'nova âncora'] },
  { tema: 'novos-cc', termos: ['novo centro comercial', 'novo shopping'] },
  { tema: 'retail-parks', termos: ['retail park', 'retail parks'] },
  { tema: 'logistica', termos: ['logística', 'logístico', 'armazém', 'plataforma logística', 'centro de distribuição'] },
  { tema: 'escritorios', termos: ['escritório', 'escritórios'] },
  { tema: 'licenciamento', termos: ['licenciamento', 'licença de construção', 'pip aprovado', 'aprovado o projeto'] },
  { tema: 'concursos', termos: ['concurso público', 'lançou o concurso'] },
  { tema: 'promotores', termos: ['promotor imobiliário', 'promove o projeto'] },
  { tema: 'compra-venda-ativo', termos: ['compra o', 'comprou o', 'vende o', 'vendeu o', 'transação', 'transacção', 'alienação', 'venda de'] },
  { tema: 'fundo-portefolio', termos: ['portefólio de ativos', 'portefólio imobiliário', 'compra o portefólio', 'venda do portefólio', 'aquisição do portefólio'] },
  { tema: 'fundos', termos: ['fundo de investimento', 'fundo imobiliário'] },
  { tema: 'reits', termos: ['reit', 'sigi', 'socimi'] },
  { tema: 'private-equity', termos: ['private equity', 'capital de risco'] },
  { tema: 'investidores', termos: ['investimento', 'investe', 'investiu', 'investidor', 'investidores'] },
  { tema: 'investimento-estrangeiro', termos: ['investimento estrangeiro', 'capital estrangeiro', 'investidor internacional'] },
  { tema: 'ma-operadores', termos: ['fusão', 'fusões', 'm&a'] },
  { tema: 'aquisicoes', termos: ['adquire', 'adquiriu', 'aquisição', 'aquisições', 'compra a'] },
  { tema: 'ceo-direcao', termos: ['novo ceo', 'nomeado', 'nomeação', 'assume a liderança', 'novo diretor', 'nova direção', 'comissão executiva', 'administrador'] },
  { tema: 'resultados', termos: ['resultados', 'lucro', 'lucros', 'faturação', 'volume de negócios', 'receitas', 'vendas cresceram', 'prejuízo'] },
]

// Ruído recorrente que passa nos gatilhos mas não é negócio.
const EXCLUIR = [
  // formatos editoriais sem facto novo
  'horóscopo', 'passatempo', 'sorteio', 'opinião', 'crónica', 'podcast',
  'entrevista', 'coisas que vão marcar', 'under 30', 'os nomeados',
  'newsletter', 'antevisão', 'em direto', 'ao minuto', 'lançamento do livro',
  // fora de âmbito
  'futebol', 'benfica', 'sporting', 'eleições', 'covid', 'exames nacionais',
  'meteorologia', 'incêndio', 'navio', 'cruzeiro', 'empilhador', 'receita de',
  'prr', 'orçamento do estado',
]

// Categorias de fontes que são elas próprias do nosso setor: aí o contexto
// é implícito (tudo o que a Distribuição Hoje publica é retalho), por isso
// basta o gatilho. Nas generalistas exigimos contexto E gatilho no título.
const CATEGORIAS_ESPECIALISTAS = new Set([
  'Retalho & consumo',
  'Imobiliário (media)',
  'Franchising & empreendedorismo',
])

const MARCAS_PT = [
  'portugal', 'português', 'portuguesa', 'portugueses', 'nacional',
  'lisboa', 'porto', 'braga', 'algarve', 'coimbra', 'aveiro', 'faro', 'beja',
  'évora', 'madeira', 'açores', 'cascais', 'sintra', 'matosinhos', 'gaia',
  'guimarães', 'leiria', 'viseu', 'setúbal', 'santarém', 'funchal', 'covilhã',
  'alentejo', 'ribatejo', 'minho', 'algarvio',
]
const MARCAS_ES = ['espanha', 'madrid', 'barcelona', 'espanhol', 'espanhola', 'valência', 'sevilha']
// Se o artigo fala explicitamente de outro país, é internacional.
const MARCAS_INT = [
  'méxico', 'brasil', 'estados unidos', 'eua', 'alemanha', 'frança', 'reino unido',
  'china', 'índia', 'japão', 'itália', 'holanda', 'países baixos', 'bélgica',
  'polónia', 'costa rica', 'colômbia', 'chile', 'argentina', 'angola', 'moçambique',
  'suíça', 'áustria', 'dinamarca', 'suécia', 'noruega', 'turquia', 'marrocos',
]

// ── Utilitários ─────────────────────────────────────────────────────
const ENTIDADES = {
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
  rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  hellip: '…', ndash: '–', mdash: '—', euro: '€',
}

const limparHtml = (s = '') =>
  String(s)
    .replace(/<[^>]*>/g, ' ')
    // entidades numéricas (&#038; &#8220; …) — decimais e hexadecimais
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, nome) => ENTIDADES[nome.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()

const semAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const norm = (s) => semAcentos(String(s).toLowerCase())
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Correspondência por PALAVRA INTEIRA — sem isto "reabre" casa com "abre"
// e "encerrado" (exercício) casa com "encerra" (loja).
// Trabalhamos sobre texto sem acentos para que \b funcione em português.
const compilar = (termos) => termos.map((t) => new RegExp(`\\b${escapar(norm(t))}\\b`))
const casa = (texto, regexes) => regexes.some((re) => re.test(texto))

function slug(titulo) {
  return semAcentos(titulo.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 7)
    .join('-')
}

// regexes compiladas uma vez
const RE_CONTEXTO = compilar(CONTEXTO)
const RE_EXCLUIR = compilar(EXCLUIR)
const RE_GATILHOS = GATILHOS.map((g) => ({ tema: g.tema, res: compilar(g.termos) }))

export function classificar(titulo, resumo, especialista) {
  const tit = norm(titulo)
  const tudo = norm(`${titulo} ${resumo}`)

  if (casa(tudo, RE_EXCLUIR)) return null

  // Numa fonte generalista o facto tem de estar no TÍTULO — é isso que
  // separa uma notícia de negócio de uma menção de passagem no corpo.
  const alvo = especialista ? tudo : tit
  const temas = RE_GATILHOS.filter((g) => casa(alvo, g.res)).map((g) => g.tema)
  if (temas.length === 0) return null

  // O contexto (retalho/imobiliário) pode vir do corpo, mas tem de existir.
  if (!especialista && !casa(tudo, RE_CONTEXTO)) return null

  return [...new Set(temas)].slice(0, 4)
}

const RE_PT = compilar(MARCAS_PT)
const RE_ES = compilar(MARCAS_ES)
const RE_INT = compilar(MARCAS_INT)

// As fontes são publicações portuguesas a escrever para leitores portugueses:
// sem menção explícita de outro país, o default correto é Portugal.
export function detetarPais(titulo, resumo) {
  const t = norm(`${titulo} ${resumo}`)
  if (casa(t, RE_PT)) return 'Portugal'
  if (casa(t, RE_ES)) return 'Espanha'
  if (casa(t, RE_INT)) return 'Internacional'
  return 'Portugal'
}

// ── Leitura dos feeds ───────────────────────────────────────────────
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

async function lerFeed(fonte) {
  try {
    const res = await fetch(fonte.rss, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RadarRetailMind/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return { fonte: fonte.nome, erro: `HTTP ${res.status}`, itens: [] }

    const xml = parser.parse(await res.text())
    // RSS 2.0 (rss.channel.item) ou Atom (feed.entry)
    const cru = xml?.rss?.channel?.item ?? xml?.feed?.entry ?? []
    const lista = Array.isArray(cru) ? cru : [cru]

    const itens = lista.map((i) => ({
      titulo: limparHtml(i.title?.['#text'] ?? i.title),
      url: typeof i.link === 'string' ? i.link : (i.link?.['@_href'] ?? i.link?.['#text'] ?? ''),
      resumo: limparHtml(i.description ?? i.summary ?? i['content:encoded'] ?? ''),
      data: i.pubDate ?? i.published ?? i.updated ?? null,
    }))
    return {
      fonte: fonte.nome,
      especialista: CATEGORIAS_ESPECIALISTAS.has(fonte.categoria),
      erro: null,
      itens,
    }
  } catch (e) {
    return { fonte: fonte.nome, especialista: false, erro: e.message, itens: [] }
  }
}

// assinatura para apanhar a mesma notícia publicada em fontes diferentes
const assinatura = (titulo) =>
  semAcentos(titulo.toLowerCase())
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((p) => p.length > 3)
    .slice(0, 5)
    .sort()
    .join('-')

export function construirArtigos(resultados, { corte, idsExistentes, urlsExistentes }) {
  const novos = []
  const vistos = new Set()

  for (const { fonte, especialista, itens } of resultados) {
    for (const item of itens) {
      if (!item.titulo || !item.url || !/^https?:\/\//.test(item.url)) continue

      const data = item.data ? new Date(item.data) : null
      if (!data || isNaN(data) || data < corte) continue

      const temas = classificar(item.titulo, item.resumo, especialista)
      if (!temas) continue

      const dataIso = data.toISOString().slice(0, 10)
      const id = `${dataIso}-${slug(item.titulo)}`
      const assin = assinatura(item.titulo)
      if (idsExistentes.has(id) || urlsExistentes.has(item.url)) continue
      if (vistos.has(id) || vistos.has(item.url) || vistos.has(assin)) continue
      vistos.add(id)
      vistos.add(item.url)
      vistos.add(assin)

      const resumo = item.resumo.length > 320 ? item.resumo.slice(0, 317) + '…' : item.resumo

      novos.push({
        id,
        titulo: item.titulo,
        resumo: resumo || item.titulo,
        url: item.url,
        fonte,
        pais: detetarPais(item.titulo, item.resumo),
        temas,
        data: dataIso,
      })
    }
  }
  return novos.sort((a, b) => b.data.localeCompare(a.data))
}

async function main() {
  const comRss = SOURCES.filter((s) => s.rss)
  console.log(`A ler ${comRss.length} feeds RSS…`)

  const resultados = await Promise.all(comRss.map(lerFeed))
  for (const r of resultados) {
    console.log(`  ${r.erro ? '✗' : '✓'} ${r.fonte}: ${r.erro ?? `${r.itens.length} itens`}`)
  }

  const existente = JSON.parse(readFileSync(ARTICLES_PATH, 'utf8'))
  const corte = new Date(Date.now() - DIAS * 86400000)

  const novos = construirArtigos(resultados, {
    corte,
    idsExistentes: new Set(existente.articles.map((a) => a.id)),
    urlsExistentes: new Set(existente.articles.map((a) => a.url)),
  })

  console.log(`\n${novos.length} artigos novos e relevantes:`)
  for (const a of novos) console.log(`  • [${a.fonte}] ${a.titulo}  {${a.temas.join(', ')}}`)

  if (novos.length === 0 || process.env.DRY === '1') {
    if (process.env.DRY === '1') console.log('\nDRY-RUN — ficheiro não alterado.')
    return
  }

  existente.articles = [...novos, ...existente.articles].slice(0, 500)
  existente.updatedAt = new Date().toISOString()
  writeFileSync(ARTICLES_PATH, JSON.stringify(existente, null, 2) + '\n')
  console.log(`\nEscrito ${ARTICLES_PATH} (${existente.articles.length} no total).`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
