import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, PAISES } from './data/themes.js'
import { SOURCES } from './data/sources.js'
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

// lê o estado inicial dos filtros a partir do URL (?pais=&temas=&q=&periodo=&fonte=)
function estadoInicial() {
  const p = new URLSearchParams(window.location.search)
  return {
    pais: p.get('pais') || 'Todos',
    temas: (p.get('temas') || '').split(',').filter(Boolean),
    query: p.get('q') || '',
    periodo: p.get('periodo') || 'tudo',
    fonte: p.get('fonte') || 'Todas',
  }
}

function lerGuardados() {
  try {
    return JSON.parse(localStorage.getItem('radar-guardados') || '[]')
  } catch {
    return []
  }
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
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
  const [fonte, setFonte] = useState(inicial.fonte)
  const [soGuardados, setSoGuardados] = useState(false)
  const [guardados, setGuardados] = useState(lerGuardados)
  const [vista, setVista] = useState(() => localStorage.getItem('radar-vista') || 'cartoes')
  const [copiado, setCopiado] = useState(null) // 'link' | 'resumo'
  const [mostraTopo, setMostraTopo] = useState(false)
  const searchRef = useRef(null)

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
    if (fonte !== 'Todas') p.set('fonte', fonte)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [pais, temas, query, periodo, fonte])

  // persistência de guardados e preferência de vista
  useEffect(() => {
    localStorage.setItem('radar-guardados', JSON.stringify(guardados))
  }, [guardados])
  useEffect(() => {
    localStorage.setItem('radar-vista', vista)
  }, [vista])

  // atalhos: "/" foca pesquisa, Esc limpa tudo
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        limpar()
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // botão voltar ao topo
  useEffect(() => {
    const onScroll = () => setMostraTopo(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const artigos = data.articles || []
  const fontes = useMemo(
    () => ['Todas', ...[...new Set(artigos.map((a) => a.fonte))].sort()],
    [artigos]
  )

  // nº de artigos por fonte (para a secção "Fontes monitorizadas")
  const contagemFontes = useMemo(() => {
    const c = {}
    for (const a of artigos) c[a.fonte] = (c[a.fonte] || 0) + 1
    return c
  }, [artigos])

  // contagens para os chips de tema (respeitam os outros filtros, não o próprio tema)
  const baseSemTema = useMemo(() => {
    const q = query.trim().toLowerCase()
    const limite = PERIODOS.find((p) => p.id === periodo)?.dias
    const corte = limite ? Date.now() - limite * 86400000 : null
    return artigos
      .filter((a) => (pais === 'Todos' ? true : a.pais === pais))
      .filter((a) => (fonte === 'Todas' ? true : a.fonte === fonte))
      .filter((a) => (corte ? new Date(`${a.data}T23:59:59`).getTime() >= corte : true))
      .filter((a) => (soGuardados ? guardados.includes(a.id) : true))
      .filter((a) =>
        q === '' ? true : (a.titulo + ' ' + a.resumo + ' ' + a.fonte).toLowerCase().includes(q)
      )
  }, [artigos, pais, fonte, periodo, query, soGuardados, guardados])

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

  const temFiltros =
    pais !== 'Todos' || temas.length > 0 || query !== '' || periodo !== 'tudo' ||
    fonte !== 'Todas' || soGuardados

  // destaque: artigo mais recente, só quando não há filtros ativos
  const destaque = !temFiltros && filtrados.length > 0 ? filtrados[0] : null
  const lista = destaque ? filtrados.slice(1) : filtrados

  // agrupar por dia
  const porDia = useMemo(() => {
    const g = new Map()
    for (const a of lista) {
      if (!g.has(a.data)) g.set(a.data, [])
      g.get(a.data).push(a)
    }
    return [...g.entries()]
  }, [lista])

  const toggleTema = (slug) =>
    setTemas((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))

  const toggleGuardado = (id) =>
    setGuardados((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))

  function limpar() {
    setPais('Todos')
    setTemas([])
    setQuery('')
    setPeriodo('tudo')
    setFonte('Todas')
    setSoGuardados(false)
  }

  const avisar = (tipo) => {
    setCopiado(tipo)
    setTimeout(() => setCopiado(null), 1800)
  }

  const copiarLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => avisar('link'))
  }

  // gera um resumo em texto dos artigos visíveis, pronto a colar no WhatsApp/Teams
  const copiarResumo = () => {
    const linhas = [`📰 Radar Retail Mind — ${new Date().toLocaleDateString('pt-PT')}`, '']
    for (const [dia, arts] of porDiaComDestaque()) {
      linhas.push(`— ${rotuloDia(dia)} —`)
      for (const a of arts) {
        linhas.push(`• ${a.titulo} (${a.fonte} · ${a.pais})`)
        linhas.push(`  ${a.url}`)
      }
      linhas.push('')
    }
    linhas.push(`Ver tudo: ${window.location.origin}`)
    navigator.clipboard?.writeText(linhas.join('\n')).then(() => avisar('resumo'))
  }

  function porDiaComDestaque() {
    const g = new Map()
    for (const a of filtrados) {
      if (!g.has(a.data)) g.set(a.data, [])
      g.get(a.data).push(a)
    }
    return [...g.entries()]
  }

  const eHoje = (a) => a.data === hojeISO()

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
        <div className="top-right">
          {data.updatedAt && (
            <span className="meta">
              Atualizado {new Date(data.updatedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })},{' '}
              {new Date(data.updatedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            className={`icon-btn ${soGuardados ? 'on' : ''}`}
            onClick={() => setSoGuardados(!soGuardados)}
            title={soGuardados ? 'Mostrar todos' : 'Só guardados'}
          >
            ★ {guardados.length > 0 && <span className="icon-n">{guardados.length}</span>}
          </button>
        </div>
      </header>

      {!loading && !error && !temFiltros && <StatsBar artigos={artigos} />}

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
        fontes={fontes}
        fonte={fonte}
        setFonte={setFonte}
        contagemTemas={contagemTemas}
        onClear={limpar}
        temFiltros={temFiltros}
        searchRef={searchRef}
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
              <div className="feed-actions">
                <div className="vista-toggle" role="group" aria-label="Vista">
                  <button
                    className={vista === 'cartoes' ? 'on' : ''}
                    onClick={() => setVista('cartoes')}
                    title="Vista de cartões"
                  >
                    ▦
                  </button>
                  <button
                    className={vista === 'lista' ? 'on' : ''}
                    onClick={() => setVista('lista')}
                    title="Vista de lista"
                  >
                    ☰
                  </button>
                </div>
                <button className="share" onClick={copiarResumo} title="Copiar resumo em texto dos artigos visíveis">
                  {copiado === 'resumo' ? '✓ Copiado' : 'Copiar resumo'}
                </button>
                {temFiltros && (
                  <button className="share" onClick={copiarLink} title="Copiar link desta vista filtrada">
                    {copiado === 'link' ? '✓ Copiado' : 'Copiar link'}
                  </button>
                )}
              </div>
            </div>

            {filtrados.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">◎</div>
                <p>
                  {soGuardados
                    ? 'Ainda não guardaste nenhum artigo. Usa a ☆ nos cartões.'
                    : 'Nenhum artigo corresponde aos filtros.'}
                </p>
                <button className="clear big" onClick={limpar}>
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <>
                {destaque && (
                  <section className="hero">
                    <div className="hero-tag">Destaque · {rotuloDia(destaque.data)}</div>
                    <ArticleCard
                      article={destaque}
                      temasAtivos={temas}
                      onTema={toggleTema}
                      guardado={guardados.includes(destaque.id)}
                      onGuardar={toggleGuardado}
                      hero
                      novo={eHoje(destaque)}
                    />
                  </section>
                )}
                {porDia.map(([dia, arts]) => (
                  <section key={dia} className="day">
                    <h2 className="day-label">
                      {rotuloDia(dia)}
                      <span className="day-count">{arts.length}</span>
                    </h2>
                    <div className={vista === 'lista' ? 'lista' : 'grid'}>
                      {arts.map((a) => (
                        <ArticleCard
                          key={a.id}
                          article={a}
                          temasAtivos={temas}
                          onTema={toggleTema}
                          guardado={guardados.includes(a.id)}
                          onGuardar={toggleGuardado}
                          compacto={vista === 'lista'}
                          novo={eHoje(a)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}
          </>
        )}
      </main>

      {!loading && !error && (
        <section className="fontes">
          <h2 className="fontes-titulo">
            Fontes monitorizadas
            <span className="fontes-sub">
              {SOURCES.length} fontes · recolha diária às 07:00 · {SOURCES.filter((s) => contagemFontes[s.nome]).length} com artigos no arquivo
            </span>
          </h2>
          {[...new Set(SOURCES.map((s) => s.categoria))].map((cat) => (
            <div key={cat} className="fontes-cat">
              <div className="fontes-cat-label">{cat}</div>
              <div className="fontes-grid">
                {SOURCES.filter((s) => s.categoria === cat).map((s) => {
                  const n = contagemFontes[s.nome] || 0
                  const ativa = fonte === s.nome
                  return (
                    <button
                      key={s.nome}
                      className={`fonte-chip ${n > 0 ? 'tem' : ''} ${ativa ? 'on' : ''}`}
                      onClick={() => {
                        if (n === 0) return
                        setFonte(ativa ? 'Todas' : s.nome)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      title={
                        n > 0
                          ? `${n} ${n === 1 ? 'artigo' : 'artigos'} — clicar para filtrar`
                          : 'Monitorizada — ainda sem artigos no arquivo'
                      }
                    >
                      <span className={`fonte-dot ${n > 0 ? 'verde' : ''}`} />
                      {s.nome}
                      {n > 0 && <span className="tag-n">{n}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {mostraTopo && (
        <button className="topo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Voltar ao topo">
          ↑
        </button>
      )}

      <footer className="foot">
        Recolha automática diária às 07:00 · Atalhos: <kbd>/</kbd> pesquisar · <kbd>Esc</kbd> limpar ·{' '}
        {new Date().getFullYear()} Retail Mind Group
      </footer>
    </div>
  )
}
