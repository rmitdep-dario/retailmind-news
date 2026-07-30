// Fontes monitorizadas pelo Radar. rss: URL de feed VALIDADO (2026-07-24), senão null
// (a recolha usa WebSearch com "site:" no domínio; se site for null, pesquisa pelo nome).
// Nota: Property Magazine offline à data da validação; APF, Negócios & Franchising,
// Business.IT e PIR sem domínio confirmado — entram por pesquisa de nome.
//
// `pais` e `idioma` são opcionais e, quando omitidos, assumem Portugal/pt — o
// caso da grande maioria das fontes. Servem para a recolha saber que conjunto de
// regras aplicar (as regras de classificação são por idioma) e que país atribuir
// por defeito a um artigo cujo texto não mencione geografia nenhuma.

export const SOURCES = [
  // ── Retalho & grande consumo ──────────────────────────────
  { nome: 'Hipersuper', site: 'https://www.hipersuper.pt', rss: null, categoria: 'Retalho & consumo' },
  { nome: 'Distribuição Hoje', site: 'https://www.distribuicaohoje.com', rss: 'https://www.distribuicaohoje.com/feed/', categoria: 'Retalho & consumo' },
  { nome: 'Grande Consumo', site: 'https://grandeconsumo.com', rss: 'https://grandeconsumo.com/feed/', categoria: 'Retalho & consumo' },

  // ── Imprensa imobiliário ──────────────────────────────────
  { nome: 'Vida Imobiliária', site: 'https://www.vidaimobiliaria.com', rss: null, categoria: 'Imobiliário (media)' },
  { nome: 'Property Magazine', site: 'https://www.propertymagazine.pt', rss: null, categoria: 'Imobiliário (media)' },
  { nome: 'Público Imobiliário', site: 'https://www.publico.pt/imobiliario', rss: null, categoria: 'Imobiliário (media)' },
  { nome: 'Magazine Imobiliário', site: 'https://www.magazineimobiliario.com', rss: null, categoria: 'Imobiliário (media)' },
  { nome: 'Anteprojetos', site: 'https://www.anteprojectos.com.pt', rss: null, categoria: 'Imobiliário (media)' },

  // ── Imprensa económica & negócios ─────────────────────────
  { nome: 'Jornal de Negócios', site: 'https://www.jornaldenegocios.pt', rss: 'https://www.jornaldenegocios.pt/rss', categoria: 'Economia & negócios' },
  { nome: 'ECO', site: 'https://eco.sapo.pt', rss: 'https://eco.sapo.pt/feed/', categoria: 'Economia & negócios' },
  { nome: 'Jornal Económico', site: 'https://jornaleconomico.sapo.pt', rss: 'https://jornaleconomico.sapo.pt/feed', categoria: 'Economia & negócios' },
  { nome: 'Expresso Economia', site: 'https://expresso.pt/economia', rss: null, categoria: 'Economia & negócios' },
  { nome: 'Dinheiro Vivo', site: 'https://www.dinheirovivo.pt', rss: null, categoria: 'Economia & negócios' },
  { nome: 'Executive Digest', site: 'https://executivedigest.sapo.pt', rss: 'https://executivedigest.sapo.pt/feed/', categoria: 'Economia & negócios' },
  { nome: 'Forbes Portugal', site: 'https://www.forbespt.com', rss: 'https://www.forbespt.com/feed/', categoria: 'Economia & negócios' },
  { nome: 'Business.IT', site: null, rss: null, categoria: 'Economia & negócios' },
  { nome: 'Briefing', site: 'https://www.briefing.pt', rss: 'https://www.briefing.pt/feed/', categoria: 'Economia & negócios' },
  { nome: 'Marketeer', site: 'https://marketeer.sapo.pt', rss: 'https://marketeer.sapo.pt/feed', categoria: 'Economia & negócios' },
  { nome: 'Meios & Publicidade', site: 'https://www.meiosepublicidade.pt', rss: null, categoria: 'Economia & negócios' },

  // ── Construção & engenharia ───────────────────────────────
  { nome: 'Construir', site: 'https://www.construir.pt', rss: null, categoria: 'Construção' },
  { nome: 'Ingenium', site: 'https://www.ingenium.pt', rss: 'https://www.ingenium.pt/feed/', categoria: 'Construção' },
  { nome: 'DST', site: 'https://www.dstsgps.com', rss: null, categoria: 'Construção' },
  { nome: 'Grupo Casais', site: 'https://www.casais.pt', rss: null, categoria: 'Construção' },

  // ── Franchising & empreendedorismo ────────────────────────
  { nome: 'Negócios & Franchising', site: null, rss: null, categoria: 'Franchising & empreendedorismo' },
  { nome: 'Associação Portuguesa de Franchising', site: null, rss: null, categoria: 'Franchising & empreendedorismo' },
  { nome: 'Franchise Direct', site: 'https://www.franchisedirect.com', rss: null, categoria: 'Franchising & empreendedorismo' },
  { nome: 'Portal do Franchising', site: 'https://www.infofranchising.pt', rss: 'https://www.infofranchising.pt/feed/', categoria: 'Franchising & empreendedorismo' },
  { nome: 'ANJE', site: 'https://www.anje.pt', rss: null, categoria: 'Franchising & empreendedorismo' },
  { nome: 'IAPMEI', site: 'https://www.iapmei.pt', rss: null, categoria: 'Franchising & empreendedorismo' },
  { nome: 'Portugal Ventures', site: 'https://www.portugalventures.pt', rss: null, categoria: 'Franchising & empreendedorismo' },
  { nome: 'StartUp Portugal', site: 'https://startupportugal.com', rss: null, categoria: 'Franchising & empreendedorismo' },

  // ── Turismo, lifestyle & agroalimentar ────────────────────
  { nome: 'Ambitur', site: 'https://www.ambitur.pt', rss: 'https://www.ambitur.pt/feed/', categoria: 'Turismo & lifestyle' },
  { nome: 'Publituris', site: 'https://www.publituris.pt', rss: null, categoria: 'Turismo & lifestyle' },
  { nome: 'Turisver', site: 'https://www.turisver.com', rss: null, categoria: 'Turismo & lifestyle' },
  { nome: 'NiT', site: 'https://www.nit.pt', rss: 'https://www.nit.pt/feed', categoria: 'Turismo & lifestyle' },
  { nome: 'Time Out Portugal', site: 'https://www.timeout.pt', rss: null, categoria: 'Turismo & lifestyle' },
  { nome: 'Revista dos Vinhos', site: 'https://www.revistadevinhos.pt', rss: null, categoria: 'Turismo & lifestyle' },
  { nome: 'Vida Rural', site: 'https://www.vidarural.pt', rss: 'https://www.vidarural.pt/feed/', categoria: 'Turismo & lifestyle' },

  // ── Consultoras imobiliárias ──────────────────────────────
  { nome: 'CBRE', site: 'https://www.cbre.pt', rss: null, categoria: 'Consultoras' },
  { nome: 'JLL', site: 'https://www.jll.pt', rss: null, categoria: 'Consultoras' },
  { nome: 'Cushman & Wakefield', site: 'https://www.cushmanwakefield.com/pt-pt', rss: null, categoria: 'Consultoras' },
  { nome: 'Savills', site: 'https://www.savills.pt', rss: null, categoria: 'Consultoras' },
  { nome: 'Wider Property', site: 'https://wider.pt', rss: null, categoria: 'Consultoras' },

  // ── Promotores, operadores & investidores ─────────────────
  { nome: 'Sonae Sierra', site: 'https://www.sonaesierra.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Klépierre', site: 'https://www.klepierre.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Multi Corporation', site: 'https://www.multi.eu', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Ingka Centres', site: 'https://www.ingkacentres.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Mundicenter', site: 'https://www.mundicenter.pt', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Nhood', site: 'https://www.nhood.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Ceetrus', site: 'https://www.ceetrus.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Mitiska REIM', site: 'https://www.mitiska-reim.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'CBRE Investment Management', site: 'https://www.cbreim.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Square Asset Management', site: 'https://www.squaream.pt', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Norfin', site: 'https://www.norfin.pt', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Merlin Properties', site: 'https://www.merlinproperties.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Castellana Properties', site: 'https://www.castellanaproperties.es', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Explorer Investments', site: 'https://www.explorerinvestments.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'AM Alpha', site: 'https://www.am-alpha.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Lighthouse Properties', site: 'https://www.lighthouse.mt', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Eurofund Group', site: 'https://www.eurofundgroup.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Frey', site: 'https://www.frey.fr', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Redevco', site: 'https://www.redevco.com', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Alves Ribeiro', site: 'https://www.alvesribeiro.pt', rss: null, categoria: 'Promotores & investidores' },
  { nome: 'Retail Park Portugal', site: null, rss: null, categoria: 'Promotores & investidores' },

  // ── Associações ───────────────────────────────────────────
  { nome: 'APCC', site: 'https://www.apcc.pt', rss: null, categoria: 'Associações' },
  { nome: 'APPII', site: 'https://www.appii.pt', rss: null, categoria: 'Associações' },
  { nome: 'APEMIP', site: 'https://www.apemip.pt', rss: null, categoria: 'Associações' },
  { nome: 'Portuguese International Realty', site: null, rss: null, categoria: 'Associações' },

  // ── Índia (indicadas por Chandershekhar Kaul, validadas 2026-07-28) ──
  // Só o ET Retail tem feed com conteúdo utilizável. As restantes ficam
  // registadas para ficar claro que são seguidas, mas não são legíveis:
  //   · India Retailing / Indian Retailer — site existe, feed vazio ou ausente
  //   · Realty+ — bloqueia acesso automatizado (403)
  //   · RAI / SCAI — feeds sem artigos
  //   · India Retail News, Phygital, MAPIC India — newsletters/eventos, não sites
  //   · Images RetailME — é a edição do Médio Oriente, não da Índia
  {
    nome: 'ET Retail',
    site: 'https://retail.economictimes.indiatimes.com',
    rss: 'https://retail.economictimes.indiatimes.com/rss/industry',
    categoria: 'Índia — retalho & imobiliário',
    pais: 'Índia',
    idioma: 'en',
  },
  { nome: 'India Retailing', site: 'https://www.indiaretailing.com', rss: null, categoria: 'Índia — retalho & imobiliário', pais: 'Índia', idioma: 'en' },
  { nome: 'Indian Retailer', site: 'https://www.indianretailer.com', rss: null, categoria: 'Índia — retalho & imobiliário', pais: 'Índia', idioma: 'en' },
  { nome: 'Realty+', site: 'https://www.realtyplusmag.com', rss: null, categoria: 'Índia — retalho & imobiliário', pais: 'Índia', idioma: 'en' },
  { nome: 'Retailers Association of India', site: 'https://www.rai.net.in', rss: null, categoria: 'Índia — retalho & imobiliário', pais: 'Índia', idioma: 'en' },
  { nome: 'Shopping Centres Association of India', site: 'https://www.scai.in', rss: null, categoria: 'Índia — retalho & imobiliário', pais: 'Índia', idioma: 'en' },
  { nome: 'Restaurant India', site: 'https://www.restaurantindia.in', rss: null, categoria: 'Índia — retalho & imobiliário', pais: 'Índia', idioma: 'en' },
]
