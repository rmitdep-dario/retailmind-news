// Testes das regras de classificação. Correr com:  node scripts/test-rules.mjs
//
// Existem porque cada um destes casos foi um bug REAL apanhado em produção:
//   · "reabre" era classificado como "abre" (nova loja)
//   · "exercício encerrado" era classificado como "encerra" (loja encerrada)
//   · "segurança nacional" dos EUA era classificado como Portugal
// Correr sempre que se mexer em CONTEXTO / GATILHOS / EXCLUIR / MARCAS_*.

import { classificar, detetarPais } from './collect-rss.mjs'

let falhas = 0
const ESP = true
const GEN = false

function tema(nome, real, esperado) {
  const ok = esperado === null ? real === null : real && esperado.every((e) => real.includes(e))
  if (!ok) falhas++
  console.log(`${ok ? 'PASS' : 'FALHA'}  ${nome}${ok ? '' : `  → ${JSON.stringify(real)}`}`)
}

function pais(nome, real, esperado) {
  const ok = real === esperado
  if (!ok) falhas++
  console.log(`${ok ? 'PASS' : 'FALHA'}  ${nome}  → ${real}`)
}

console.log('\n── Português ──')
tema('nova loja', classificar('Mercadona abre nova loja em Braga', 'supermercado', ESP), ['nova-loja'])
tema('retail park', classificar('Grupo Névoa inaugura retail park Beja Jardim', 'espaço comercial', ESP), ['nova-loja', 'retail-parks'])
tema('aquisição', classificar('Equanto adquire a GoldNutrition', 'compra da marca', ESP), ['aquisicoes'])
tema('expansão franchising', classificar('House Comfort reforça presença no Norte com unidade na Maia', 'rede de franchising', ESP), ['marca-expansao'])
tema('fecho de loja', classificar('Marca fecha portas no Colombo', 'centro comercial', ESP), ['loja-encerrada'])
tema('BUG: "reabre" ≠ nova loja', classificar('OHAI Nazaré reabre para o verão', 'hotel de família', ESP), null)
tema('BUG: "encerrado" ≠ loja encerrada', classificar('Fnac Darty cresce 9%', 'exercício encerrado com lucros nas lojas', ESP), ['resultados'])
tema('BUG: "portefólio" solto ≠ fundo', classificar('Aliança lança licor cremoso', 'reforça o portefólio de bebidas', ESP), null)
tema('podcast barrado', classificar('Podcast com o CEO da Zome', 'franchising', ESP), null)
tema('generalista precisa de gatilho no título', classificar('Cinco tendências para 2026', 'algumas marcas vão abrir lojas', GEN), null)
tema('generalista válido', classificar('Sonae abre nova loja Continente em Faro', 'retalho alimentar', GEN), ['nova-loja'])

console.log('\n── Inglês (Índia) ──')
tema('opens store', classificar('Zudio opens 50th store in Mumbai', 'apparel retail chain', ESP, 'en'), ['nova-loja'])
tema('acquisition', classificar('Reliance acquires stake in retail chain', 'deal for the brand', ESP, 'en'), ['aquisicoes'])
tema('lease/anchor', classificar('Phoenix Mills signs lease with anchor tenant', 'new mall in Pune', ESP, 'en'), ['cc-novas-entradas'])
tema('REIT', classificar('Embassy REIT buys office portfolio', 'real estate assets', ESP, 'en'), ['reits'])
tema('macro barrada', classificar("India's factory output grows 7.3%", 'industrial expansion', ESP, 'en'), null)
tema('cricket barrado', classificar('IPL cricket sponsorship deal', 'brands invest', ESP, 'en'), null)

console.log('\n── Espanhol (Colômbia) ──')
tema('nueva tienda', classificar('Falabella abre nueva tienda en Bogotá', 'centro comercial', ESP, 'es'), ['nova-loja'])
tema('expansión', classificar('D1 anuncia plan de expansión con 200 aperturas', 'cadena de tiendas', ESP, 'es'), ['marca-expansao'])
tema('adquisición', classificar('Grupo Éxito adquiere cadena de supermercados', 'operación de compra', ESP, 'es'), ['aquisicoes'])
tema('bodega = logística (CO)', classificar('Empresa arrienda bodega de 20.000 metros cuadrados', 'logística', ESP, 'es'), ['logistica'])
tema('macro barrada', classificar('Banco de la República sube la tasa de interés', 'inflación', GEN, 'es'), null)
tema('petróleo barrado', classificar('La venta de Gran Tierra en el sector petrolero', 'barriles diarios', GEN, 'es'), null)

console.log('\n── Isolamento entre idiomas ──')
// PT e ES partilham vocabulário ("abre", "centro comercial"): a sobreposição é
// esperada e inofensiva, porque cada fonte declara o idioma que usa.
tema('PT/ES sobrepõem-se (esperado)', classificar('Falabella abre nueva tienda en Bogotá', 'centro comercial', ESP, 'pt'), ['nova-loja'])
tema('PT não classifica EN', classificar('Zudio opens 50th store in Mumbai', 'apparel retail', ESP, 'pt'), null)
tema('EN não classifica PT', classificar('Mercadona abre nova loja em Braga', 'supermercado', ESP, 'en'), null)
tema('ES não classifica EN', classificar('Zudio opens 50th store in Mumbai', 'apparel retail', ESP, 'es'), null)

console.log('\n── Deteção de país ──')
pais('Beja = Portugal', detetarPais('Retail park Beja Jardim', 'Alentejo', 'Portugal'), 'Portugal')
pais('BUG: "segurança nacional" dos EUA ≠ Portugal', detetarPais('EUA travam robots estrangeiros', 'risco para a segurança nacional dos Estados Unidos', 'Portugal'), 'Internacional')
pais('"mercado nacional" = Portugal', detetarPais('Marca reforça aposta', 'última abertura no mercado nacional', 'Portugal'), 'Portugal')
pais('Mumbai = Índia', detetarPais('Zudio opens store in Mumbai', '', 'Índia'), 'Índia')
pais('crore = Índia', detetarPais('FNP targets Rs 1,400 crore revenue', 'quick commerce', 'Índia'), 'Índia')
pais('Bogotá = Colômbia', detetarPais('Falabella abre tienda en Bogotá', '', 'Colômbia'), 'Colômbia')
pais('São Paulo = Brasil', detetarPais('Rede abre loja em São Paulo', 'varejo', 'Portugal'), 'Brasil')
pais('Dubai = Internacional', detetarPais('Brand opens in Dubai', 'mall', 'Índia'), 'Internacional')
pais('sem topónimo herda o país da fonte', detetarPais('Cencosud reporta utilidades', 'ingresos', 'Colômbia'), 'Colômbia')

console.log(falhas === 0 ? '\n✓ Todos os testes passaram.\n' : `\n✗ ${falhas} falha(s).\n`)
process.exit(falhas ? 1 : 0)
