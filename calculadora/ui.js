import * as motor from './motor.js'

const STATS = [['hp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['spAtk', 'SP.ATK'], ['spDef', 'SP.DEF'], ['speed', 'VEL']]
const TIPOS = ['NORMAL', 'FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY']
const NOME_TIPO = { NORMAL: 'Normal', FIRE: 'Fogo', WATER: 'Água', ELECTRIC: 'Elétrico', GRASS: 'Planta', ICE: 'Gelo', FIGHTING: 'Lutador', POISON: 'Veneno', GROUND: 'Terra', FLYING: 'Voador', PSYCHIC: 'Psíquico', BUG: 'Inseto', ROCK: 'Pedra', GHOST: 'Fantasma', DRAGON: 'Dragão', DARK: 'Sombrio', STEEL: 'Aço', FAIRY: 'Fada' }
const COR_TIPO = { NORMAL: '#9a9a6e', FIRE: '#e8742a', WATER: '#4f7fe6', ELECTRIC: '#d9b51c', GRASS: '#5fae38', ICE: '#5ec2be', FIGHTING: '#b8302a', POISON: '#9a3c98', GROUND: '#c9a24c', FLYING: '#8f78e0', PSYCHIC: '#ec4b7d', BUG: '#94a61a', ROCK: '#a8952f', GHOST: '#6a4f8f', DRAGON: '#6a35ea', DARK: '#6a5345', STEEL: '#8c8cae', FAIRY: '#d0739f' }
const FAIXAS = [[0, 'Baixo', '#f87171'], [300, 'Regular', '#fb923c'], [500, 'Bom', '#facc15'], [700, 'Excelente', '#4ade80']]
const NIVEL_PADRAO = 2000
const NIVEL_MAX = 10000
const CHAVE = 'pokepocket-calc'

const ICONES = {
  nivel: '<path d="M5 21V4"/><path d="M5 4.5c3-1.6 5.5 1.6 8.5 0s4.5-.5 5.5 0v8c-1 .5-2.5 1.6-5.5 0s-5.5 1.6-8.5 0"/>',
  forma: '<path d="M12 3.5l7.5 4.3v8.4L12 20.5l-7.5-4.3V7.8z"/><path d="M12 15.5v-7M8.8 11.8 12 8.5l3.2 3.3"/>',
  nascimento: '<path d="M12 3.5c3.6 0 6.5 4.7 6.5 9.2A6.5 6.5 0 0 1 5.5 12.7C5.5 8.2 8.4 3.5 12 3.5z"/><path d="M9.5 13.5l1.8 1.8 3.4-3.8"/>',
  zmove: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 8h7l-7 8h7"/>',
  refino: '<path d="M7 3.5h10l3 5-8 12-8-12z"/><path d="M4 8.5h16M9.5 3.5 12 8.5l2.5-5M12 8.5v12"/>',
  pvp: '<path d="M4 4l7.5 7.5M20 4l-7.5 7.5M4.5 15.5l4 4M19.5 15.5l-4 4M6 18l-2 2M18 18l2 2"/>',
  pve: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  nota: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  poderPvp: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
  poderPve: '<path d="M3 19.5 9 9l4 6 2.5-3.5 5.5 8z"/><circle cx="16.5" cy="6" r="2"/>',
  golpe: '<path d="M4.5 19.5 14 10M14 10l1.5-5.5L20 3l-1.5 4.5L13 9zM9 15l-3-3M7.5 13.5 4 10"/>',
  stats: '<path d="M5 20V11M10 20V5M15 20v-7M20 20V8"/>',
  estrela: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  area: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>'
}

const fmt = new Intl.NumberFormat('pt-BR')
const fmt1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const fmt2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCurto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const ehNum = (v) => v != null && v !== '' && Number.isFinite(Number(v))
const grande = (v) => (!ehNum(v) ? '—' : Math.abs(v) >= 100000 ? fmtCurto.format(v) : fmt.format(Math.round(v)))
const inteiro = (v, min, max) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)))
const nomeTipo = (t) => NOME_TIPO[String(t || '').toUpperCase()] || t || ''

const $ = (id) => document.getElementById(id)

function el(tag, props = {}, filhos = []) {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue
    if (k === 'class') n.className = v
    else if (k === 'text') n.textContent = v
    else if (k === 'style') n.style.cssText = v
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v)
    else n.setAttribute(k, v === true ? '' : String(v))
  }
  for (const f of [].concat(filhos)) if (f != null && f !== false) n.append(f)
  return n
}

function ico(k, px = 20, classe = 'ico') {
  const s = el('span', { class: classe, 'aria-hidden': 'true' })
  s.innerHTML = `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[k]}</svg>`
  return s
}

const st = { pronto: false, hoje: null, nomeHoje: '', sim: null, formas: [], res: null, seq: 0, timer: 0, ultimoHash: '', precos: new Map(), ui: {} }

function normal(x = {}) {
  const ivs = {}
  const refino = {}
  for (const [k] of STATS) {
    ivs[k] = inteiro(x.ivs?.[k], 0, 32)
    refino[k] = inteiro(x.refino?.[k], 0, 999)
  }
  const q = Number(x.quality)
  const tm = String(x.tmElemental || '').toUpperCase()
  return {
    speciesId: Number(x.speciesId) || null,
    level: inteiro(x.level || 1, 1, NIVEL_MAX),
    potencia: inteiro(x.potencia || 1, 1, 5),
    quality: q > 0 ? Math.round(q * 100) / 100 : 1,
    shiny: !!x.shiny,
    ivs,
    refino,
    tmElemental: TIPOS.includes(tm) ? tm : null,
    tmFisico: !!x.tmFisico,
    tmAoe: !!x.tmAoe
  }
}

