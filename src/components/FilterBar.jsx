export default function FilterBar({
  categories,
  paises,
  pais,
  setPais,
  temas,
  toggleTema,
  query,
  setQuery,
  onClear,
}) {
  const hasActive = pais !== 'Todos' || temas.length > 0 || query !== ''

  return (
    <div className="filters">
      <div className="filters-row">
        <input
          className="search"
          type="search"
          placeholder="Pesquisar título, resumo, fonte…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="pais-group">
          {paises.map((p) => (
            <button
              key={p}
              className={`pill ${pais === p ? 'on' : ''}`}
              onClick={() => setPais(p)}
            >
              {p}
            </button>
          ))}
        </div>
        {hasActive && (
          <button className="clear" onClick={onClear}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className="themes">
        {categories.map((cat) => (
          <div className="theme-cat" key={cat.id}>
            <div className="theme-cat-label">{cat.label}</div>
            <div className="theme-tags">
              {cat.themes.map((t) => (
                <button
                  key={t.slug}
                  className={`tag ${temas.includes(t.slug) ? 'on' : ''}`}
                  onClick={() => toggleTema(t.slug)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
