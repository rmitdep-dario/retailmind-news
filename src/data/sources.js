// As 20 fontes acompanhadas. rss: URL do feed quando existe, senão null
// (nesse caso a task de recolha usa WebSearch com "site:" no domínio).
// Os feeds RSS devem ser confirmados no primeiro run — muitos sites PT têm
// /feed ou /rss mas nem sempre; a task valida e cai para WebSearch se falhar.

export const SOURCES = [
  // Imprensa retalho / grande consumo
  { nome: 'Hipersuper', site: 'https://www.hipersuper.pt', rss: 'https://www.hipersuper.pt/feed/' },
  { nome: 'Distribuição Hoje', site: 'https://www.distribuicaohoje.com', rss: 'https://www.distribuicaohoje.com/feed/' },
  { nome: 'Grande Consumo', site: 'https://grandeconsumo.com', rss: 'https://grandeconsumo.com/feed/' },
  // Imprensa imobiliário
  { nome: 'Vida Imobiliária', site: 'https://www.vidaimobiliaria.com', rss: null },
  { nome: 'Property Magazine', site: 'https://www.propertymagazine.pt', rss: 'https://www.propertymagazine.pt/feed/' },
  { nome: 'Público Imobiliário', site: 'https://www.publico.pt/imobiliario', rss: null },
  { nome: 'Magazine Imobiliário', site: 'https://www.magazineimobiliario.com', rss: 'https://www.magazineimobiliario.com/feed/' },
  // Imprensa económica
  { nome: 'Jornal de Negócios', site: 'https://www.jornaldenegocios.pt', rss: 'https://www.jornaldenegocios.pt/rss' },
  { nome: 'ECO', site: 'https://eco.sapo.pt', rss: 'https://eco.sapo.pt/feed/' },
  { nome: 'Jornal Económico', site: 'https://jornaleconomico.sapo.pt', rss: 'https://jornaleconomico.sapo.pt/feed' },
  { nome: 'Construir', site: 'https://www.construir.pt', rss: 'https://www.construir.pt/feed/' },
  { nome: 'Marketeer', site: 'https://marketeer.sapo.pt', rss: 'https://marketeer.sapo.pt/feed' },
  { nome: 'Meios & Publicidade', site: 'https://www.meiosepublicidade.pt', rss: 'https://www.meiosepublicidade.pt/feed/' },
  // Associações e consultoras (normalmente sem RSS -> WebSearch/newsroom)
  { nome: 'APCC', site: 'https://www.apcc.pt', rss: null },
  { nome: 'Sonae Sierra', site: 'https://www.sonaesierra.com', rss: null },
  { nome: 'CBRE', site: 'https://www.cbre.pt', rss: null },
  { nome: 'JLL', site: 'https://www.jll.pt', rss: null },
  { nome: 'Cushman & Wakefield', site: 'https://www.cushmanwakefield.com/pt-pt', rss: null },
  { nome: 'Savills', site: 'https://www.savills.pt', rss: null },
  { nome: 'APPII', site: 'https://www.appii.pt', rss: null },
]
