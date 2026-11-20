const TIPOS = ['NORMAL', 'FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY']
const NOME_TIPO = { NORMAL: 'Normal', FIRE: 'Fogo', WATER: 'Água', ELECTRIC: 'Elétrico', GRASS: 'Planta', ICE: 'Gelo', FIGHTING: 'Lutador', POISON: 'Veneno', GROUND: 'Terra', FLYING: 'Voador', PSYCHIC: 'Psíquico', BUG: 'Inseto', ROCK: 'Pedra', GHOST: 'Fantasma', DRAGON: 'Dragão', DARK: 'Sombrio', STEEL: 'Aço', FAIRY: 'Fada' }
const COR_TIPO = { NORMAL: '#9a9a6e', FIRE: '#e8742a', WATER: '#4f7fe6', ELECTRIC: '#d9b51c', GRASS: '#5fae38', ICE: '#5ec2be', FIGHTING: '#b8302a', POISON: '#9a3c98', GROUND: '#c9a24c', FLYING: '#8f78e0', PSYCHIC: '#ec4b7d', BUG: '#94a61a', ROCK: '#a8952f', GHOST: '#6a4f8f', DRAGON: '#6a35ea', DARK: '#6a5345', STEEL: '#8c8cae', FAIRY: '#d0739f' }
const FAIXAS = [[0, '#f87171'], [300, '#fb923c'], [500, '#facc15'], [700, '#4ade80']]
const COR_TIER = { 'S+': '#ff5fa8', S: '#ff7ab8', 'S-': '#f9a8d4', 'A+': '#ff9f43', A: '#ffb86b', 'A-': '#ffd08a', 'B+': '#facc15', B: '#fde047', 'B-': '#fef08a', 'C+': '#60a5fa', C: '#93c5fd', 'C-': '#bfdbfe', D: '#a1a1aa' }
const JANELAS = ['dia', 'semana', 'mes']
const SPRITES = '../calculadora/jogo/sprites-png/'
const BOLA = '../assets/pokebola.svg'

const fmt = new Intl.NumberFormat('pt-BR')
const fmtPct = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const fmtDia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const $ = (id) => document.getElementById(id)
const ehNum = (v) => v != null && v !== '' && Number.isFinite(Number(v))
const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const plural = (n, um, varios) => `${fmt.format(n)} ${Number(n) === 1 ? um : varios}`

function el(tag, attrs = {}, filhos = []) {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'text') n.textContent = v
    else if (k === 'class') n.className = v
    else n.setAttribute(k, v === true ? '' : v)
  }
  for (const f of [].concat(filhos)) if (f != null && f !== false) n.append(f)
  return n
}

const estado = { janela: 'dia', busca: '', tipos: [], todas: false, ordem: 'score', ficha: null }
let dados = null

function lerHash() {
  const p = new URLSearchParams(location.hash.slice(1))
  estado.janela = JANELAS.includes(p.get('j')) ? p.get('j') : 'dia'
  estado.busca = p.get('b') || ''
  estado.tipos = (p.get('t') || '').split(',').map((t) => t.toUpperCase()).filter((t) => TIPOS.includes(t))
  estado.todas = p.get('a') === '1'
  estado.ordem = p.get('o') === 'uso' ? 'uso' : 'score'
  estado.ficha = ehNum(p.get('p')) ? Number(p.get('p')) : null
}

function gravarHash() {
  const p = new URLSearchParams()
  if (estado.janela !== 'dia') p.set('j', estado.janela)
  if (estado.busca.trim()) p.set('b', estado.busca.trim())
  if (estado.tipos.length) p.set('t', estado.tipos.join(','))
  if (estado.todas) p.set('a', '1')
  if (estado.ordem !== 'score') p.set('o', estado.ordem)
  if (estado.ficha != null) p.set('p', String(estado.ficha))
  const h = p.toString().replace(/%2C/g, ',')
  history.replaceState(null, '', h ? `#${h}` : location.pathname + location.search)
}

