import { createServer } from 'node:http'
import { readFile, writeFile, stat, mkdtemp, rm } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://iampiscis.github.io/pokepocket/assets/'
const LIMITE = 400 * 1024
const PREVIAS = [
  { html: 'ferramentas/previas/site.html', png: 'previa-site.png', paginas: ['index.html'] },
  { html: 'ferramentas/previas/nivel.html', png: 'previa-nivel.png', paginas: ['nivel/index.html'] },
  { html: 'ferramentas/previas/passivas.html', png: 'previa-passivas.png', paginas: ['passivas/index.html'] },
  { html: 'ferramentas/previas/posicionamento.html', png: 'previa-posicionamento.png', paginas: ['posicionamento/index.html'] },
  { html: 'ferramentas/previas/ferramentas.html', png: 'previa-ferramentas.png', paginas: ['ferramentas/inicio.html'] }
]
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
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

const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function trocarMeta(html, atributo, nome, valor) {
  const re = new RegExp(`(<meta ${atributo}="${nome.replace(/[:.]/g, '\\$&')}" content=")[^"]*(")`)
  if (!re.test(html)) throw new Error(`meta ${nome} não encontrada`)
  return html.replace(re, `$1${escapar(valor)}$2`)
}

async function main() {
  const chrome = acharChrome()
  const srv = await servir()
  const perfil = await mkdtemp(path.join(tmpdir(), 'previa-paginas-'))
  const carimbo = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
  try {
    const so = process.argv.slice(2)
    for (const p of PREVIAS.filter((x) => !so.length || so.includes(x.png))) {
      const temp = path.join(perfil, p.png)
      await capturar(chrome, `http://127.0.0.1:${srv.address().port}/${p.html}`, temp, perfil)
      const png = await readFile(temp)
      const d = dimensoes(png)
      if (!d || d.w !== 1200 || d.h !== 630) throw new Error(`${p.png} com tamanho inesperado: ${d ? `${d.w}x${d.h}` : 'não é PNG'}`)
      if (png.length > LIMITE) console.warn(`aviso: ${p.png} com ${Math.round(png.length / 1024)} KB (acima de 400 KB)`)
      await writeFile(path.join(RAIZ, 'assets', p.png), png)
      for (const pag of p.paginas) {
        const arq = path.join(RAIZ, pag)
        let html = await readFile(arq, 'utf8')
        html = trocarMeta(html, 'property', 'og:image', `${BASE}${p.png}?v=${carimbo}`)
        html = trocarMeta(html, 'name', 'twitter:image', `${BASE}${p.png}?v=${carimbo}`)
        await writeFile(arq, html)
      }
      console.log(`prévia gravada: assets/${p.png} (${Math.round(png.length / 1024)} KB, v=${carimbo})`)
    }
  } finally {
    srv.close()
    await rm(perfil, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error(`falhou: ${e.message}`)
  process.exit(1)
})
