// Envia o email-resumo com os artigos NOVOS do último commit.
// Corre na GitHub Action (email.yml), a cada push que altere articles.json.
//
// Escolhe o provedor automaticamente:
//   - Se GMAIL_APP_PASSWORD existir  -> envia via Gmail SMTP (from = GMAIL_USER).
//     Envia para QUALQUER destinatário, sem verificação de domínio.
//   - Senão, se RESEND_API_KEY existir -> envia via Resend.
//
// Variáveis de ambiente:
//   GMAIL_USER         (variable) — email Gmail remetente (default: rmitdep@gmail.com)
//   GMAIL_APP_PASSWORD (secret)   — App Password do Google (16 chars). Ativa o modo Gmail.
//   RESEND_API_KEY     (secret)   — alternativa ao Gmail
//   MAIL_FROM          (variable) — override do remetente (ex. "Radar Retail Mind <radar@dominio>")
//   MAIL_TO            (variable) — destinatários separados por vírgula (default: rmitdep@gmail.com)
//   SITE_URL           (variable) — link para a página (default: URL do Vercel)

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { CATEGORIES } from '../src/data/themes.js'

const RESEND_KEY = process.env.RESEND_API_KEY
const GMAIL_USER = process.env.GMAIL_USER || 'rmitdep@gmail.com'
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
const useGmail = !!GMAIL_APP_PASSWORD

if (!useGmail && !RESEND_KEY && process.env.DRY !== '1') {
  console.error('Falta credencial: define GMAIL_APP_PASSWORD (Gmail) ou RESEND_API_KEY (Resend).')
  process.exit(1)
}

const FROM = process.env.MAIL_FROM ||
  (useGmail ? `Radar Retail Mind <${GMAIL_USER}>` : 'Radar Retail Mind <onboarding@resend.dev>')
const TO = (process.env.MAIL_TO || 'rmitdep@gmail.com')
  .split(',').map((s) => s.trim()).filter(Boolean)
const SITE_URL = process.env.SITE_URL || 'https://retailmind-news.vercel.app'

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

const TEST = process.env.TEST_MODE === 'true'
let novos
if (TEST) {
  novos = (current.articles || []).slice(0, 5)
  console.log(`MODO TESTE: a enviar os ${novos.length} artigos mais recentes.`)
} else {
  novos = (current.articles || []).filter((a) => !prevIds.has(a.id))
  if (novos.length === 0) {
    console.log('Sem artigos novos — não envia email.')
    process.exit(0)
  }
}

// agrupar por categoria (primeira categoria que casa com um tema do artigo)
const grupos = {}
for (const a of novos) {
  const cat = (a.temas || []).map((t) => slugToCat[t]).find(Boolean) || 'outros'
  ;(grupos[cat] ||= []).push(a)
}

const hoje = new Date().toISOString().slice(0, 10)
const esc = (s) => String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))

// resumo por categoria (ex. "Retalho 3 · Investimento 2")
const breakdown = [...catOrder, 'outros']
  .filter((cat) => grupos[cat]?.length)
  .map((cat) => `${(catLabel[cat] || 'Outros').split(' — ')[0].split(' / ')[0]} ${grupos[cat].length}`)
  .join(' · ')

// email leve: só os títulos (com link para a fonte), agrupados por categoria
let secoes = ''
for (const cat of [...catOrder, 'outros']) {
  const arts = grupos[cat]
  if (!arts || arts.length === 0) continue
  const label = catLabel[cat] || 'Outros'
  const itens = arts.map((a) => `
    <li style="margin:0 0 9px 0; line-height:1.4;">
      <a href="${esc(a.url)}" style="color:#111; font-weight:600; text-decoration:none;">${esc(a.titulo)}</a>
      <span style="color:#8a94a0; font-size:12px;"> — ${esc(a.fonte)} · ${esc(a.pais)}</span>
    </li>`).join('')
  secoes += `
    <h2 style="font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:#8a94a0; margin:22px 0 10px;">${esc(label)}</h2>
    <ul style="list-style:none; padding:0; margin:0;">${itens}</ul>`
}

const botao = SITE_URL
  ? `<div style="margin:30px 0 6px;">
       <a href="${esc(SITE_URL)}" style="display:inline-block; background:#16a34a; color:#fff; font-weight:600; font-size:14px; text-decoration:none; padding:12px 22px; border-radius:8px;">Ver tudo no Radar, com filtros →</a>
     </div>`
  : ''

const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif; max-width:600px; margin:0 auto; color:#222;">
    <h1 style="font-size:18px; margin:0 0 2px;">Radar Retail Mind</h1>
    <p style="color:#8a94a0; font-size:13px; margin:0 0 4px;">${hoje}</p>
    <p style="font-size:15px; margin:14px 0 4px;"><strong>${novos.length} ${novos.length === 1 ? 'novidade' : 'novidades'}</strong> para o retalho e imobiliário comercial${breakdown ? `<br><span style="color:#8a94a0; font-size:13px;">${esc(breakdown)}</span>` : ''}</p>
    ${secoes}
    ${botao}
    <p style="color:#b0b7c0; font-size:11px; margin-top:24px;">Clica num título para abrir a fonte, ou usa o botão para ver todas as notícias filtráveis por país e tema.</p>
  </div>`

const subject = `Radar Retail Mind — ${hoje} (${novos.length} ${novos.length === 1 ? 'novidade' : 'novidades'})`

// DRY=1 → pré-visualiza o HTML sem enviar (para testar localmente)
if (process.env.DRY === '1') {
  const { writeFileSync } = await import('node:fs')
  writeFileSync('/tmp/email-preview.html', html)
  console.log('DRY-RUN — assunto:', subject)
  console.log('HTML escrito em /tmp/email-preview.html')
  process.exit(0)
}

if (useGmail) {
  // Gmail SMTP — envia para qualquer destinatário, sem verificação de domínio.
  const nodemailer = (await import('nodemailer')).default
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  })
  await transport.sendMail({ from: FROM, to: TO.join(', '), subject, html })
  console.log(`Email enviado via Gmail (${GMAIL_USER}) para ${TO.join(', ')} — ${novos.length} artigos.`)
} else {
  // Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: TO, subject, html }),
  })
  if (!res.ok) {
    console.error(`Resend falhou: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  console.log(`Email enviado via Resend para ${TO.join(', ')} — ${novos.length} artigos.`)
}
