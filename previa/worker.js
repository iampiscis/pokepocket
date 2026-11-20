const CALC = 'https://iampiscis.github.io/pokepocket/calculadora/'
const IMAGEM = 'https://iampiscis.github.io/pokepocket/assets/icone.png'
const ROBOS = /discordbot|twitterbot|facebookexternalhit|whatsapp|telegrambot|slackbot|linkedinbot|embedly|skypeuripreview|redditbot|googlebot|bingbot|applebot|vkshare|pinterest|mastodon|bluesky|cardyb/i
const FAIXAS = [[0, 'Baixo', '#f87171'], [300, 'Regular', '#fb923c'], [500, 'Bom', '#facc15'], [700, 'Excelente', '#4ade80']]

const fmt = new Intl.NumberFormat('pt-BR')
const fmt1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const faixa = (v) => [...FAIXAS].reverse().find(([de]) => v >= de) || FAIXAS[0]

function numero(q, k, min, max) {
  const v = Number(q.get(k))
  return Number.isFinite(v) && v >= min && v <= max ? v : null
}

function ler(url) {
  const q = url.searchParams
  const nome = (q.get('n') || '').replace(/[^\p{L}\p{N} .'():-]/gu, '').trim().slice(0, 40) || 'Pokémon'
  const codigo = (q.get('c') || '').slice(0, 400)
  return {
    nome,
    shiny: q.get('s') === '1',
    nivel: numero(q, 'nv', 1, 100000),
    potencia: numero(q, 'po', 1, 5),
    pvp: numero(q, 'pvp', 0, 1000),
    pve: numero(q, 'pve', 0, 1000),
    nota: numero(q, 'no', 0, 10),
    justo: numero(q, 'j', 0, 1e12),
    codigo: /^[\w.,=&%-]*$/.test(codigo) ? codigo : ''
  }
}

function pagina(d, destino, proprio) {
  const titulo = [`${d.nome}${d.shiny ? ' shiny' : ''}`, d.nivel != null ? `Nv ${fmt.format(d.nivel)}` : null, d.potencia != null ? `P${d.potencia}` : null].filter(Boolean).join(' · ')
  const linhas = [
    d.pvp != null ? `Score PvP ${fmt.format(d.pvp)} · ${faixa(d.pvp)[1]}` : null,
    d.pve != null ? `Score PvE ${fmt.format(d.pve)} · ${faixa(d.pve)[1]}` : null,
    d.nota != null ? `Nota ${fmt1.format(d.nota)}/10` : null,
    d.justo != null ? `Preço justo ${fmt.format(Math.round(d.justo))} gemas` : null
  ].filter(Boolean)
  const descricao = linhas.length ? linhas.join('\n') : 'Simule nível, refino, potência e Z-Move.'
  const cor = d.pvp != null ? faixa(d.pvp)[2] : '#ffd34d'
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
<meta property="og:image" content="${IMAGEM}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="${cor}">
<meta http-equiv="refresh" content="0;url=${esc(destino)}">
</head>
<body><a href="${esc(destino)}">Abrir na calculadora</a></body>
</html>`
}

export default {
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/' || url.pathname === '') return Response.redirect(CALC, 302)
    if (url.pathname !== '/p') return new Response('não encontrado', { status: 404 })
    const d = ler(url)
    const destino = d.codigo ? `${CALC}#${d.codigo}` : CALC
    if (!ROBOS.test(req.headers.get('user-agent') || '')) return Response.redirect(destino, 302)
    return new Response(pagina(d, destino, url.href), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=86400' } })
  }
}