const pkDe = (x) => ({ speciesId: x.speciesId, level: x.level, potencia: x.potencia, quality: x.quality, shiny: x.shiny, ivs: { ...x.ivs }, refino: { ...x.refino }, tmElemental: x.tmElemental, tmFisico: x.tmFisico, tmAoe: x.tmAoe })
const padraoSim = (h) => ({ ...pkDe(h), level: Math.max(h.level, NIVEL_PADRAO) })
const somaRefino = (r) => STATS.reduce((t, [k]) => t + (r?.[k] || 0), 0)
const somaIvs = (r) => STATS.reduce((t, [k]) => t + (r?.[k] || 0), 0)

function especie(sid) {
  try { return motor.especie(Number(sid)) || null } catch { return null }
}

function lookDe(f, shiny) {
  if (!f) return null
  return shiny && f.lookShiny != null && f.lookShiny !== f.looktype ? [f.lookShiny, f.looktype] : f.looktype
}

function sprite(looktype, tam) {
  const caixa = el('span', { class: 'sprite', style: `width:${tam}px;height:${tam}px`, 'aria-hidden': 'true' })
  let s = null
  for (const lt of [].concat(looktype)) {
    if (lt == null) continue
    try { s = motor.sprite(lt) } catch { s = null }
    if (s?.url) break
  }
  if (!s?.url) {
    caixa.classList.add('sem')
    return caixa
  }
  const cel = Number(s.cell) || 32
  const [x0, y0, x1, y1] = Array.isArray(s.caixa) && s.caixa.length === 4 ? s.caixa : [0, 0, cel, cel]
  const w = Math.max(1, x1 - x0)
  const h = Math.max(1, y1 - y0)
  const esc = (tam * 0.92) / Math.max(w, h)
  const img = el('i', { style: `width:${w}px;height:${h}px;background-position:${-((Number(s.x) || 0) + x0)}px ${-((Number(s.y) || 0) + y0)}px;transform:translate(-50%,-50%) scale(${esc.toFixed(4)})` })
  img.style.backgroundImage = `url("${String(s.url).replace(/"/g, '%22')}")`
  caixa.append(img)
  return caixa
}

function tiposDe(lista) {
  const tipos = (lista || []).filter(Boolean)
  if (!tipos.length) return null
  return el('span', { class: 'tipos' }, tipos.map((t) => el('span', { class: 'tipo', style: `--c:${COR_TIPO[String(t).toUpperCase()] || '#777'}`, text: nomeTipo(t) })))
}

function passos({ valor, min, max, passo = 1, casas = 0, rotulo, aoMudar, classe = '' }) {
  const mostrar = (v) => (casas ? v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) : fmt.format(v))
  const ler = (t) => {
    const s = String(t).trim()
    if (!s) return NaN
    return casas ? Number(s.replace(',', '.').replace(/[^\d.]/g, '')) : Number(s.replace(/\D/g, ''))
  }
  const lim = (v) => Math.min(max, Math.max(min, casas ? Math.round(v * 10 ** casas) / 10 ** casas : Math.round(v)))
  let atual = lim(Number(valor) || min)
  const campo = el('input', { type: 'text', class: 'campo', inputmode: casas ? 'decimal' : 'numeric', autocomplete: 'off', 'aria-label': rotulo, value: mostrar(atual) })
  const aplicar = (v) => {
    const n = lim(v)
    campo.value = mostrar(n)
    if (n !== atual) {
      atual = n
      aoMudar(n)
    }
  }
  campo.addEventListener('input', () => {
    const v = ler(campo.value)
    if (!Number.isFinite(v)) return
    const n = lim(v)
    if (n === v && n !== atual) {
      atual = n
      aoMudar(n)
    }
  })
  campo.addEventListener('change', () => {
    const v = ler(campo.value)
    aplicar(Number.isFinite(v) ? v : atual)
  })
  campo.addEventListener('focus', () => { try { campo.select() } catch {} })
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') campo.blur()
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      aplicar(atual + (e.key === 'ArrowUp' ? passo : -passo))
    }
  })
  const bt = (d, txt) => el('button', { type: 'button', class: 'passo', 'aria-label': `${d > 0 ? 'Mais' : 'Menos'} ${rotulo}`, text: txt, onclick: () => aplicar(atual + d) })
  const raiz = el('div', { class: `passos ${classe}`.trim() }, [bt(-passo, '−'), campo, bt(passo, '+')])
  raiz.definir = (v) => {
    atual = lim(v)
    campo.value = mostrar(atual)
  }
  return raiz
}

function seg(opcoes, atual, aoMudar, rotulo) {
  const bts = opcoes.map(([k, txt]) => el('button', { type: 'button', 'aria-pressed': String(k === atual), text: txt }))
  const definir = (k) => bts.forEach((b, i) => b.setAttribute('aria-pressed', String(opcoes[i][0] === k)))
  bts.forEach((b, i) => b.addEventListener('click', () => {
    definir(opcoes[i][0])
    aoMudar(opcoes[i][0])
  }))
  const raiz = el('div', { class: 'seg', role: 'group', 'aria-label': rotulo }, bts)
  raiz.definir = definir
  return raiz
}

function alternar(rotulo, icone, ligado, aoMudar, classe = '') {
  const b = el('button', { type: 'button', class: `chip ${classe}`.trim(), 'aria-pressed': String(ligado) }, [ico(icone, 16, 'ico-chip'), el('span', { text: rotulo })])
  b.addEventListener('click', () => {
    const v = b.getAttribute('aria-pressed') !== 'true'
    b.setAttribute('aria-pressed', String(v))
    aoMudar(v)
  })
  b.definir = (v) => b.setAttribute('aria-pressed', String(!!v))
  return b
}

function bloco(icone, titulo, filhos, resumo = '') {
  const r = el('span', { class: 'resumo', text: resumo })
  const no = el('section', { class: 'bloco vao' }, [el('div', { class: 'bloco-cab' }, [ico(icone), el('h3', { text: titulo }), r]), ...filhos])
  no.resumo = r
  return no
}

