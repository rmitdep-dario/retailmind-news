// Taxonomia de temas consolidada. Cada artigo pode ter vários temas (slugs).
// Os slugs são a chave estável usada em articles.json; o label é o que aparece na UI.

export const CATEGORIES = [
  {
    id: 'retalho',
    label: 'Retalho — operação de lojas',
    themes: [
      { slug: 'nova-loja', label: 'Nova loja aberta' },
      { slug: 'loja-encerrada', label: 'Loja encerrada' },
      { slug: 'marca-expansao', label: 'Marca em expansão' },
      { slug: 'franchising', label: 'Marca procura franchisados' },
      { slug: 'marca-internacional-pt', label: 'Entrada de marca internacional em PT' },
      { slug: 'cc-novas-entradas', label: 'Centro comercial: novas entradas' },
    ],
  },
  {
    id: 'imobiliario',
    label: 'Imobiliário / desenvolvimento',
    themes: [
      { slug: 'novos-cc', label: 'Novos centros comerciais' },
      { slug: 'retail-parks', label: 'Retail parks' },
      { slug: 'logistica', label: 'Logística' },
      { slug: 'escritorios', label: 'Escritórios' },
      { slug: 'licenciamento', label: 'Licenciamento' },
      { slug: 'concursos', label: 'Concursos' },
      { slug: 'promotores', label: 'Promotores' },
    ],
  },
  {
    id: 'investimento',
    label: 'Investimento & transações',
    themes: [
      { slug: 'compra-venda-ativo', label: 'Compra/venda de ativo imobiliário' },
      { slug: 'fundo-portefolio', label: 'Fundo compra portefólio' },
      { slug: 'fundos', label: 'Fundos de investimento' },
      { slug: 'reits', label: 'REITs' },
      { slug: 'private-equity', label: 'Private Equity' },
      { slug: 'investidores', label: 'Investidores' },
      { slug: 'investimento-estrangeiro', label: 'Investimento estrangeiro/internacional' },
    ],
  },
  {
    id: 'corporate',
    label: 'Corporate',
    themes: [
      { slug: 'ma-operadores', label: 'M&A entre operadores' },
      { slug: 'aquisicoes', label: 'Aquisições empresariais' },
      { slug: 'ceo-direcao', label: 'Mudança de CEO/Direção' },
      { slug: 'resultados', label: 'Resultados financeiros de operadores' },
    ],
  },
]

export const PAISES = ['Portugal', 'Espanha', 'Internacional']

// Mapa slug -> label, para render rápido nos cartões.
export const THEME_LABELS = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.themes.map((t) => [t.slug, t.label]))
)

export const ALL_THEME_SLUGS = CATEGORIES.flatMap((c) => c.themes.map((t) => t.slug))
