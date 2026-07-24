import { THEME_LABELS } from '../data/themes.js'

// domínio limpo do URL, para a equipa saber para onde o link leva
function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export default function ArticleCard({ article, temasAtivos = [], onTema }) {
  const { titulo, resumo, url, fonte, pais, temas = [], data } = article
  return (
    <article className="card">
      <div className="card-head">
        <span className="source">{fonte}</span>
        <span className="geo">{pais}</span>
      </div>
      <h3 className="card-title">
        <a href={url} target="_blank" rel="noopener noreferrer">
          {titulo}
        </a>
      </h3>
      <p className="card-summary">{resumo}</p>
      <div className="card-foot">
        <div className="chips">
          {temas.map((t) => (
            <button
              className={`chip ${temasAtivos.includes(t) ? 'on' : ''}`}
              key={t}
              onClick={() => onTema?.(t)}
              title="Filtrar por este tema"
            >
              {THEME_LABELS[t] || t}
            </button>
          ))}
        </div>
        <a className="card-link" href={url} target="_blank" rel="noopener noreferrer">
          {dominio(url)} ↗
        </a>
      </div>
    </article>
  )
}
