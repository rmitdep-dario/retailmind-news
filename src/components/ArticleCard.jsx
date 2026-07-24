import { THEME_LABELS } from '../data/themes.js'

// domínio limpo do URL, para a equipa saber para onde o link leva
function dominio(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export default function ArticleCard({
  article,
  temasAtivos = [],
  onTema,
  guardado = false,
  onGuardar,
  onOcultar,
  compacto = false,
  hero = false,
  novo = false,
}) {
  const { id, titulo, resumo, url, fonte, pais, temas = [] } = article

  if (compacto) {
    return (
      <article className="row">
        <button
          className={`star ${guardado ? 'on' : ''}`}
          onClick={() => onGuardar?.(id)}
          title={guardado ? 'Remover dos guardados' : 'Guardar'}
        >
          {guardado ? '★' : '☆'}
        </button>
        <div className="row-main">
          <a className="row-title" href={url} target="_blank" rel="noopener noreferrer">
            {novo && <span className="novo">novo</span>}
            {titulo}
          </a>
          <span className="row-meta">
            {fonte} · {pais} · {dominio(url)}
          </span>
        </div>
        <button className="ocultar" onClick={() => onOcultar?.(article)} title="Não relevante — ocultar">
          ✕
        </button>
      </article>
    )
  }

  return (
    <article className={`card ${hero ? 'card-hero' : ''}`}>
      <div className="card-head">
        <span className="source">
          {fonte}
          {novo && <span className="novo">novo</span>}
        </span>
        <div className="card-head-right">
          <span className="geo">{pais}</span>
          <button
            className={`star ${guardado ? 'on' : ''}`}
            onClick={() => onGuardar?.(id)}
            title={guardado ? 'Remover dos guardados' : 'Guardar para ler depois'}
          >
            {guardado ? '★' : '☆'}
          </button>
          <button className="ocultar" onClick={() => onOcultar?.(article)} title="Não relevante — ocultar">
            ✕
          </button>
        </div>
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
