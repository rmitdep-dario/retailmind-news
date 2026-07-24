import { useState } from 'react'
import { THEME_LABELS } from '../data/themes.js'

export default function FilterBar({
  categories,
  paises,
  pais,
  setPais,
  temas,
  toggleTema,
  query,
  setQuery,
  periodos,
  periodo,
  setPeriodo,
  contagemTemas,
  onClear,
  temFiltros,
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="filters">
      <div className="filters-row">
        <input
          className="search"
          type="search"
          placeholder="Pesquisar título, resumo ou fonte…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="pill-group">
          {paises.map((p) => (
            <button key={p} className={`pill ${pais === p ? 'on' : ''}`} onClick={() => setPais(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="pill-group periodo">
          {periodos.map((p) => (
            <button
              key={p.id}
              className={`pill ${periodo === p.id ? 'on' : ''}`}
              onClick={() => setPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-row2">
        <button className={`themes-toggle ${aberto ? 'open' : ''}`} onClick={() => setAberto(!aberto)}>
          Temas{temas.length > 0 && <span className="badge">{temas.length}</span>}
          <span className="chev">{aberto ? '▴' : '▾'}</span>
        </button>

        {temas.length > 0 && (
          <div className="temas-ativos">
            {temas.map((t) => (
              <button key={t} className="tag on small" onClick={() => toggleTema(t)}>
                {THEME_LABELS[t] || t} ✕
              </button>
            ))}
          </div>
        )}

        {temFiltros && (
          <button className="clear" onClick={onClear}>
            Limpar filtros
          </button>
        )}
      </div>

      {aberto && (
        <div className="themes">
          {categories.map((cat) => (
            <div className="theme-cat" key={cat.id}>
              <div className="theme-cat-label">{cat.label}</div>
              <div className="theme-tags">
                {cat.themes.map((t) => {
                  const n = contagemTemas[t.slug] || 0
                  return (
                    <button
                      key={t.slug}
                      className={`tag ${temas.includes(t.slug) ? 'on' : ''} ${n === 0 ? 'zero' : ''}`}
                      onClick={() => toggleTema(t.slug)}
                      title={n === 0 ? 'Sem artigos com os filtros atuais' : `${n} artigos`}
                    >
                      {t.label}
                      {n > 0 && <span className="tag-n">{n}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