function janelasDe(j) {
  if (j?.janelas) return j.janelas
  if (Array.isArray(j?.tiers)) return { dia: j }
  return {}
}

function janelaAtual() {
  const js = janelasDe(dados)
  return js[estado.janela] || js.dia || js[JANELAS.find((k) => js[k])] || null
}

function escala(valor) {
  const v = Math.max(0, Math.min(1000, Number(valor)))
  return el('span', { class: 'escala', 'aria-hidden': 'true' }, FAIXAS.map(([de, cor], i) => {
    const ate = FAIXAS[i + 1]?.[0] ?? 1000
    const cheio = Math.max(0, Math.min(1, (v - de) / (ate - de)))
    const aqui = v >= de && (v < ate || ate === 1000)
    return el('span', { class: 'esc-f', style: `flex-grow:${ate - de};--c:${cor}` }, [
      el('i', { style: `width:${(cheio * 100).toFixed(1)}%` }),
      aqui ? el('b', { class: 'esc-marca', style: `left:${(cheio * 100).toFixed(1)}%` }) : null
    ])
  }))
}

function sprite(p) {
  const img = el('img', { alt: '', loading: 'lazy', decoding: 'async' })
  const looks = [p.looktype, p.lookNormal, 60000 + Number(p.speciesId)].filter(ehNum).map(Number)
  const tentativas = [...new Set(looks)].map((l) => `${SPRITES}${l}.png`)
  const proxima = () => {
    const url = tentativas.shift()
    if (url) img.src = url
    else { img.onerror = null; img.src = BOLA; img.className = 'bola' }
  }
  img.onerror = proxima
  proxima()
  return img
}

const linkCalc = (p) => `../calculadora/#e=${Number(p.speciesId)}&n=100&p=1&q=1.1&s=1&iv=20.20.20.20.20.20&sn=100`

function cartao(p) {
  const tipos = (p.tipos || []).filter(Boolean).map((t) => String(t).toUpperCase())
  const nomesTipos = tipos.map((t) => NOME_TIPO[t] || t).join(' e ')
  const uso = []
  if (Number(p.uso) > 0) uso.push('uso ', el('b', { text: `${fmtPct.format(p.uso)}%` }))
  if (Number(p.uso) > 0 && ehNum(p.vitorias)) uso.push(uso.length ? ' · ' : '', 'vitórias ', el('b', { text: `${fmtPct.format(p.vitorias)}%` }))
  const score = ehNum(p.score) ? Math.round(p.score) : null
  return el('a', { class: 'poke', href: linkCalc(p), 'data-id': String(p.speciesId), title: `${p.nome} shiny${nomesTipos ? ` (${nomesTipos})` : ''}${score != null ? ` · score ${fmt.format(score)}` : ''}` }, [
    el('span', { class: 'poke-img' }, [sprite(p)]),
    el('span', { class: 'poke-cab' }, [
      el('span', { class: 'poke-nome', text: p.nome }),
      nomesTipos ? el('span', { class: 'so-leitor', text: nomesTipos }) : null
    ]),
    score != null ? el('b', { class: 'poke-val', text: fmt.format(score) }) : null,
    el('span', { class: 'poke-esc' }, [tipos.length ? el('span', { class: 'pontos', 'aria-hidden': 'true' }, tipos.map((t) => el('i', { style: `--c:${COR_TIPO[t] || '#777'}` }))) : null, score != null ? escala(score) : null]),
    el('span', { class: 'poke-uso' }, uso)
  ])
}

function filtrar(itens) {
  const q = normalizar(estado.busca)
  return itens.filter((p) =>
    (!q || normalizar(p.nome).includes(q) || normalizar(p.base?.nome).includes(q)) &&
    (!estado.tipos.length || (p.tipos || []).some((t) => estado.tipos.includes(String(t).toUpperCase())))
  )
}

function ordenar(itens) {
  const sc = (p) => (ehNum(p.score) ? Number(p.score) : -1)
  const us = (p) => (ehNum(p.uso) ? Number(p.uso) : -1)
  return [...itens].sort(estado.ordem === 'uso' ? (a, b) => us(b) - us(a) || sc(b) - sc(a) : (a, b) => sc(b) - sc(a) || us(b) - us(a))
}