function celula(rotulo, controle) {
  return el('label', { class: 'celula' }, [el('span', { text: rotulo }), controle])
}

function salvarLocal(txt) {
  try { localStorage.setItem(CHAVE, txt) } catch {}
}

function lerLocal() {
  try { return localStorage.getItem(CHAVE) || '' } catch { return '' }
}

function codificar() {
  const h = st.hoje
  const s = st.sim
  const p = new URLSearchParams()
  const lista = (r) => STATS.map(([k]) => r[k] || 0).join('.')
  p.set('e', h.speciesId)
  p.set('n', h.level)
  p.set('p', h.potencia)
  p.set('q', h.quality)
  if (h.shiny) p.set('s', '1')
  p.set('iv', lista(h.ivs))
  if (somaRefino(h.refino)) p.set('r', lista(h.refino))
  if (s.speciesId !== h.speciesId) p.set('f', s.speciesId)
  p.set('sn', s.level)
  if (s.potencia !== h.potencia) p.set('sp', s.potencia)
  if (s.shiny !== h.shiny) p.set('ss', s.shiny ? '1' : '0')
  if (somaRefino(s.refino) || somaRefino(h.refino)) p.set('sr', lista(s.refino))
  if (s.tmElemental) {
    p.set('z', s.tmElemental.toLowerCase())
    if (s.tmFisico) p.set('zf', '1')
    if (s.tmAoe) p.set('za', '1')
  }
  return p.toString()
}

