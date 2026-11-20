import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ORIGEM = 'https://pokeidle.io'
const RAIZES = [
  'ginasios.mjs', 'evolucoes-ramificadas.mjs', 'evolucoes-cruzadas.mjs', 'megas.mjs', 'outland.mjs',
  'golpes-planilhas.mjs', 'golpes-especiais.mjs', 'herdar-base-outland.mjs', 'herdar-golpes-orre.mjs',
  'ajustes-especie-espelho.mjs', 'tm-elemental.mjs', 'teto-captura.mjs', 'linhagem-nota.mjs',
  'nota-pokemon.mjs', 'formas.mjs', 'cooldown-golpes.mjs'
]
const CATALOGOS = ['creatures', 'creatures-novos', 'creatures-outland-novos', 'creatures-formas', 'creatures-audit-overrides']
const OBRIGATORIOS = new Set(['creatures'])
const ATLAS = `${ORIGEM}/assets/site/assets/maps/marker-atlas.json`

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const destino = path.join(raiz, 'calculadora', 'jogo')

async function baixar(url, binario = false) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'calculadora-pokepocket' }, signal: AbortSignal.timeout(60000) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return binario ? Buffer.from(await r.arrayBuffer()) : await r.text()
    } catch (err) {
      if (tentativa >= 3) throw new Error(`${url}: ${err.message}`)
      await new Promise((ok) => setTimeout(ok, 2000 * tentativa))
    }
  }
}