function dia(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : fmtDia.format(d)
}

function pintarPeriodo(j) {
  const partes = []
  const de = dia(j.de), ate = dia(j.ate)
  if (de && ate) partes.push(de === ate ? de : `${de} a ${ate}`)
  const topo = j.topo ?? dados.topo
  if (ehNum(topo)) partes.push(`top ${fmt.format(topo)}`)
  if (ehNum(j.partidas)) partes.push(plural(j.partidas, 'partida', 'partidas'))
  if (ehNum(j.jogadores)) partes.push(plural(j.jogadores, 'jogador', 'jogadores'))
  const filhos = [partes.join(' · ')]
  if (j.parcial) {
    const t0 = new Date(j.de).getTime(), t1 = new Date(j.ate).getTime()
    const n = ehNum(j.dias) ? Number(j.dias) : Number.isFinite(t1 - t0) ? Math.max(1, Math.round((t1 - t0) / 864e5)) : null
    if (n) filhos.push(el('span', { class: 'parcial', text: `cobre ${plural(n, 'dia', 'dias')}` }))
  }
  $('periodo').replaceChildren(...filhos)
}

function pintar() {
  const j = janelaAtual()
  const js = janelasDe(dados)
  document.querySelectorAll('[data-janela]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.janela === estado.janela))
    b.disabled = !js[b.dataset.janela]
  })
  document.querySelectorAll('[data-ordem]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ordem === estado.ordem)))
  const fora = Array.isArray(j?.foraDoMeta) ? j.foraDoMeta : []
  $('todas').setAttribute('aria-pressed', String(estado.todas && fora.length > 0))
  $('todas').disabled = !fora.length
  document.querySelectorAll('.chip-tipo').forEach((b) => b.setAttribute('aria-pressed', String(estado.tipos.includes(b.dataset.tipo))))
  $('tipos').classList.toggle('escolhido', estado.tipos.length > 0)
  $('limpa-tipos').hidden = !estado.tipos.length
  $('n-tipos').hidden = !estado.tipos.length
  $('n-tipos').textContent = String(estado.tipos.length)
  $('abre-tipos').setAttribute('aria-label', estado.tipos.length ? `Tipos, ${estado.tipos.length} filtrados` : 'Tipos')
  if ($('busca').value !== estado.busca) $('busca').value = estado.busca
  if (!j) { $('faixas').replaceChildren(); $('vazio').hidden = false; return }
  pintarPeriodo(j)
  const cortes = new Map((j.cortes || []).map((c) => [c.tier, c.min]))
  const faixas = (j.tiers || []).map((t) => faixa(t.tier, t.itens, cortes)).filter(Boolean)
  $('faixas').replaceChildren(...faixas)
  let foraFaixas = []
  if (estado.todas && fora.length) {
    const grupos = new Map()
    for (const p of fora) {
      const t = p.tier || '?'
      if (!grupos.has(t)) grupos.set(t, [])
      grupos.get(t).push(p)
    }
    const ordem = [...(j.cortes || []).map((c) => c.tier), ...Object.keys(COR_TIER)]
    const pos = (t) => { const k = ordem.indexOf(t); return k < 0 ? ordem.length : k }
    foraFaixas = [...grupos.keys()].sort((a, b) => pos(a) - pos(b)).map((t) => faixa(t, grupos.get(t), cortes, true)).filter(Boolean)
    const topo = j.topo ?? dados.topo
    $('fora-aviso').textContent = ehNum(topo) ? `não usados no top ${fmt.format(topo)} no período` : 'não usados no ranqueado no período'
  }
  $('fora-faixas').replaceChildren(...foraFaixas)
  $('fora').hidden = !foraFaixas.length
  $('vazio').hidden = faixas.length + foraFaixas.length > 0
}