function decodificar(txt) {
  const p = new URLSearchParams(String(txt || '').replace(/^#/, ''))
  const sid = Number(p.get('e'))
  if (!(sid > 0) || !especie(sid)) return null
  const lista = (v) => {
    const a = String(v || '').split('.').map(Number)
    return Object.fromEntries(STATS.map(([k], i) => [k, a[i] || 0]))
  }
  const hoje = { speciesId: sid, level: Number(p.get('n')) || 100, potencia: Number(p.get('p')) || 1, quality: Number(p.get('q')) || 1, shiny: p.get('s') === '1', ivs: lista(p.get('iv')), refino: lista(p.get('r')) }
  const sim = {
    ...hoje,
    speciesId: Number(p.get('f')) || sid,
    level: Number(p.get('sn')) || Math.max(hoje.level, NIVEL_PADRAO),
    potencia: p.has('sp') ? Number(p.get('sp')) : hoje.potencia,
    shiny: p.has('ss') ? p.get('ss') === '1' : hoje.shiny,
    refino: lista(p.get('sr')),
    tmElemental: p.get('z') ? p.get('z').toUpperCase() : null,
    tmFisico: p.get('zf') === '1',
    tmAoe: p.get('za') === '1'
  }
  return { hoje, sim }
}

function gravarEstado() {
  if (!st.hoje) return
  const cod = codificar()
  st.ultimoHash = cod
  salvarLocal(cod)
  try { history.replaceState(null, '', `#${cod}`) } catch {}
}

function aplicarCodigo(txt) {
  const d = decodificar(txt)
  if (!d) return false
  definirHoje(d.hoje, d.sim)
  return true
}

function carregarFormas(sid) {
  let lista = []
  try { lista = motor.formas(sid) || [] } catch {}
  const visto = new Set()
  const out = []
  for (const f of lista) {
    const id = Number(f?.speciesId)
    if (!(id > 0) || visto.has(id)) continue
    visto.add(id)
    out.push({ ...f, speciesId: id })
  }
  if (!visto.has(sid)) {
    const e = especie(sid)
    if (e) out.unshift(e)
  }
  return out
}

function formaSim() {
  return st.formas.find((f) => f.speciesId === st.sim.speciesId) || especie(st.sim.speciesId)
}

function definirHoje(h, simSalvo = null) {
  st.hoje = normal(h)
  const e = especie(st.hoje.speciesId)
  st.nomeHoje = e?.nome || h.nome || 'Pokémon'
  st.formas = carregarFormas(st.hoje.speciesId)
  st.sim = simSalvo ? normal({ ...simSalvo, ivs: st.hoje.ivs, quality: st.hoje.quality }) : padraoSim(st.hoje)
  if (!st.formas.some((f) => f.speciesId === st.sim.speciesId)) st.sim.speciesId = st.hoje.speciesId
  st.res = null
  montarEditorHoje()
  montarSimulacao()
  pintarIdentidade()
  $('cartao-sim').hidden = false
  $('vazio').hidden = true
  agendar(true)
}

function hojeMudou(campo, antes) {
  const h = st.hoje
  const s = st.sim
  s.ivs = { ...h.ivs }
  s.quality = h.quality
  if (campo === 'potencia' && s.potencia === antes) s.potencia = h.potencia
  if (campo === 'shiny' && s.shiny === antes) s.shiny = h.shiny
  if (campo === 'level' && s.level < h.level) s.level = h.level
  montarSimulacao()
  pintarIdentidade()
  agendar()
}

function montarEditorHoje() {
  const h = st.hoje
  const caixa = $('editor-hoje')
  if (!h) return caixa.replaceChildren()
  const muda = (campo) => (v) => {
    const antes = h[campo]
    h[campo] = v
    hojeMudou(campo, antes)
  }
  const nivel = passos({ valor: h.level, min: 1, max: NIVEL_MAX, passo: 10, rotulo: 'nível de hoje', aoMudar: muda('level') })
  const qual = passos({ valor: h.quality, min: 0.5, max: 2, passo: 0.01, casas: 2, rotulo: 'qualidade', aoMudar: muda('quality') })
  const pot = seg([1, 2, 3, 4, 5].map((n) => [n, `P${n}`]), h.potencia, muda('potencia'), 'Potência de hoje')
  const shiny = alternar('Shiny', 'estrela', h.shiny, muda('shiny'), 'shiny')
  const ivs = STATS.map(([k, rot]) => celula(rot, passos({ valor: h.ivs[k], min: 0, max: 32, rotulo: `IV de ${rot}`, aoMudar: (v) => { h.ivs[k] = v; hojeMudou('ivs') } })))
  caixa.replaceChildren(
    el('div', { class: 'duas-col' }, [celula('Nível', nivel), celula('Qualidade', qual)]),
    el('div', { class: 'linha' }, [el('div', { style: 'flex:1 1 220px;min-width:0' }, [pot]), shiny]),
    el('div', {}, [el('span', { class: 'sub', text: 'IVs (0 a 32)' }), el('div', { class: 'grade6' }, ivs)])
  )
}

function pintarIdentidade() {
  const h = st.hoje
  const box = $('identidade')
  if (!h) return (box.hidden = true)
  const e = especie(h.speciesId)
  const dado = (rot, v) => el('span', {}, [el('small', { text: rot }), el('b', { text: v })])
  st.ui.notaHoje = el('b', { text: st.res?.h?.nota != null ? fmt1.format(st.res.h.nota) : '—' })
  box.replaceChildren(
    sprite(lookDe(e, h.shiny), 76),
    el('div', { style: 'min-width:0' }, [
      el('div', { class: 'id-nome' }, [el('strong', { text: st.nomeHoje }), h.shiny ? ico('estrela', 18, 'estrela') : null, el('span', { class: 'id-hoje', text: 'Hoje' })]),
      el('div', { style: 'margin-top:4px' }, [tiposDe(e?.tipos)]),
      el('div', { class: 'id-dados' }, [
        dado('Nv', fmt.format(h.level)),
        dado('Pot', `P${h.potencia}`),
        dado('Qual', fmt2.format(h.quality)),
        dado('IVs', `${fmt.format(somaIvs(h.ivs))}/192`),
        el('span', {}, [el('small', { text: 'Nota' }), st.ui.notaHoje])
      ])
    ])
  )
  box.hidden = false
}

function montarSimulacao() {
  const h = st.hoje
  const s = st.sim
  const caixa = $('controles')
  const ui = (st.ui.sim = {})
  const mudou = () => {
    resumos()
    agendar()
  }

  const regua = el('input', { type: 'range', class: 'regua', min: 1, max: NIVEL_MAX, step: 1, value: s.level, 'aria-label': 'Nível simulado' })
  const nivel = passos({ valor: s.level, min: 1, max: NIVEL_MAX, passo: 100, rotulo: 'nível simulado', classe: 'largo', aoMudar: (v) => { s.level = v; regua.value = String(v); mudou() } })
  regua.addEventListener('input', () => { s.level = Number(regua.value); nivel.definir(s.level); mudou() })
  ui.nivel = bloco('nivel', 'Nível', [
    nivel,
    regua
  ])

  let secForma = null
  if (st.formas.length > 1) {
    const bts = st.formas.map((f) => {
      const b = el('button', { type: 'button', class: `forma${f.mega ? ' mega' : ''}`, 'aria-pressed': String(f.speciesId === s.speciesId) }, [sprite(lookDe(f, s.shiny), 40), el('span', { text: f.nome })])
      b.addEventListener('click', () => {
        s.speciesId = f.speciesId
        bts.forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
        mudou()
      })
      return b
    })
    secForma = bloco('forma', 'Forma', [el('div', { class: 'formas' }, bts)])
    ui.forma = secForma
  }

  const pot = seg([1, 2, 3, 4, 5].map((n) => [n, `P${n}`]), s.potencia, (v) => { s.potencia = v; mudou() }, 'Potência simulada')
  const shiny = alternar('Shiny', 'estrela', s.shiny, (v) => {
    s.shiny = v
    if (secForma) secForma.querySelectorAll('.forma').forEach((b, i) => b.replaceChild(sprite(lookDe(st.formas[i], v), 40), b.firstChild))
    mudou()
  }, 'shiny')
  ui.nasc = bloco('nascimento', 'Potência', [el('div', { class: 'linha' }, [el('div', { style: 'flex:1 1 220px;min-width:0' }, [pot]), shiny])])

  const tipoSel = el('select', { 'aria-label': 'Tipo do Z-Move' }, TIPOS.map((t) => el('option', { value: t, text: nomeTipo(t) })))
  const cat = seg([['e', 'Especial'], ['f', 'Físico']], s.tmFisico ? 'f' : 'e', (k) => { s.tmFisico = k === 'f'; mudou() }, 'Categoria do Z-Move')
  const aoe = alternar('Em área', 'area', s.tmAoe, (v) => { s.tmAoe = v; mudou() })
  const detalhe = el('div', {}, [el('div', { class: 'z-detalhe' }, [tipoSel, cat]), el('div', { style: 'margin-top:10px' }, [aoe])])
  tipoSel.value = s.tmElemental || 'NORMAL'
  tipoSel.addEventListener('change', () => { s.tmElemental = tipoSel.value; mudou() })
  detalhe.hidden = !s.tmElemental
  const z = seg([['sem', 'Sem Z-Move'], ['com', 'Com Z-Move']], s.tmElemental ? 'com' : 'sem', (k) => {
    if (k === 'com') {
      const tipos = st.res?.s?.tipos || formaSim()?.tipos || []
      s.tmElemental = s.tmElemental || (TIPOS.includes(String(tipos[0]).toUpperCase()) ? String(tipos[0]).toUpperCase() : 'NORMAL')
      tipoSel.value = s.tmElemental
    } else s.tmElemental = null
    detalhe.hidden = !s.tmElemental
    mudou()
  }, 'Z-Move')
  ui.z = bloco('zmove', 'Z-Move', [z, detalhe])

  const refino = STATS.map(([k, rot]) => celula(rot, passos({ valor: s.refino[k], min: 0, max: 999, rotulo: `refino de ${rot}`, aoMudar: (v) => { s.refino[k] = v; mudou() } })))
  ui.refino = bloco('refino', 'Refino', [el('div', { class: 'grade6' }, refino)])

  caixa.replaceChildren(ui.nivel, ...(secForma ? [secForma] : []), ui.nasc, ui.z, ui.refino)
  resumos()
}

function resumos() {
  const ui = st.ui.sim
  const h = st.hoje
  const s = st.sim
  if (!ui) return
  ui.nivel.resumo.textContent = s.level === h.level ? `Nv ${fmt.format(s.level)}` : `${fmt.format(h.level)} → ${fmt.format(s.level)}`
  if (ui.forma) ui.forma.resumo.textContent = formaSim()?.nome || ''
  const nasc = []
  if (s.potencia !== h.potencia) nasc.push(`P${h.potencia} → P${s.potencia}`)
  else nasc.push(`P${s.potencia}`)
  if (s.shiny) nasc.push('shiny')
  ui.nasc.resumo.textContent = nasc.join(' · ')
  ui.z.resumo.textContent = s.tmElemental ? `${nomeTipo(s.tmElemental)} · ${s.tmFisico ? 'físico' : 'especial'}${s.tmAoe ? ' · área' : ''}` : 'nenhum'
  const ref = somaRefino(s.refino)
  ui.refino.resumo.textContent = ref ? `+${fmt.format(ref)}` : 'nenhum'
}

function agendar(imediato = false) {
  clearTimeout(st.timer)
  $('resultado').classList.add('calculando')
  st.timer = setTimeout(calcular, imediato ? 0 : 200)
}

async function calcular() {
  if (!st.hoje) return
  const seq = ++st.seq
  const pkH = pkDe(st.hoje)
  const pkS = pkDe(st.sim)
  let rh, rs
  try {
    ;[rh, rs] = await Promise.all([Promise.resolve(motor.simular(pkH)), Promise.resolve(motor.simular(pkS))])
  } catch (err) {
    rh = { erro: err?.message || 'Não consegui calcular.' }
  }
  if (seq !== st.seq) return
  $('resultado').classList.remove('calculando')
  gravarEstado()
  const erro = rh?.erro || rs?.erro || (!rh || !rs ? 'Não consegui calcular este pokémon.' : '')
  if (erro) {
    st.res = null
    $('erro-res').textContent = erro
    $('erro-res').hidden = false
    $('resultado').hidden = true
    return
  }
  $('erro-res').hidden = true
  st.res = { h: rh, s: rs }
  $('resultado').hidden = false
  if (st.ui.notaHoje) st.ui.notaHoje.textContent = ehNum(rh.nota) ? fmt1.format(rh.nota) : '—'
  pintarSimMini()
  pintarScore()
  pintarKpis()
  pintarGolpe()
  pintarStats()
  pintarPreco(seq, pkH, rh, pkS, rs)
}

function pintarSimMini() {
  const f = formaSim()
  const box = $('sim-mini')
  box.replaceChildren(sprite(lookDe(f, st.sim.shiny), 34), el('span', { text: `${st.res?.s?.nome || f?.nome || ''} · Nv ${fmt.format(st.sim.level)}` }))
  box.title = 'Simulado'
  box.hidden = false
}

const faixaDe = (v) => [...FAIXAS].reverse().find(([de]) => v >= de) || FAIXAS[0]

function arcoSvg(valor, hoje) {
  const cx = 60
  const cy = 60
  const r = 48
  const ri = 37
  const pt = (v, raio) => {
    const t = Math.PI * (1 - Math.max(0, Math.min(1000, v)) / 1000)
    return [cx + raio * Math.cos(t), cy - raio * Math.sin(t)]
  }
  const arco = (de, ate, raio, attrs) => {
    if (!(ate > de)) return ''
    const [x1, y1] = pt(de, raio)
    const [x2, y2] = pt(ate, raio)
    return `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)} A${raio} ${raio} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" ${attrs}/>`
  }
  const vao = 8
  let s = ''
  FAIXAS.forEach(([de, , cor], i) => {
    const ate = FAIXAS[i + 1]?.[0] ?? 1000
    const a = de + (i ? vao : 0)
    const b = ate - (i < FAIXAS.length - 1 ? vao : 0)
    s += arco(a, b, r, `class="faixa" stroke="${cor}"`)
    if (valor != null && valor > a) s += arco(a, Math.min(b, valor), r, `class="cheio" stroke="${cor}"`)
  })
  if (hoje != null) {
    s += arco(0, 1000, ri, 'class="trilho-hoje"')
    if (hoje > 0) s += arco(0, hoje, ri, 'class="cheio-hoje"')
  }
  if (valor != null) {
    const [mx, my] = pt(valor, r)
    s += `<circle class="marca" cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="6"/>`
  }
  return `<svg viewBox="0 0 120 68" aria-hidden="true">${s}</svg>`
}

function textoForma(v) {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') return v.nome || ''
  const e = especie(v)
  return e?.nome || ''
}

function medidor(icone, rotulo, valor, hoje, forma) {
  const v = ehNum(valor) ? Math.round(Number(valor)) : null
  const ho = ehNum(hoje) ? Math.round(Number(hoje)) : null
  const faixa = v != null ? faixaDe(v) : [0, '—', '#a88e86']
  const dif = v != null && ho != null ? v - ho : null
  const arco = el('div', { class: 'arco' })
  arco.innerHTML = arcoSvg(v, ho != null && ho !== v ? ho : null)
  arco.append(el('b', { class: 'valor', text: v != null ? fmt.format(v) : '—' }))
  const nomeForma = textoForma(forma)
  const no = el('div', { class: 'medidor', style: `--cor:${faixa[2]}`, 'aria-label': `${rotulo}: ${v != null ? `${fmt.format(v)} de 1000, ${faixa[1]}` : 'sem dado'}${dif ? `, ${dif > 0 ? 'mais' : 'menos'} ${fmt.format(Math.abs(dif))} que hoje` : ''}`, role: 'group' }, [
    arco,
    el('span', { class: 'rot' }, [ico(icone, 16, 'ico-rot'), rotulo]),
    v != null ? el('span', { class: 'selo', text: faixa[1] }) : null,
    dif != null ? el('span', { class: `delta ${dif > 0 ? 'sobe' : dif < 0 ? 'desce' : 'igual'}`, text: dif ? `${dif > 0 ? '+' : '−'}${fmt.format(Math.abs(dif))} vs hoje` : 'igual a hoje' }) : null,
    nomeForma ? el('small', { text: `como ${nomeForma}` }) : null
  ])
  return no
}

function pintarScore() {
  const { h, s } = st.res
  $('medidores').replaceChildren(
    medidor('pvp', 'Score PvP', s.score?.pvp, h.score?.pvp, s.score?.formaPvp),
    medidor('pve', 'Score PvE', s.score?.pve, h.score?.pve, s.score?.formaPve)
  )
}

function variacao(a, b) {
  if (!(Number(a) > 0) || !ehNum(b)) return null
  const p = (Number(b) / Number(a) - 1) * 100
  return Math.abs(p) < 0.5 ? 0 : p
}

function textoVariacao(p) {
  if (p == null) return '—'
  if (p === 0) return 'igual'
  if (p < 100) return `${p > 0 ? '+' : '−'}${fmt.format(Math.round(Math.abs(p)))}%`
  const x = 1 + p / 100
  return `${x < 10 ? fmt1.format(x) : grande(x)}×`
}

function kpi(icone, rotulo, valorH, valorS, formato, extra = null, dica = '') {
  const p = variacao(valorH, valorS)
  return el('div', { class: 'kpi vao', title: dica || null }, [
    el('div', { class: 'kpi-cab' }, [ico(icone, 17, 'ico-kpi'), el('small', { text: rotulo })]),
    el('strong', {}, [formato(valorS), extra]),
    el('div', { class: 'kpi-pe' }, [
      el('span', { class: `delta ${p == null || p === 0 ? 'igual' : p > 0 ? 'sobe' : 'desce'}`, text: textoVariacao(p) }),
      el('span', { text: `hoje ${formato(valorH)}` })
    ])
  ])
}

function pintarKpis() {
  const { h, s } = st.res
  const nota = (v) => (ehNum(v) ? fmt1.format(v) : '—')
  $('kpis').replaceChildren(
    kpi('nota', 'Nota', h.nota, s.nota, nota, el('sup', { text: '/10' }), 'Nota do jogo, de 0 a 10'),
    kpi('poderPvp', 'Poder PvP', h.pvp, s.pvp, grande, null, ehNum(s.nivelPvp) ? `No PvP conta como Nv ${fmt.format(s.nivelPvp)}` : ''),
    kpi('poderPve', 'Poder PvE', h.pve, s.pve, grande, null, 'Poder na caça')
  )
}

function categoriaTxt(c) {
  const t = String(c || '')
  if (/f[ií]s|phys/i.test(t)) return 'físico'
  if (/esp|spec/i.test(t)) return 'especial'
  return t.toLowerCase()
}

function pintarGolpe() {
  const g = st.res.s.golpe
  const box = $('golpe')
  if (!g) return (box.hidden = true)
  const tipo = String(g.tipo || '').toUpperCase()
  const nome = g.zmove ? `Z-\u2060Move ${nomeTipo(tipo)}`.trim() : g.nome || '—'
  const cat = categoriaTxt(g.categoria)
  const detalhe = [cat ? cat[0].toUpperCase() + cat.slice(1) : '', g.cdMs ? `recarga ${fmt1.format(g.cdMs / 1000)} s` : ''].filter(Boolean).join(' · ')
  box.replaceChildren(
    ico('golpe', 24),
    el('div', { style: 'min-width:0' }, [
      el('small', { text: 'Golpe principal' }),
      el('div', { class: 'golpe-nome' }, [el('strong', { text: nome }), !g.zmove && tipo ? tiposDe([tipo]) : null]),
      detalhe ? el('div', { class: 'golpe-det', text: detalhe }) : null
    ]),
    el('div', { class: 'golpe-num' }, [el('b', { text: ehNum(g.power) ? fmt.format(g.power) : '—' }), el('small', { text: 'poder' })])
  )
  box.hidden = false
}

function pintarStats() {
  const { h, s } = st.res
  const linhas = STATS.map(([k, rot]) => {
    const a = Number(h.stats?.[k]) || 0
    const b = Number(s.stats?.[k]) || 0
    const p = variacao(a, b)
    return el('div', { class: 'tabela-l' }, [
      el('span', { text: rot }),
      el('span', { text: grande(a) }),
      el('b', { text: grande(b) }),
      el('span', { class: `delta ${p == null || p === 0 ? 'igual' : p > 0 ? 'sobe' : 'desce'}`, text: p == null || p === 0 ? '—' : textoVariacao(p) })
    ])
  })
  $('bloco-stats').replaceChildren(
    el('div', { class: 'bloco-cab' }, [ico('stats'), el('h3', { text: 'Atributos' }), el('span', { class: 'resumo', text: `Nv ${fmt.format(st.sim.level)}` })]),
    el('div', { class: 'tabela', role: 'table', 'aria-label': 'Atributos de hoje e simulados' }, [
      el('div', { class: 'tabela-l cab' }, [el('span', { text: '' }), el('span', { text: 'Hoje' }), el('span', { text: 'Simulado' }), el('span', { text: 'Δ' })]),
      ...linhas
    ])
  )
}

function precoDe(pk, res) {
  const chave = JSON.stringify(pk)
  let p = st.precos.get(chave)
  if (!p) {
    p = Promise.resolve()
      .then(() => motor.preco(pk, res))
      .catch((err) => ({ erro: err?.message || 'Não consegui estimar o preço.' }))
    st.precos.set(chave, p)
    if (st.precos.size > 60) st.precos.delete(st.precos.keys().next().value)
  }
  return p
}

function gemas(v) {
  if (!ehNum(v)) return '—'
  return Math.abs(v) >= 1000000 ? fmtCurto.format(v) : fmt.format(Math.round(v))
}

const cabPreco = (extra = null) => el('div', { class: 'bloco-cab' }, [el('span', { class: 'gema-ico', 'aria-hidden': 'true' }), el('h3', { text: 'Preço' }), extra])
const credito = () => el('a', { class: 'credito', href: 'https://briaoale.github.io/precificador-pokemon/', target: '_blank', rel: 'noopener' }, 'Preços: precificador do Briao')

async function pintarPreco(seq, pkH, rh, pkS, rs) {
  const box = $('bloco-preco')
  const pS = precoDe(pkS, rs)
  const pH = precoDe(pkH, rh)
  let pronto = false
  pS.then(() => { pronto = true })
  await Promise.resolve()
  if (!pronto) box.replaceChildren(cabPreco(el('span', { class: 'resumo', text: 'calculando…' })), el('div', { class: 'precos' }, [el('div', { class: 'esqueleto' }), el('div', { class: 'esqueleto' }), el('div', { class: 'esqueleto' })]))
  const [ds, dh] = await Promise.all([pS, pH])
  if (seq !== st.seq) return
  if (!ds || ds.erro) {
    box.replaceChildren(cabPreco(), el('p', { class: 'preco-nota', text: ds?.erro || 'Não consegui estimar o preço agora.' }))
    return
  }
  const g = ds.gemas
  if (!g || !ehNum(g.justo)) {
    box.replaceChildren(cabPreco(), el('p', { class: 'preco-nota', text: 'Sem vendas parecidas para estimar.' }), credito())
    return
  }
  const hojeJusto = dh && !dh.erro && ehNum(dh.gemas?.justo) ? Number(dh.gemas.justo) : null
  const p = hojeJusto ? variacao(hojeJusto, g.justo) : null
  const topo = Math.max(Number(g.rapido) || 0, Number(g.justo) || 0, Number(g.esperar) || 0) || 1
  const linha = (rot, v, meio = false) => el('div', { class: `preco${meio ? ' meio' : ''}` }, [
    el('b', { text: rot }),
    el('div', { class: 'trilho', 'aria-hidden': 'true' }, [el('i', { style: `width:${Math.max(4, Math.min(100, (Number(v) / topo) * 100)).toFixed(1)}%` })]),
    el('strong', {}, [gemas(v), el('span', { class: 'gema-ico', 'aria-hidden': 'true' })])
  ])
  const nota = []
  if (ehNum(ds.confianca)) nota.push(`Confiança ${fmt.format(Math.round(ds.confianca))}%`)
  if (Number(ds.vendasFamilia) > 0) nota.push(`${fmt.format(ds.vendasFamilia)} vendas da família${ds.familia ? ` ${ds.familia}` : ''}`)
  for (const a of ds.adicionais || []) {
    if (!(Number(a?.total) > 0)) continue
    const nome = String(a.nome || '').replace(/Z-Move ([A-Z]+)/, (_, t) => `Z-\u2060Move ${nomeTipo(t)}`)
    nota.push(`${nome} +${gemas(a.total)}`)
  }
  const hojeTxt = hojeJusto != null ? el('span', { class: 'preco-cab-hoje' }, [`hoje ${gemas(hojeJusto)}`, p != null ? el('span', { class: `delta ${p === 0 ? 'igual' : p > 0 ? 'sobe' : 'desce'}`, text: textoVariacao(p) }) : null]) : null
  box.replaceChildren(
    cabPreco(hojeTxt),
    el('div', { class: 'precos', role: 'list' }, [linha('Rápido', g.rapido), linha('Justo', g.justo, true), linha('Esperar', g.esperar)]),
    nota.length ? el('p', { class: 'preco-nota' }, nota.flatMap((t, i) => [i ? ' · ' : '', el('span', { text: t })])) : null,
    credito()
  )
}

function statusFicha(txt, tipo = '') {
  const s = $('status-ficha')
  s.textContent = txt
  s.className = `status ${tipo}`.trim()
}

let timerFicha = 0
async function lerColado() {
  const t = $('ficha').value.trim()
  if (!t) return statusFicha('')
  let f = null
  try { f = await motor.lerFicha(t) } catch {}
  if (!f) return statusFicha('Não reconheci esse texto. Copie de novo pelo botão Copiar p/ ChatGPT da ficha.', 'erro')
  let sid = Number(f.speciesId) || null
  if (!sid && f.nome) {
    try { sid = Number((await motor.buscarEspecies(f.nome, 1))?.[0]?.speciesId) || null } catch {}
  }
  if (!sid || !especie(sid)) return statusFicha(`Não achei a espécie${f.nome ? ` "${f.nome}"` : ''}.`, 'erro')
  definirHoje({ ...f, speciesId: sid })
  statusFicha(`Lido: ${st.nomeHoje}, Nv ${fmt.format(st.hoje.level)}`, 'ok')
}

let timerBusca = 0
function buscar() {
  const t = $('busca').value.trim()
  const lista = $('resultados')
  if (!t) {
    lista.hidden = true
    return lista.replaceChildren()
  }
  let r = []
  try { r = motor.buscarEspecies(t, 8) || [] } catch {}
  if (!r.length) {
    lista.replaceChildren(el('li', { class: 'vazio-busca', text: 'Nenhuma espécie com esse nome.' }))
    lista.hidden = false
    return
  }
  lista.replaceChildren(...r.map((e) => el('li', {}, [el('button', { type: 'button', onclick: () => escolherEspecie(e) }, [
    sprite(e.looktype, 44),
    el('span', { class: 'nome' }, [el('span', { text: e.nome }), tiposDe(e.tipos), e.mega ? el('span', { class: 'etiqueta', text: 'Mega' }) : null])
  ])])))
  lista.hidden = false
}

function escolherEspecie(e) {
  const base = st.hoje || { level: 100, potencia: 1, quality: 1, shiny: false, ivs: Object.fromEntries(STATS.map(([k]) => [k, 16])), refino: {} }
  definirHoje({ ...base, speciesId: e.speciesId, nome: e.nome, refino: {} })
  $('busca').value = ''
  $('resultados').hidden = true
  $('resultados').replaceChildren()
  statusFicha('')
}

function trocarAba(qual) {
  const colar = qual === 'colar'
  $('aba-colar').setAttribute('aria-selected', String(colar))
  $('aba-mao').setAttribute('aria-selected', String(!colar))
  $('aba-colar').tabIndex = colar ? 0 : -1
  $('aba-mao').tabIndex = colar ? -1 : 0
  $('painel-colar').hidden = !colar
  $('painel-mao').hidden = colar
}

let timerLink = 0
async function copiarLink() {
  const bt = $('copiar-link')
  const aviso = $('link-ok')
  if (st.hoje) gravarEstado()
  const url = location.href
  let ok = false
  try {
    await navigator.clipboard.writeText(url)
    ok = true
  } catch {
    const campo = el('textarea', { style: 'position:fixed;left:-9999px;top:0', readonly: true })
    campo.value = url
    document.body.append(campo)
    campo.select()
    try { ok = document.execCommand('copy') } catch {}
    campo.remove()
  }
  aviso.className = `link-ok${ok ? '' : ' erro'}`
  aviso.textContent = ok ? 'Link copiado' : 'Copie o endereço na barra do navegador'
  bt.classList.toggle('ok', ok)
  clearTimeout(timerLink)
  timerLink = setTimeout(() => {
    aviso.textContent = ''
    bt.classList.remove('ok')
  }, 2500)
}

function ligarEventos() {
  $('ficha').addEventListener('input', () => {
    clearTimeout(timerFicha)
    timerFicha = setTimeout(lerColado, 250)
  })
  $('busca').addEventListener('input', () => {
    clearTimeout(timerBusca)
    timerBusca = setTimeout(buscar, 120)
  })
  $('busca').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      clearTimeout(timerBusca)
      buscar()
      $('resultados').querySelector('button')?.click()
    } else if (e.key === 'ArrowDown') {
      const b = $('resultados').querySelector('button')
      if (b) {
        e.preventDefault()
        b.focus()
      }
    }
  })
  $('resultados').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const bts = [...$('resultados').querySelectorAll('button')]
    const i = bts.indexOf(document.activeElement)
    if (i < 0) return
    e.preventDefault()
    if (e.key === 'ArrowUp' && i === 0) return $('busca').focus()
    bts[Math.max(0, Math.min(bts.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus()
  })
  $('aba-colar').addEventListener('click', () => trocarAba('colar'))
  $('aba-mao').addEventListener('click', () => trocarAba('mao'))
  for (const id of ['aba-colar', 'aba-mao']) {
    $(id).addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const outro = id === 'aba-colar' ? 'mao' : 'colar'
      trocarAba(outro)
      $(`aba-${outro}`).focus()
    })
  }
  $('voltar').addEventListener('click', () => {
    if (!st.hoje) return
    st.sim = pkDe(st.hoje)
    montarSimulacao()
    agendar(true)
  })
  $('info-score').addEventListener('click', () => {
    const b = $('info-score')
    const abrir = b.getAttribute('aria-expanded') !== 'true'
    b.setAttribute('aria-expanded', String(abrir))
    $('explica').hidden = !abrir
  })
  $('copiar-link').addEventListener('click', copiarLink)
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace(/^#/, '')
    if (!st.pronto || !h || h === st.ultimoHash) return
    aplicarCodigo(h)
  })
}

