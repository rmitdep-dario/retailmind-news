import { THEME_LABELS } from '../data/themes.js'

export default function ArticleCard({ article }) {
  const { titulo, resumo, url, fonte, pais, temas = [], data } = article
  return (
    <article className="card">
      <div className="card-head">
        <span className="source">{fonte}</span>
        <span className={`geo geo-${pais.toLowerCase()}`}>{pais}</span>
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
            <span className="chip" key={t}>
              {THEME_LABELS[t] || t}
            </span>
          ))}
        </div>
        <time className="date">{new Date(data).toLocaleDateString('pt-PT')}</time>
      </div>
    </article>
  )
}
