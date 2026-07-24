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

// data em português (ex. "24 de julho de 2026")
const dataPt = new Date(`${hoje}T00:00:00`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

// chips de contagem por categoria no topo
const chips = [...catOrder, 'outros']
  .filter((cat) => grupos[cat]?.length)
  .map((cat) => {
    const nome = (catLabel[cat] || 'Outros').split(' — ')[0].split(' / ')[0]
    return `<span style="display:inline-block; background:#0f1620; border:1px solid #223; color:#8fe3b0; font-size:12px; font-weight:600; padding:4px 10px; border-radius:999px; margin:0 6px 6px 0;">${esc(nome)} · ${grupos[cat].length}</span>`
  }).join('')

// secções por categoria, com cartão por artigo (fonte, país, título, teaser)
let secoes = ''
for (const cat of [...catOrder, 'outros']) {
  const arts = grupos[cat]
  if (!arts || arts.length === 0) continue
  const label = catLabel[cat] || 'Outros'
  const cards = arts.map((a) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
      <tr><td style="background:#ffffff; border:1px solid #e8ebef; border-left:3px solid #16a34a; border-radius:10px; padding:14px 16px;">
        <div style="margin:0 0 6px 0;">
          <span style="color:#16a34a; font-weight:700; font-size:12px;">${esc(a.fonte)}</span>
          <span style="color:#aab2bd; font-size:12px;">&nbsp;·&nbsp;${esc(a.pais)}</span>
        </div>
        <a href="${esc(a.url)}" style="color:#0f172a; font-weight:700; font-size:15px; line-height:1.35; text-decoration:none;">${esc(a.titulo)}</a>
        <div style="color:#55606e; font-size:13px; line-height:1.5; margin-top:5px;">${esc(a.resumo)}</div>
      </td></tr>
    </table>`).join('')
  secoes += `
    <div style="font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:#98a1ad; font-weight:700; margin:26px 0 12px;">${esc(label)}</div>
    ${cards}`
}

const botao = `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px auto 8px;">
    <tr><td style="border-radius:10px; background:#16a34a;">
      <a href="${esc(SITE_URL)}" style="display:inline-block; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; padding:14px 28px;">Ver tudo no Radar, com filtros →</a>
    </td></tr>
  </table>`

const html = `
  <div style="background:#eef1f4; padding:24px 12px; font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto;">
      <tr><td style="background:#0b0d10; border-radius:14px 14px 0 0; padding:22px 24px;">
        <div style="color:#ffffff; font-size:19px; font-weight:800; letter-spacing:-.01em;">
          <span style="display:inline-block; width:9px; height:9px; background:#4ade80; border-radius:50%; margin-right:8px;"></span>Radar Retail Mind
        </div>
        <div style="color:#7c8794; font-size:12px; margin-top:6px; text-transform:uppercase; letter-spacing:.08em;">Retail · Real Estate · Portugal — ${esc(dataPt)}</div>
        <div style="margin-top:14px;">${chips}</div>
      </td></tr>
      <tr><td style="background:#f7f8fa; border:1px solid #e3e7ec; border-top:none; border-radius:0 0 14px 14px; padding:8px 24px 28px;">
        <p style="font-size:15px; color:#0f172a; margin:18px 0 0;"><strong style="font-size:17px;">${novos.length} ${novos.length === 1 ? 'novidade' : 'novidades'}</strong> para o retalho e imobiliário comercial hoje.</p>
        ${secoes}
        <div style="text-align:center;">${botao}</div>
        <p style="color:#aab2bd; font-size:11px; text-align:center; margin-top:18px; line-height:1.5;">Clica num título para abrir a fonte original, ou no botão para veres todas as notícias filtráveis por país e tema.<br>Radar Retail Mind — recolha automática diária.</p>
      </td></tr>
    </table>
  </div>`

const subject = `Radar Retail Mind — ${hoje} (${novos.length} ${novos.length === 1 ? 'novidade' : 'novidades'})`

// versão texto-simples (ajuda os filtros anti-spam e clientes sem HTML)
const texto = [
  `Radar Retail Mind — ${hoje}`,
  `${novos.length} ${novos.length === 1 ? 'novidade' : 'novidades'} para o retalho e imobiliário comercial`,
  breakdown ? breakdown : '',
  '',
  ...novos.map((a) => `• ${a.titulo} — ${a.fonte} · ${a.pais}\n  ${a.url}`),
  '',
  `Ver tudo (filtrável por país e tema): ${SITE_URL}`,
].filter((l) => l !== null && l !== undefined).join('\n')

const REPLY_TO = process.env.MAIL_REPLY_TO || GMAIL_USER

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
  await transport.sendMail({ from: FROM, to: TO.join(', '), replyTo: REPLY_TO, subject, html, text: texto })
  console.log(`Email enviado via Gmail (${GMAIL_USER}) para ${TO.join(', ')} — ${novos.length} artigos.`)
} else {
  // Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: TO, reply_to: REPLY_TO, subject, html, text: texto }),
  })
  if (!res.ok) {
    console.error(`Resend falhou: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  console.log(`Email enviado via Resend para ${TO.join(', ')} — ${novos.length} artigos.`)
}