function faixa(tier, lista, cortes, apagada = false) {
  const itens = ordenar(filtrar(lista || []))
  if (!itens.length) return null
  const min = cortes.get(tier)
  return el('section', { class: `faixa${tier === 'S+' ? ' topo-s' : ''}${apagada ? ' apagada' : ''}`, style: `--cor:${COR_TIER[tier] || '#a1a1aa'}`, 'aria-label': `${apagada ? 'Fora do meta, tier' : 'Tier'} ${tier}` }, [
    el('div', { class: 'faixa-rot' }, [el('b', { text: tier }), ehNum(min) && Number(min) > 0 ? el('small', { text: `${fmt.format(min)}+` }) : null]),
    el('div', { class: 'faixa-cartoes' }, itens.map(cartao))
  ])
}

function abrirTipos(v) {
  $('abre-tipos').setAttribute('aria-expanded', String(v))
  $('tipos').hidden = !v
}

function montarFiltros() {
  $('tipos').replaceChildren(
    ...TIPOS.map((t) => el('button', { type: 'button', class: 'chip-tipo', 'data-tipo': t, style: `--c:${COR_TIPO[t]}`, 'aria-pressed': 'false', text: NOME_TIPO[t] })),
    el('button', { type: 'button', class: 'limpa-tipos', id: 'limpa-tipos', text: 'Limpar', hidden: true })
  )
  const muda = () => { gravarHash(); pintar() }
  $('tipos').addEventListener('click', (e) => {
    if (e.target.closest('.limpa-tipos')) { estado.tipos = []; return muda() }
    const b = e.target.closest('.chip-tipo')
    if (!b) return
    const t = b.dataset.tipo
    estado.tipos = estado.tipos.includes(t) ? estado.tipos.filter((x) => x !== t) : [...estado.tipos, t]
    muda()
  })
  $('abre-tipos').addEventListener('click', () => abrirTipos($('tipos').hidden))
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('tipos').hidden) { abrirTipos(false); $('abre-tipos').focus() } })
  document.querySelectorAll('[data-janela]').forEach((b) => b.addEventListener('click', () => { estado.janela = b.dataset.janela; muda() }))
  document.querySelectorAll('[data-ordem]').forEach((b) => b.addEventListener('click', () => { estado.ordem = b.dataset.ordem; muda() }))
  $('todas').addEventListener('click', () => { estado.todas = !estado.todas; muda() })
  let espera = 0
  $('busca').addEventListener('input', (e) => {
    estado.busca = e.target.value
    clearTimeout(espera)
    espera = setTimeout(muda, 120)
  })
  $('info-score').addEventListener('click', (e) => {
    const aberto = e.currentTarget.getAttribute('aria-expanded') === 'true'
    e.currentTarget.setAttribute('aria-expanded', String(!aberto))
    $('explica').hidden = aberto
  })
  addEventListener('hashchange', () => { lerHash(); pintar(); sincronizarFicha() })
  $('faixas').addEventListener('click', clicouCartao)
  $('fora-faixas').addEventListener('click', clicouCartao)
  montarFicha()
}