function progresso(p, texto) {
  let frac = null
  let txt = typeof texto === 'string' ? texto : null
  if (typeof p === 'number') frac = p
  else if (typeof p === 'string') txt = p
  else if (p && typeof p === 'object') {
    frac = p.fracao ?? p.progresso ?? p.pct ?? (Number(p.total) > 0 ? Number(p.feito ?? p.carregado ?? 0) / Number(p.total) : null)
    txt = p.texto || p.etapa || p.mensagem || null
  }
  if (ehNum(frac)) {
    let f = Number(frac)
    if (f > 1) f /= 100
    $('carga-barra').style.width = `${Math.max(8, Math.min(100, f * 100)).toFixed(1)}%`
  }
  if (txt) $('carga-txt').textContent = String(txt)
}

async function iniciar() {
  const carga = $('carga')
  carga.classList.remove('falhou')
  $('carga-erro').hidden = true
  $('carga-txt').textContent = 'Carregando dados do jogo'
  $('carga-barra').style.width = '8%'
  try {
    await motor.carregar(progresso)
  } catch (err) {
    carga.classList.add('falhou')
    $('carga-txt').textContent = 'Não deu para carregar'
    $('carga-erro-txt').textContent = err?.message || 'Verifique a conexão e tente de novo.'
    $('carga-erro').hidden = false
    return
  }
  $('carga-barra').style.width = '100%'
  st.pronto = true
  carga.hidden = true
  $('calc').hidden = false
  const doLink = location.hash.replace(/^#/, '')
  if (doLink && aplicarCodigo(doLink)) return
  const salvo = lerLocal()
  if (salvo) aplicarCodigo(salvo)
}

ligarEventos()
$('carga-tentar').addEventListener('click', iniciar)
iniciar()
