import { decodificarCompacto } from '../calculadora/link.js'

const CALC = 'https://iampiscis.github.io/pokepocket/calculadora/'
const ICONE = 'https://iampiscis.github.io/pokepocket/assets/icone.png'
const ORIGENS = ['https://iampiscis.github.io', 'http://localhost:4412']
const ROBOS = /discordbot|twitterbot|facebookexternalhit|whatsapp|telegrambot|slackbot|linkedinbot|embedly|skypeuripreview|redditbot|googlebot|bingbot|applebot|vkshare|pinterest|mastodon|bluesky|cardyb/i
const FAIXAS = [[0, 'Baixo', '#f87171'], [300, 'Regular', '#fb923c'], [500, 'Bom', '#facc15'], [700, 'Excelente', '#4ade80']]
const FAIXAS_NOTA = [[1, 'Extremamente fraco'], [2, 'Fraco'], [3, 'Mediano'], [4, 'Razoável'], [5, 'Bom'], [6, 'Forte'], [7, 'Poderoso'], [8, 'Mítico'], [9, 'Lendário'], [10, 'Divino']]
const ID = /^[0-9A-Za-z]{7}$/
const TOKEN = /^[A-Za-z0-9_-]{8,200}$/
const MAX_IMAGEM = 450 * 1024

const fmt = new Intl.NumberFormat('pt-BR')
const fmt3 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const faixa = (v) => [...FAIXAS].reverse().find(([de]) => v >= de) || FAIXAS[0]
const faixaNota = (n) => (FAIXAS_NOTA.find(([ate]) => n <= ate) || FAIXAS_NOTA[9])[1]
const ehNum = (v) => typeof v === 'number' && Number.isFinite(v)

function cors(req) {
  const o = req.headers.get('origin') || ''
  return ORIGENS.includes(o) ? { 'access-control-allow-origin': o, vary: 'origin' } : {}
}

async function idDe(token) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
  const a = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let s = ''
  for (let i = 0; i < 7; i++) s += a[h[i] % 62]
  return s
}

function pngValido(b) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  if (b.length < 33 || sig.some((v, i) => b[i] !== v)) return false
  const dv = new DataView(b.buffer, b.byteOffset)
  return dv.getUint32(16) === 1200 && dv.getUint32(20) === 630
}

function textos(d) {
  const r = d.resumo || {}
  const titulo = [`${r.nome || 'Pokémon'}${d.sim.shiny ? ' shiny' : ''}`, `Nv ${fmt.format(d.sim.level)}`, `P${d.sim.potencia}`].join(' · ')
  const linhas = [
    ehNum(r.nota) ? `Nota ${fmt3.format(r.nota)} · ${faixaNota(r.nota)}` : null,
    ehNum(r.pvp) ? `Score PvP ${fmt.format(r.pvp)} · ${faixa(r.pvp)[1]}` : null,
    ehNum(r.pve) ? `Score PvE ${fmt.format(r.pve)} · ${faixa(r.pve)[1]}` : null,
    ehNum(r.justo) ? `Preço justo ${fmt.format(Math.round(r.justo))} gemas` : null
  ].filter(Boolean)
  return { titulo, descricao: linhas.length ? linhas.join('\n') : 'Simule nível, refino, potência e Z-Move.', cor: ehNum(r.pvp) ? faixa(r.pvp)[2] : '#ffd34d' }
}

function pagina({ titulo, descricao, cor }, destino, proprio, imagem) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(titulo)} · Calculadora PokePocket</title>
<meta name="description" content="${esc(descricao)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Calculadora PokePocket">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(proprio)}">
<meta property="og:image" content="${esc(imagem || ICONE)}">
${imagem ? '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">' : '<meta name="twitter:card" content="summary">'}
<meta name="theme-color" content="${cor}">
<meta http-equiv="refresh" content="0;url=${esc(destino)}">
</head>
<body><a href="${esc(destino)}">Abrir na calculadora</a></body>
</html>`
}

function responderLink(req, url, token, id, temImagem) {
  let d
  try { d = decodificarCompacto(token) } catch { return Response.redirect(CALC, 302) }
  const destino = `${CALC}#k=${token}`
  if (!ROBOS.test(req.headers.get('user-agent') || '')) return Response.redirect(destino, 302)
  const imagem = id && temImagem ? `${url.origin}/i/${id}.png` : null
  return new Response(pagina(textos(d), destino, url.href, imagem), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } })
}

async function criarLink(req, env) {
  const token = (await req.text()).trim()
  if (!TOKEN.test(token)) return new Response('link inválido', { status: 400, headers: cors(req) })
  try { decodificarCompacto(token) } catch { return new Response('link inválido', { status: 400, headers: cors(req) }) }
  const id = await idDe(token)
  const atual = await env.LINKS.get(`l:${id}`)
  if (atual !== token) await env.LINKS.put(`l:${id}`, token)
  const temImagem = !!(await env.LINKS.get(`i:${id}`, { type: 'arrayBuffer' }))
  return Response.json({ id, temImagem }, { headers: cors(req) })
}

async function guardarImagem(req, env, id) {
  if (!(await env.LINKS.get(`l:${id}`))) return new Response('link não existe', { status: 404, headers: cors(req) })
  if (await env.LINKS.get(`i:${id}`, { type: 'arrayBuffer' })) return new Response(null, { status: 204, headers: cors(req) })
  const tam = Number(req.headers.get('content-length') || 0)
  if (tam > MAX_IMAGEM) return new Response('imagem grande demais', { status: 413, headers: cors(req) })
  const b = new Uint8Array(await req.arrayBuffer())
  if (b.length > MAX_IMAGEM || !pngValido(b)) return new Response('imagem inválida', { status: 400, headers: cors(req) })
  await env.LINKS.put(`i:${id}`, b, { expirationTtl: 60 * 60 * 24 * 180 })
  return new Response(null, { status: 201, headers: cors(req) })
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    const p = url.pathname
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors(req), 'access-control-allow-methods': 'POST, GET', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } })
    if (req.method === 'POST' && p === '/s') return criarLink(req, env)
    const mi = /^\/i\/([0-9A-Za-z]{7})(?:\.png)?$/.exec(p)
    if (req.method === 'POST' && mi) return guardarImagem(req, env, mi[1])
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('método não permitido', { status: 405 })
    if (p === '/' || p === '') return Response.redirect(CALC, 302)
    if (p === '/p') {
      const c = url.searchParams.get('c') || ''
      return Response.redirect(/^[\w.,=&%-]{1,400}$/.test(c) ? `${CALC}#${c}` : CALC, 302)
    }
    if (mi) {
      const b = await env.LINKS.get(`i:${mi[1]}`, { type: 'arrayBuffer' })
      if (!b) return new Response('não encontrado', { status: 404 })
      return new Response(b, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' } })
    }
    const mp = /^\/p\/([A-Za-z0-9_-]{8,200})$/.exec(p)
    if (mp) return responderLink(req, url, mp[1], null, false)
    const id = p.slice(1)
    if (ID.test(id)) {
      const token = await env.LINKS.get(`l:${id}`)
      if (!token) return Response.redirect(CALC, 302)
      const temImagem = ROBOS.test(req.headers.get('user-agent') || '') ? !!(await env.LINKS.get(`i:${id}`, { type: 'arrayBuffer' })) : false
      return responderLink(req, url, token, id, temImagem)
    }
    return new Response('não encontrado', { status: 404 })
  }
}