const STATS = [['hp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['spAtk', 'SP.ATK'], ['spDef', 'SP.DEF'], ['speed', 'VEL']]
const ICO = {
  fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
  evo: '<path d="M4 12h11M11 7l5 5-5 5"/><circle cx="19" cy="12" r="1.6"/>',
  escudo: '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  stats: '<path d="M5 20V11M10 20V5M15 20v-7M20 20V8"/>',
  calc: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M8.5 18h.01M12 18h.01M15.5 14.5V18"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>'
}
const MULT_TXT = new Map([[4, '×4'], [2, '×2'], [0.5, '×½'], [0.25, '×¼'], [0, 'imune']])
let motorP = null
let motorPronto = null
let fichaSeq = 0

function ico(nome, cls = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor')
  s.setAttribute('stroke-width', '2.2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true')
  if (cls) s.setAttribute('class', cls)
  s.innerHTML = ICO[nome]
  return s
}

function imgDe(looks, cls = '') {
  const tentativas = [...new Set(looks.filter(ehNum).map(Number))].map((l) => `${SPRITES}${l}.png`)
  const img = el('img', { alt: '', decoding: 'async', class: cls || null })
  const proxima = () => {
    const url = tentativas.shift()
    if (url) img.src = url
    else { img.onerror = null; img.src = BOLA; img.classList.add('bola') }
  }
  img.onerror = proxima
  proxima()
  return img
}

const chipTipo = (t) => el('span', { class: 'tipo', style: `--c:${COR_TIPO[t] || '#777'}`, text: NOME_TIPO[t] || t })
const tiposDoItem = (p) => (p.tipos || []).filter(Boolean).map((t) => String(t).toUpperCase())

function acharItem(id) {
  const j = janelaAtual()
  if (!j) return null
  for (const t of j.tiers || []) for (const p of t.itens || []) if (Number(p.speciesId) === id) return { p, tier: t.tier, fora: false }
  for (const p of j.foraDoMeta || []) if (Number(p.speciesId) === id) return { p, tier: p.tier, fora: true }
  return null
}

function carregarMotor() {
  motorP ??= import('../calculadora/motor.js')
  motorPronto ??= motorP.then(async (m) => { await m.carregar(); return m }).catch((e) => { motorPronto = null; throw e })
  return motorPronto
}

function defesas(tipos, tabela) {
  const fraco = [], resiste = []
  for (const atq of TIPOS) {
    const linha = tabela[atq] || {}
    let v = 1
    for (const d of tipos) v *= linha[d] ?? 1
    if (v > 1) fraco.push([atq, v])
    else if (v < 1) resiste.push([atq, v])
  }
  fraco.sort((a, b) => b[1] - a[1])
  resiste.sort((a, b) => a[1] - b[1])
  return { fraco, resiste }
}

function listaDefesa(rot, itens, cls) {
  const grupos = new Map()
  for (const [t, v] of itens) {
    if (!grupos.has(v)) grupos.set(v, [])
    grupos.get(v).push(t)
  }
  const rotMult = (v) => (v === 0 ? 'imune' : MULT_TXT.get(v) || `×${fmtPct.format(v)}`)
  const nivel = (v) => (v === 0 ? 'zero' : v >= 4 ? 'forte' : v > 1 ? 'medio' : v <= 0.25 ? 'forte' : 'medio')
  return el('div', { class: `def-l ${cls}` }, [
    el('span', { class: 'def-rot', text: rot }),
    itens.length
      ? el('div', { class: 'def-grupos' }, [...grupos].map(([v, ts]) => el('div', { class: `def-g ${nivel(v)}` }, [el('span', { class: 'def-mult', text: rotMult(v) }), el('span', { class: 'def-tipos' }, ts.map(chipTipo))])))
      : el('span', { class: 'def-nada', text: 'nenhum' })
  ])
}

function bloco(icone, titulo, conteudo, cls = '') {
  return el('section', { class: `f-bloco ${cls}`.trim() }, [el('h3', {}, [ico(icone), titulo]), conteudo])
}

function abrirFicha(id) {
  estado.ficha = id
  gravarHash()
  sincronizarFicha()
}

function fecharFicha() {
  if (estado.ficha == null) return
  estado.ficha = null
  gravarHash()
  sincronizarFicha()
}

function sincronizarFicha() {
  const d = $('ficha')
  const achado = estado.ficha != null ? acharItem(estado.ficha) : null
  if (!achado) {
    if (estado.ficha != null) { estado.ficha = null; gravarHash() }
    if (d.open) d.close()
    return
  }
  if (Number(d.dataset.id) !== estado.ficha || !d.open) pintarFicha(achado)
  if (!d.open) d.showModal()
}

function pintarFicha({ p, tier, fora }) {
  const d = $('ficha')
  d.dataset.id = String(p.speciesId)
  const seq = ++fichaSeq
  const tipos = tiposDoItem(p)
  const score = ehNum(p.score) ? Math.round(p.score) : null
  const num = (rot, v, suf = '') => el('div', { class: 'f-num' }, [el('span', { text: rot }), el('b', { text: ehNum(v) ? `${fmtPct.format(v)}${suf}` : '—' })])
  const evo = el('div', { class: 'f-evo', 'aria-busy': 'true' }, [el('span', { class: 'f-carga', text: 'Carregando…' })])
  const defs = el('div', { class: 'f-defs' }, [el('span', { class: 'f-carga', text: 'Carregando…' })])
  const stats = el('div', { class: 'f-stats' }, [el('span', { class: 'f-carga', text: 'Carregando…' })])
  const corTier = COR_TIER[tier] || '#a1a1aa'
  $('ficha-corpo').replaceChildren(
    el('button', { type: 'button', class: 'f-fechar', 'aria-label': 'Fechar', title: 'Fechar (Esc)', 'data-fechar': '' }, [ico('fechar')]),
    el('header', { class: 'f-cab', style: `--cor:${corTier}` }, [
      el('div', { class: 'f-sprites' }, [
        el('span', { class: 'f-shiny' }, [imgDe([p.looktype, p.lookNormal, 60000 + Number(p.speciesId)])]),
        ehNum(p.lookNormal) && Number(p.lookNormal) !== Number(p.looktype) ? el('span', { class: 'f-normal', title: 'Normal' }, [imgDe([p.lookNormal])]) : null
      ]),
      el('div', { class: 'f-id' }, [
        el('h2', { id: 'ficha-nome' }, [p.nome, el('span', { class: 'f-shiny-rot', text: 'shiny' })]),
        tipos.length ? el('span', { class: 'tipos' }, tipos.map(chipTipo)) : null,
        el('div', { class: 'f-score' }, [
          el('span', { class: `f-tier${tier === 'S+' ? ' topo-s' : ''}`, text: tier || '?' }),
          score != null ? el('b', { class: 'f-val', text: fmt.format(score) }) : null,
          score != null ? escala(score) : null
        ]),
        fora ? el('span', { class: 'f-fora', text: 'fora do meta no período' }) : null
      ])
    ]),
    el('div', { class: 'f-nums' }, [num('uso', p.uso, '%'), num('vitórias', p.vitorias, '%'), num('aparições', p.n)]),
    bloco('evo', 'Linha evolutiva', evo, 'f-bloco-evo'),
    el('div', { class: 'f-duas' }, [bloco('escudo', 'Tipos contra', defs), bloco('stats', 'Stats base', stats)])
  )
  carregarMotor().then((m) => {
    if (seq !== fichaSeq) return
    defs.replaceChildren(...pintarDefesas(tipos, m.TABELA_TIPOS))
    const esp = m.especie(p.speciesId)
    stats.replaceChildren(...pintarStats(esp?.base))
    const formas = m.formas(p.base?.speciesId ?? p.speciesId)
    evo.removeAttribute('aria-busy')
    evo.replaceChildren(...pintarEvo(formas.length ? formas : [esp].filter(Boolean), p.speciesId, m))
  }).catch(() => {
    if (seq !== fichaSeq) return
    for (const n of [evo, defs, stats]) n.replaceChildren(el('span', { class: 'f-carga', text: 'Não deu para carregar.' }))
  })
}

function pintarDefesas(tipos, tabela) {
  if (!tabela || !tipos.length) return [el('span', { class: 'f-carga', text: 'Sem dados de tipo.' })]
  const { fraco, resiste } = defesas(tipos, tabela)
  return [listaDefesa('Fraco a', fraco, 'fraco'), listaDefesa('Resiste a', resiste, 'resiste')]
}

function pintarStats(base) {
  if (!base) return [el('span', { class: 'f-carga', text: 'Sem stats.' })]
  const max = Math.max(160, ...STATS.map(([k]) => Number(base[k]) || 0))
  return STATS.map(([k, rot]) => {
    const v = Number(base[k]) || 0
    const cor = v >= 120 ? '#4ade80' : v >= 90 ? '#facc15' : v >= 60 ? '#fb923c' : '#f87171'
    return el('div', { class: 'f-stat' }, [el('span', { text: rot }), el('b', { text: fmt.format(v) }), el('i', { style: `--c:${cor}` }, [el('i', { style: `width:${Math.min(100, (v / max) * 100).toFixed(1)}%` })])])
  })
}

function pintarEvo(formas, atual, m) {
  const nos = []
  formas.forEach((f, i) => {
    if (i) nos.push(el('span', { class: 'f-seta', 'aria-hidden': 'true', text: '›' }))
    const png = m.spritePng(f.lookShiny ?? f.looktype)
    const looks = [f.lookShiny, f.looktype]
    const img = png ? imgDe([]) : imgDe(looks)
    if (png) { img.onerror = () => { img.onerror = null; img.src = `${SPRITES}${f.looktype}.png` }; img.src = `../calculadora/${png.url}`; img.classList.remove('bola') }
    const noTier = acharItem(Number(f.speciesId))
    const atualCls = Number(f.speciesId) === Number(atual) ? ' atual' : ''
    const filhos = [el('span', { class: 'f-evo-img' }, [img]), el('span', { class: 'f-evo-nome', text: f.nome })]
    nos.push(noTier && !atualCls
      ? el('button', { type: 'button', class: `f-evo-no${atualCls}`, 'data-id': String(f.speciesId), title: `Ver ${f.nome}` }, filhos)
      : el('span', { class: `f-evo-no${atualCls}`, 'aria-current': atualCls ? 'true' : null }, filhos))
  })
  return nos
}

function montarFicha() {
  const d = $('ficha')
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-fechar]')) return fecharFicha()
    const no = e.target.closest('.f-evo-no[data-id]')
    if (no) abrirFicha(Number(no.dataset.id))
  })
  d.addEventListener('cancel', (e) => { e.preventDefault(); fecharFicha() })
  d.addEventListener('close', () => { if (estado.ficha != null) fecharFicha() })
}

