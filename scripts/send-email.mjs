// Envia o email-resumo com os artigos NOVOS do último commit, via Resend.
// Corre na GitHub Action (email.yml), a cada push que altere articles.json.
//
// Variáveis de ambiente:
//   RESEND_API_KEY  (secret)   — obrigatória
//   MAIL_FROM       (variable)  — ex. "Radar Retail Mind <radar@teudominio.pt>"
//                                 fallback: sandbox do Resend (só envia para o dono da conta)
//   MAIL_TO         (variable)  — lista separada por vírgulas; fallback: rmitdep@gmail.com
//   SITE_URL        (variable)  — link para a página (ex. https://retailmind-news.vercel.app)

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { CATEGORIES } from '../src/data/themes.js'

const KEY = process.env.RESEND_API_KEY
if (!KEY) {
  console.error('RESEND_API_KEY em falta — abortar.')
  process.exit(1)
}
const FROM = process.env.MAIL_FROM || 'Radar Retail Mind <onboarding@resend.dev>'
const TO = (process.env.MAIL_TO || 'rmitdep@gmail.com')
  .split(',').map((s) => s.trim()).filter(Boolean)
const SITE_URL = process.env.SITE_URL || ''

// slug de tema -> id de categoria, e labels de categoria
const slugToCat = {}
const catLabel = {}
for (const c of CATEGORIES) {
  catLabel[c.id] = c.label
  for (const t of c.themes) slugToCat[t.slug] = c.id
}
const catOrder = CATEGORIES.map((c) => c.id)

// artigos atuais
const current = JSON.parse(readFileSync('public/data/articles.json', 'utf8'))

// ids do commit anterior (para saber o que é novo)
let prevIds = new Set()
try {
  const prevRaw = execSync('git show HEAD~1:public/data/articles.json', { encoding: 'utf8' })
  prevIds = new Set((JSON.parse(prevRaw).articles || []).map((a) => a.id))
} catch {
  console.log('Sem versão anterior de articles.json (primeiro commit?).')
}

const novos = (current.articles || []).filter((a) => !prevIds.has(a.id))
if (novos.length === 0) {
  console.log('Sem artigos novos — não envia email.')
  process.exit(0)
}

// agrupar por categoria (primeira categoria que casa com um tema do artigo)
const grupos = {}
for (const a of novos) {
  const cat = (a.temas || []).map((t) => slugToCat[t]).find(Boolean) || 'outros'
  ;(grupos[cat] ||= []).push(a)
}

const hoje = new Date().toISOString().slice(0, 10)
const esc = (s) => String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))

let secoes = ''
for (const cat of [...catOrder, 'outros']) {
  const arts = grupos[cat]
  if (!arts || arts.length === 0) continue
  const label = catLabel[cat] || 'Outros'
  const itens = arts.map((a) => `
    <li style="margin:0 0 14px 0;">
      <a href="${esc(a.url)}" style="color:#0b5; font-weight:600; text-decoration:none;">${esc(a.titulo)}</a>
      <div style="color:#667; font-size:12px; margin:2px 0;">${esc(a.fonte)} · ${esc(a.pais)}</div>
      <div style="color:#334; font-size:14px;">${esc(a.resumo)}</div>
    </li>`).join('')
  secoes += `
    <h2 style="font-size:15px; color:#111; border-bottom:1px solid #eee; padding-bottom:6px; margin:24px 0 12px;">${esc(label)}</h2>
    <ul style="list-style:none; padding:0; margin:0;">${itens}</ul>`
}

const linkPagina = SITE_URL
  ? `<p style="margin-top:28px;"><a href="${esc(SITE_URL)}" style="color:#0b5;">Ver todas as notícias na página →</a></p>`
  : ''

const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; max-width:640px; margin:0 auto; color:#222;">
    <h1 style="font-size:18px; margin:0 0 4px;">Radar Retail Mind — ${hoje}</h1>
    <p style="color:#667; font-size:13px; margin:0 0 8px;">${novos.length} ${novos.length === 1 ? 'novidade' : 'novidades'} hoje</p>
    ${secoes}
    ${linkPagina}
  </div>`

const subject = `Radar Retail Mind — ${hoje} (${novos.length} ${novos.length === 1 ? 'novidade' : 'novidades'})`

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: FROM, to: TO, subject, html }),
})

if (!res.ok) {
  console.error(`Resend falhou: ${res.status} ${await res.text()}`)
  process.exit(1)
}
console.log(`Email enviado para ${TO.join(', ')} — ${novos.length} artigos.`)
