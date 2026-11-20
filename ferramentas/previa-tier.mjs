import { createServer } from 'node:http'
import { readFile, writeFile, stat, mkdtemp, rm } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SAIDA = path.join(RAIZ, 'assets', 'previa-tier.png')
const PAGINA = path.join(RAIZ, 'tier', 'index.html')
const URL_IMAGEM = 'https://iampiscis.github.io/pokepocket/assets/previa-tier.png'
const LIMITE = 400 * 1024
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const CHROMES = [process.env.CHROME_BIN, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean)

function acharChrome() {
  for (const c of CHROMES) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' })
    if (r.status === 0) return c
  }
  throw new Error('Chrome não encontrado (defina CHROME_BIN)')
}

function servir() {
  const srv = createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      let arq = path.join(RAIZ, rel)
      if (!arq.startsWith(RAIZ)) throw new Error('fora')
      if ((await stat(arq)).isDirectory()) arq = path.join(arq, 'index.html')
      const corpo = await readFile(arq)
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
      res.end(corpo)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)))
}

function capturar(chrome, url, destino, perfil) {
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-device-scale-factor=1', `--user-data-dir=${perfil}`, '--window-size=1200,630', '--virtual-time-budget=8000', `--screenshot=${destino}`, url]
  if (process.platform === 'linux') args.unshift('--no-sandbox')
  return new Promise((ok, erro) => {
    const p = spawn(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let log = ''
    p.stderr.on('data', (d) => { log += d })
    const limite = setTimeout(() => { p.kill('SIGKILL'); erro(new Error('Chrome demorou demais')) }, 60000)
    p.on('exit', (c) => { clearTimeout(limite); c === 0 ? ok() : erro(new Error(`Chrome saiu com ${c}: ${log.slice(-400)}`)) })
  })
}

function dimensoes(png) {
  if (png.toString('ascii', 1, 4) !== 'PNG') return null
  return { w: png.readUInt32BE(16), h: png.readUInt32BE(20) }
}

const dataSP = (d, op) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', ...op }).format(d)
const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function trocarMeta(html, atributo, nome, valor) {
  const re = new RegExp(`(<meta ${atributo}="${nome.replace(/[:.]/g, '\\$&')}" content=")[^"]*(")`)
  if (!re.test(html)) throw new Error(`meta ${nome} não encontrada`)
  return html.replace(re, `$1${escapar(valor)}$2`)
}

async function atualizarPagina() {
  const dados = JSON.parse(await readFile(path.join(RAIZ, 'tier', 'tier.json'), 'utf8'))
  const j = dados.janelas?.dia || dados
  const g = new Date(dados.geradoEm)
  const ref = Number.isNaN(g.getTime()) ? new Date() : g
  const carimbo = dataSP(ref, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '')
  const topo = (j.tiers || []).find((t) => t.itens?.length)
  const nomes = (topo?.itens || []).slice(0, 3).map((p) => p.nome)
  const resto = (topo?.itens?.length || 0) > nomes.length ? '…' : ''
  const descricao = nomes.length
    ? `${topo.tier} hoje: ${nomes.join(', ')}${resto} · atualizado todo dia ao meio-dia`
    : 'Os shiny mais fortes do ranqueado do Pokéidle, atualizados todo dia ao meio-dia.'
  let html = await readFile(PAGINA, 'utf8')
  html = trocarMeta(html, 'property', 'og:image', `${URL_IMAGEM}?d=${carimbo}`)
  html = trocarMeta(html, 'name', 'twitter:image', `${URL_IMAGEM}?d=${carimbo}`)
  html = trocarMeta(html, 'property', 'og:description', descricao)
  await writeFile(PAGINA, html)
  return { carimbo, descricao }
}

async function main() {
  const chrome = acharChrome()
  const srv = await servir()
  const perfil = await mkdtemp(path.join(tmpdir(), 'previa-tier-'))
  const temp = path.join(perfil, 'previa.png')
  try {
    const url = `http://127.0.0.1:${srv.address().port}/tier/previa.html`
    await capturar(chrome, url, temp, perfil)
    const png = await readFile(temp)
    const d = dimensoes(png)
    if (!d || d.w !== 1200 || d.h !== 630) throw new Error(`imagem com tamanho inesperado: ${d ? `${d.w}x${d.h}` : 'não é PNG'}`)
    if (png.length > LIMITE) console.warn(`aviso: prévia com ${Math.round(png.length / 1024)} KB (acima de 400 KB)`)
    await writeFile(SAIDA, png)
    const { carimbo, descricao } = await atualizarPagina()
    console.log(`prévia gravada: ${path.relative(RAIZ, SAIDA)} (${Math.round(png.length / 1024)} KB, d=${carimbo})`)
    console.log(`descrição: ${descricao}`)
  } finally {
    srv.close()
    await rm(perfil, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error(`falhou: ${e.message}`)
  process.exit(1)
})