function clicouCartao(e) {
  const a = e.target.closest('a.poke[data-id]')
  if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  abrirFicha(Number(a.dataset.id))
}

function temporadaTxt(t) {
  if (ehNum(t)) return `temporada ${t}`
  const d = dia(t)
  return d ? `temporada de ${d}` : ''
}

function pintarCabecalho() {
  const g = new Date(dados.geradoEm)
  const filhos = []
  if (!Number.isNaN(g.getTime())) filhos.push(' · ', el('b', { text: `${fmtDia.format(g)} às ${fmtHora.format(g)}` }))
  const p = janelasDe(dados).dia?.partidas ?? dados.partidas
  if (ehNum(p)) filhos.push(' · ', el('b', { text: fmt.format(p) }), Number(p) === 1 ? ' partida' : ' partidas')
  if (filhos.length) {
    $('atualizado').replaceChildren(...filhos)
    $('atualizado').hidden = false
  }
  $('regra').textContent = [dados.regra, temporadaTxt(dados.temporada), dados.versaoJogo ? `jogo ${dados.versaoJogo}` : ''].filter(Boolean).join(' · ')
  const topo = dados.topo ?? janelasDe(dados).dia?.topo
  if (ehNum(topo)) $('explica-topo').textContent = ` Base: os shiny do top ${fmt.format(topo)} do ranqueado.`
}

async function iniciar() {
  const carga = $('carga')
  carga.classList.remove('falhou')
  $('carga-erro').hidden = true
  try {
    const r = await fetch('tier.json', { cache: 'no-cache' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    dados = await r.json()
  } catch {
    carga.classList.add('falhou')
    $('carga-erro-txt').textContent = 'Não deu para carregar o tier agora.'
    $('carga-erro').hidden = false
    return
  }
  pintarCabecalho()
  carga.hidden = true
  $('tier').hidden = false
  pintar()
  sincronizarFicha()
}

lerHash()
montarFiltros()
$('carga-tentar').addEventListener('click', iniciar)
iniciar()
