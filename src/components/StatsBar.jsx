// Cartões de estatísticas rápidas sobre o conjunto todo de artigos.
export default function StatsBar({ artigos }) {
  const agora = new Date().setHours(0, 0, 0, 0)
  const num = (dias) =>
    artigos.filter((a) => new Date(`${a.data}T23:59:59`).getTime() >= agora - (dias - 1) * 86400000).length

  const fontes = new Set(artigos.map((a) => a.fonte)).size

  const stats = [
    { label: 'Hoje', valor: num(1) },
    { label: 'Últimos 7 dias', valor: num(7) },
    { label: 'Total no arquivo', valor: artigos.length },
    { label: 'Fontes com notícias', valor: fontes },
  ]

  return (
    <div className="stats">
      {stats.map((s) => (
        <div className="stat" key={s.label}>
          <div className="stat-valor">{s.valor}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