const padraoImport = /((?:from\s+|import\s*\(\s*|import\s+)['"])(?:\.\/|\/shared\/)([\w.-]+\.mjs)(['"])/g
const importsDe = (texto) => [...texto.matchAll(padraoImport)].map((m) => m[2])
const relativizar = (texto) => texto.replace(padraoImport, (_, a, nome, b) => `${a}./${nome}${b}`)

async function baixarModulos() {
  const saida = new Map()
  const fila = [...RAIZES]
  while (fila.length) {
    const nome = fila.shift()
    if (saida.has(nome)) continue
    const texto = await baixar(`${ORIGEM}/shared/${nome}`)
    if (!/\bexport\b/.test(texto)) throw new Error(`módulo do jogo inválido: ${nome}`)
    if (/['"`]\/(?:assets|shared)\//.test(texto.replace(padraoImport, ''))) console.warn(`aviso: ${nome} usa caminho absoluto do jogo`)
    saida.set(nome, relativizar(texto))
    fila.push(...importsDe(texto))
  }
  return saida
}

async function baixarCatalogos() {
  const saida = new Map()
  for (const c of CATALOGOS) {
    let texto = null
    try {
      texto = await baixar(`${ORIGEM}/assets/${c}.json`)
    } catch (err) {
      if (OBRIGATORIOS.has(c)) throw err
      console.warn(`catálogo opcional ausente: ${c}`)
      continue
    }
    const json = JSON.parse(texto)
    if (c === 'creatures' && !json?.creatures?.length) throw new Error('catálogo do jogo vazio')
    saida.set(`${c}.json`, JSON.stringify(json))
  }
  return saida
}

function lerPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('atlas não é PNG')
  let pos = 8
  let largura = 0, altura = 0, profundidade = 0, tipoCor = 0, entrelacado = 0
  const dados = []
  while (pos < buf.length) {
    const tam = buf.readUInt32BE(pos)
    const tipo = buf.toString('latin1', pos + 4, pos + 8)
    const corpo = buf.subarray(pos + 8, pos + 8 + tam)
    if (tipo === 'IHDR') {
      largura = corpo.readUInt32BE(0)
      altura = corpo.readUInt32BE(4)
      profundidade = corpo[8]
      tipoCor = corpo[9]
      entrelacado = corpo[12]
    } else if (tipo === 'IDAT') dados.push(corpo)
    else if (tipo === 'IEND') break
    pos += 12 + tam
  }
  if (profundidade !== 8 || tipoCor !== 6 || entrelacado) throw new Error(`formato de PNG não suportado (${profundidade}/${tipoCor}/${entrelacado})`)
  const bruto = zlib.inflateSync(Buffer.concat(dados))
  const bpp = 4
  const linha = largura * bpp
  const px = Buffer.alloc(linha * altura)
  for (let y = 0; y < altura; y++) {
    const filtro = bruto[y * (linha + 1)]
    const ent = y * (linha + 1) + 1
    const sai = y * linha
    for (let x = 0; x < linha; x++) {
      const v = bruto[ent + x]
      const a = x >= bpp ? px[sai + x - bpp] : 0
      const b = y > 0 ? px[sai - linha + x] : 0
      const c = x >= bpp && y > 0 ? px[sai - linha + x - bpp] : 0
      let r
      if (filtro === 0) r = v
      else if (filtro === 1) r = v + a
      else if (filtro === 2) r = v + b
      else if (filtro === 3) r = v + ((a + b) >> 1)
      else {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
      }
      px[sai + x] = r & 255
    }
  }
  return { largura, altura, px }
}

async function baixarAtlas() {
  const j = JSON.parse(await baixar(ATLAS))
  const versao = String(j.version || '')
  if (!versao || !j.slots) throw new Error('atlas de sprites sem versão')
  const { largura, altura, px } = lerPng(await baixar(`${ORIGEM}/assets/site/assets/maps/marker-atlas.png?v=${versao}`, true))
  const cel = Number(j.cell) || 64
  const slots = {}
  const caixas = {}
  for (const [look, pos] of Object.entries(j.slots)) {
    slots[look] = [pos[0], pos[1]]
    const ox = pos[0] * cel
    const oy = pos[1] * cel
    let x0 = cel, y0 = cel, x1 = -1, y1 = -1
    for (let y = 0; y < cel && oy + y < altura; y++) {
      for (let x = 0; x < cel && ox + x < largura; x++) {
        if (px[((oy + y) * largura + ox + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x
          if (y < y0) y0 = y
          if (x > x1) x1 = x
          if (y > y1) y1 = y
        }
      }
    }
    if (x1 >= 0) caixas[look] = [x0, y0, x1 + 1, y1 + 1]
  }
  return JSON.stringify({ version: versao, url: `${ORIGEM}/assets/site/assets/maps/marker-atlas.png?v=${versao}`, cell: cel, cols: Number(j.cols) || 16, rows: Number(j.rows) || Math.ceil(altura / cel), slots, caixas })
}

async function versaoDoJogo() {
  try {
    return /app\.js\?v=([\d.]+)/.exec(await baixar(`${ORIGEM}/app`))?.[1] || null
  } catch {
    return null
  }
}

const hash = (texto) => crypto.createHash('sha256').update(texto).digest('hex').slice(0, 16)

function lerVersaoAtual() {
  try {
    return JSON.parse(fs.readFileSync(path.join(destino, 'versao.json'), 'utf8'))
  } catch {
    return null
  }
}

async function principal() {
  const [modulos, catalogos, atlas, versaoJogo] = await Promise.all([baixarModulos(), baixarCatalogos(), baixarAtlas(), versaoDoJogo()])
  const arquivos = new Map()
  for (const [nome, texto] of modulos) arquivos.set(nome, texto)
  for (const [nome, texto] of catalogos) arquivos.set(nome, texto)
  arquivos.set('marker-atlas.json', atlas)

  const anterior = lerVersaoAtual()
  const hashes = Object.fromEntries([...arquivos].sort(([a], [b]) => a.localeCompare(b)).map(([nome, texto]) => [nome, hash(texto)]))
  const igual = anterior && JSON.stringify(anterior.arquivos) === JSON.stringify(hashes) && [...arquivos.keys()].every((n) => fs.existsSync(path.join(destino, n)))
  if (igual && anterior.versaoJogo === versaoJogo) {
    console.log(`sem mudanças (jogo ${versaoJogo || '?'})`)
    return
  }

  fs.mkdirSync(destino, { recursive: true })
  for (const nome of fs.readdirSync(destino)) {
    if (nome !== 'versao.json' && !arquivos.has(nome)) fs.rmSync(path.join(destino, nome), { recursive: true, force: true })
  }
  for (const [nome, texto] of arquivos) {
    const arq = path.join(destino, nome)
    if (!fs.existsSync(arq) || fs.readFileSync(arq, 'utf8') !== texto) fs.writeFileSync(arq, texto)
  }
  const atualizadoEm = igual ? anterior.atualizadoEm : new Date().toISOString()
  const versao = { versaoJogo, atualizadoEm, modulos: [...modulos.keys()].sort(), catalogos: [...catalogos.keys()].map((n) => n.replace(/\.json$/, '')), arquivos: hashes }
  fs.writeFileSync(path.join(destino, 'versao.json'), `${JSON.stringify(versao, null, 1)}\n`)
  console.log(`jogo ${versaoJogo || '?'}: ${modulos.size} módulos, ${catalogos.size} catálogos, atlas atualizado`)
}

principal().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
