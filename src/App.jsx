import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, PAISES } from './data/themes.js'
import FilterBar from './components/FilterBar.jsx'
import ArticleCard from './components/ArticleCard.jsx'

export default function App() {
  const [data, setData] = useState({ articles: [], updatedAt: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [pais, setPais] = useState('Todos')
  const [temas, setTemas] = useState([]) // array de slugs; vazio = todos
  const [query, setQuery] = useState('')

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data.articles || [])
      .filter((a) => (pais === 'Todos' ? true : a.pais === pais))
      .filter((a) => (temas.length === 0 ? true : temas.some((t) => a.temas?.includes(t))))
      .filter((a) =>
        q === ''
          ? true
          : (a.titulo + ' ' + a.resumo + ' ' + a.fonte).toLowerCase().includes(q)
      )
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [data, pais, temas, query])

  const toggleTema = (slug) =>
    setTemas((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]))

  const clearFilters = () => {
    setPais('Todos')
    setTemas([])
    setQuery('')
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="dot" />
          Retail Mind · Radar de Notícias
        </div>
        <div className="meta">
          {data.updatedAt && (
            <span>Atualizado: {new Date(data.updatedAt).toLocaleString('pt-PT')}</span>
          )}
        </div>
      </header>

      <FilterBar
        categories={CATEGORIES}
        paises={['Todos', ...PAISES]}
        pais={pais}
        setPais={setPais}
        temas={temas}
        toggleTema={toggleTema}
        query={query}
        setQuery={setQuery}
        onClear={clearFilters}
      />

      <main className="feed">
        {loading && <p className="state">A carregar…</p>}
        {error && <p className="state err">Erro a carregar dados: {error}</p>}
        {!loading && !error && (
          <>
            <div className="count">
              {filtered.length} {filtered.length === 1 ? 'artigo' : 'artigos'}
            </div>
            {filtered.length === 0 ? (
              <p className="state">Nenhum artigo corresponde aos filtros.</p>
            ) : (
              <div className="grid">
                {filtered.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
