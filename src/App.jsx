import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, PAISES } from './data/themes.js'
import FilterBar from './components/FilterBar.jsx'
import ArticleCard from './components/ArticleCard.jsx'
import StatsBar from './components/StatsBar.jsx'

// filtros rápidos de data
const PERIODOS = [
  { id: 'tudo', label: 'Tudo', dias: null },
  { id: 'hoje', label: 'Hoje', dias: 1 },
  { id: '7d', label: '7 dias', dias: 7 },
  { id: '30d', label: '30 dias', dias: 30 },
]

// lê o estado inicial dos filtros a partir do URL (?pais=&temas=&q=&periodo=)
function estadoInicial() {
  const p = new URLSearchParams(window.location.search)
  return {
    pais: p.get('pais') || 'Todos',
    temas: (p.get('temas') || '').split(',').filter(Boolean),
    query: p.get('q') || '',
    periodo: p.get('periodo') || 'tudo',
  }
}

function rotuloDia(iso) {
  const hoje = new Date()
  const d = new Date(`${iso}T00:00:00`)
  const diff = Math.floor((hoje.setHours(0, 0, 0, 0) - d.getTime()) / 86400000)
  if (diff <= 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (diff < 7) return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function App() {
  const [data, setData] = useState({ articles: [], updatedAt: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const inicial = useMemo(estadoInicial, [])
  const [pais, setPais] = useState(inicial.pais)
  const [temas, setTemas] = useState(inicial.temas)
  const [query, setQuery] = useState(inicial.query)
  const [periodo, setPeriodo] = useState(inicial.periodo)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/articles.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // sincroniza os filtros com o URL — a vista filtrada fica partilhável
  useEffect(() => {
    const p = new URLSearchParams()
    if (pais !== 'Todos') p.set('pais', pais)
    if (temas.length) p.set('temas', temas.join(','))
    if (query) p.set('q', query)
    if (periodo !== 'tudo') p.set('periodo', periodo)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [pais, temas, query, periodo])

  const artigos = data.articles || []

  // contagens para os chips de tema (respeitam pais/periodo/pesquisa, não o próprio tema)
  const baseSemTema = useMemo(() => {
    const q = query.trim().toLowerCase()
    const limite = PERIODOS.find((p) => p.id === periodo)?.dias
    const corte = limite ? Date.now() - limite * 86400000 : null
    return artigos
      .filter((a) => (pais === 'Todos' ? true : a.pais === pais))
      .filter((a) => (corte ? new Date(`${a.data}T23:59:59`).getTime() >= corte : true))
      .filter((a) =>
        q === '' ? true : (a.titulo + ' ' + a.resumo + ' ' + a.fonte).toLowerCase().includes(q)
      )
  }, [artigos, pais, periodo, query])

  const contagemTemas = useMemo(() => {
    const c = {}
    for (const a of baseSemTema) for (const t of a.temas || []) c[t] = (c[t] || 0) + 1
    return c
  }, [baseSemTema])

  const filtrados = useMemo(() => {
    return baseSemTema
      .filter((a) => (temas.length === 0 ? true : temas.some((t) => a.temas?.includes(t))))
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [baseSemTema, temas])

  // agrupar por dia para a lista
  const porDia = useMemo(() => {
    const g = new Map()
    for (const a of filtrados) {
      if (!g.has(a.data)) g.set(a.data, [])
      g.get(a.data).push(a)
    }
    return [...g.entries()]
  }, [filtrados])

  const toggleTema = (slug) =>
    setTemas((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))

  const limpar = () => {
    setPais('Todos')
    setTemas([])
    setQuery('')
    setPeriodo('tudo')
  }

  const temFiltros = pais !== 'Todos' || temas.length > 0 || query !== '' || periodo !== 'tudo'

  const copiarLink = () => {
    navigator.clipboard?.writeText(window.location.href)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="dot" />
          <div>
            <div className="brand-name">Radar de Notícias</div>
            <div className="brand-sub">Retail Mind · retalho &amp; imobiliário comercial</div>
          </div>
        </div>
        <div className="meta">
          {data.updatedAt && (
            <span>
              Atualizado {new Date(data.updatedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })},{' '}
              {new Date(data.updatedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {!loading && !error && <StatsBar artigos={artigos} />}

      <FilterBar
        categories={CATEGORIES}
        paises={['Todos', ...PAISES]}
        pais={pais}
        setPais={setPais}
        temas={temas}
        toggleTema={toggleTema}
        query={query}
        setQuery={setQuery}
        periodos={PERIODOS}
        periodo={periodo}
        setPeriodo={setPeriodo}
        contagemTemas={contagemTemas}
        onClear={limpar}
        temFiltros={temFiltros}
      />

      <main className="feed">
        {loading && (
          <div className="skeletons">
            {[...Array(6)].map((_, i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        )}
        {error && <p className="state err">Erro a carregar dados: {error}</p>}
        {!loading && !error && (
          <>
            <div className="feed-head">
              <span className="count">
                {filtrados.length} {filtrados.length === 1 ? 'artigo' : 'artigos'}
                {temFiltros && <span className="count-hint"> · filtros ativos</span>}
              </span>
              {temFiltros && (
                <button className="share" onClick={copiarLink} title="Copiar link desta vista filtrada">
                  Copiar link da vista
                </button>
              )}
            </div>

            {filtrados.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">◎</div>
                <p>Nenhum artigo corresponde aos filtros.</p>
                <button className="clear big" onClick={limpar}>
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              porDia.map(([dia, arts]) => (
                <section key={dia} className="day">
                  <h2 className="day-label">
                    {rotuloDia(dia)}
                    <span className="day-count">{arts.length}</span>
                  </h2>
                  <div className="grid">
                    {arts.map((a) => (
                      <ArticleCard key={a.id} article={a} temasAtivos={temas} onTema={toggleTema} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </main>

      <footer className="foot">
        Recolha automática diária às 07:00 · {new Date().getFullYear()} Retail Mind Group
      </footer>
    </div>
  )
}
