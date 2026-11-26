import * as P from '../calculadora/jogo/pvp-passivas.mjs'

const SPRITES = '../calculadora/jogo/sprites-png/'
const BOLA = '../assets/pokebola.svg'
const DITTO = 132
const DRAGONITE = 149
const NOME_TIPO = { NORMAL: 'Normal', FIRE: 'Fogo', WATER: 'Água', ELECTRIC: 'Elétrico', GRASS: 'Planta', ICE: 'Gelo', FIGHTING: 'Lutador', POISON: 'Veneno', GROUND: 'Terra', FLYING: 'Voador', PSYCHIC: 'Psíquico', BUG: 'Inseto', ROCK: 'Pedra', GHOST: 'Fantasma', DRAGON: 'Dragão', DARK: 'Sombrio', STEEL: 'Aço', FAIRY: 'Fada' }
const COR_TIPO = { NORMAL: '#9a9a6e', FIRE: '#e8742a', WATER: '#4f7fe6', ELECTRIC: '#d9b51c', GRASS: '#5fae38', ICE: '#5ec2be', FIGHTING: '#b8302a', POISON: '#9a3c98', GROUND: '#c9a24c', FLYING: '#8f78e0', PSYCHIC: '#ec4b7d', BUG: '#94a61a', ROCK: '#a8952f', GHOST: '#6a4f8f', DRAGON: '#6a35ea', DARK: '#6a5345', STEEL: '#8c8cae', FAIRY: '#d0739f' }

const DESC = {
  rocky_helmet: 'Devolve a quem bate nele {pct}% do dano de cada golpe (a Investida também), a luta toda.',
  rain_dance: '+{pct}% de dano e recarga {recarga}% mais rápida para ele e os aliados de BST até {bst}, a luta toda. Duas Rain Dance não somam.',
  swarm: '+{pct}% de dano, e mais {porInseto}% por outro pokémon do tipo Inseto no time (contados no começo), até +{teto}%, a luta toda.',
  intimidate: 'Os inimigos causam {pct}% menos dano de golpe, a luta toda. Só vale se ele for o único pokémon do tipo Dragão do time (megas contam).',
  iron_defense: '+{pct}% de DEF e SP.DEF, a luta toda.',
  burn: 'O alvo perde {pct}% do HP máximo por segundo durante {seg} s ({total}% no total).',
  poison: 'O alvo perde {pct}% do HP máximo por segundo durante {seg} s ({total}% no total).',
  freeze: 'Por {seg} s o alvo não ataca nem anda, as recargas dele param e ele toma {danoRecebido}% a mais de dano de golpe.',
  paralyze: 'Na hora, as recargas do alvo atrasam {atraso} s. Depois, por {seg} s, elas ficam {recarga}% mais lentas e cada ataque dele tem {falha}% de chance de falhar.',
  leech_seed: 'Drena {pct}% do HP máximo do alvo por segundo durante {seg} s e cura quem plantou no mesmo tanto, até {curaMax}% do HP máximo dele.',
  dig: 'Desvia do próximo golpe de {poder} de poder que ele receber, sem dano. O Z-Move não é desviado.',
  confusion: 'O próximo golpe do alvo de até {poder} de poder acerta o aliado mais perto dele (sozinho, ele mesmo), e o dano conta para quem confundiu. O Z-Move e a Investida não gastam a confusão.',
  fear: 'Por {seg} s o alvo recua, uma casa por vez, sem atacar, e as recargas dele param.',
  rock_smash: 'O alvo perde {pct}% da DEF e da SP.DEF por {seg} s, e o time inteiro aproveita.',
  whirlwind: 'Empurra o alvo para o fundo do lado dele, na mesma coluna (para antes de quem estiver no caminho), e causa {pct}% do HP máximo dele.',
  assurance: 'Causa {pct}% do HP máximo do alvo mais {faltando}% do HP que falta a ele.',
  charm: 'Puxa o inimigo mais longe para a casa livre mais à frente do lado dele e causa {pct}% do HP máximo dele.',
  recover: 'Cura {pct}% do HP máximo do mais ferido do time (ele incluso). Só conta quem tem BST até {bst}, para disparar e para receber. Depois, volta só após um ciclo completo.'
}
const CURTO = {
  rocky_helmet: 'Devolve {pct}% do dano que recebe',
  rain_dance: '+{pct}% de dano e recarga {recarga}% mais rápida no time',
  swarm: '+{pct}% de dano, +{porInseto}% por Inseto (até {teto}%)',
  intimidate: 'Inimigos causam {pct}% menos dano',
  iron_defense: '+{pct}% de DEF e SP.DEF',
  burn: '{pct}% do HP por segundo, {seg} s',
  poison: '{pct}% do HP por segundo, {seg} s',
  freeze: 'Parado {seg} s e +{danoRecebido}% de dano recebido',
  paralyze: 'Recargas +{atraso} s, {recarga}% mais lentas, {falha}% de falha',
  leech_seed: 'Drena {pct}% por segundo e cura quem plantou',
  dig: 'Desvia do próximo golpe',
  confusion: 'O próximo golpe dele acerta um aliado',
  fear: 'Recua {seg} s sem atacar',
  rock_smash: '−{pct}% de DEF e SP.DEF por {seg} s',
  whirlwind: 'Empurra para o fundo e causa {pct}% do HP',
  assurance: '{pct}% do HP máximo + {faltando}% do que falta',
  charm: 'Puxa o mais longe para a frente e causa {pct}% do HP',
  recover: 'Cura {pct}% do mais ferido do time'
}
const GATILHO = {
  [P.GATILHO_INICIO]: { curto: 'Início', longo: 'No começo da luta.' },
  [P.GATILHO_CICLO]: { curto: 'Ciclo', longo: 'No começo e a cada ciclo.' },
  [P.GATILHO_CURA]: { curto: 'HP {gatilhoHp}%', longo: 'Quando ele ou um aliado de BST até {bst} cai a {gatilhoHp}% do HP.' }
}
const ALVO = {
  rocky_helmet: 'Quem bate nele', rain_dance: 'Ele e os aliados de BST até {bst}', swarm: 'Ele mesmo', intimidate: 'Todos os inimigos',
  iron_defense: 'Ele mesmo', dig: 'Ele mesmo', charm: 'O inimigo mais longe', recover: 'O mais ferido do time (BST até {bst})'
}
const ALVO_CICLO = 'No começo, o inimigo mais perto; depois, quem ele está atacando'
const NO_INIMIGO = new Set(['rocky_helmet', 'intimidate', 'burn', 'poison', 'freeze', 'paralyze', 'leech_seed', 'dig', 'confusion', 'fear', 'rock_smash', 'whirlwind', 'assurance', 'charm'])

const preencher = (txt, n) => txt.replace(/\{(\w+)\}/g, (_, k) => n[k] ?? '')
const $ = (id) => document.getElementById(id)
const reduzido = matchMedia('(prefers-reduced-motion: reduce)')
const ehNum = (v) => v != null && v !== '' && Number.isFinite(Number(v))

function el(tag, attrs = {}, filhos = []) {
  const n = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'text') n.textContent = v
    else if (k === 'class') n.className = v
    else if (k === 'style') n.style.cssText = v
    else n.setAttribute(k, v === true ? '' : v)
  }
  for (const f of [].concat(filhos)) if (f != null && f !== false) n.append(f)
  return n
}
function imgSprite(looktype, speciesId) {
  const img = el('img', { alt: '', decoding: 'async', draggable: 'false' })
  const tentativas = [...new Set([looktype, 60000 + Number(speciesId)].filter(ehNum).map(Number))].map((l) => `${SPRITES}${l}.png`)
  const proxima = () => {
    const url = tentativas.shift()
    if (url) img.src = url
    else { img.onerror = null; img.src = BOLA; img.classList.add('bola') }
  }
  img.onerror = proxima
  proxima()
  return img
}

const LISTA = P.ORDEM_PASSIVAS.map((id) => {
  const p = P.PASSIVAS[id]
  const n = P.numerosDaPassiva(p)
  const especies = [...P.PASSIVA_POR_ESPECIE].filter(([, pid]) => pid === id).map(([sp]) => sp)
  return {
    id, p, n, especies,
    nome: p.nome, tipo: p.tipo, icone: p.icone,
    inimigo: NO_INIMIGO.has(id),
    gatCurto: preencher(GATILHO[p.gatilho]?.curto ?? '', n),
    gatLongo: preencher(GATILHO[p.gatilho]?.longo ?? '', n),
    alvo: ALVO[id] ? preencher(ALVO[id], n) : ALVO_CICLO,
    curto: preencher(CURTO[id], n),
    desc: preencher(DESC[id], n)
  }
})
const PORID = new Map(LISTA.map((x) => [x.id, x]))

let motor = null
const especieCache = new Map()
async function carregarMotor() {
  if (!motor) motor = import('../calculadora/motor.js').then(async (m) => { await m.carregar(); return m })
  return motor
}
function especie(id) {
  if (especieCache.has(id)) return especieCache.get(id)
  let e = null
  try { e = motor && motorPronto ? motorPronto.especie(id) : null } catch {}
  if (e) especieCache.set(id, e)
  return e
}
let motorPronto = null

const estado = { sel: 'charm', filtro: 'todas', caster: null }

function lerHash() {
  const h = decodeURIComponent(location.hash.slice(1))
  if (PORID.has(h)) estado.sel = h
}
function gravarHash() {
  history.replaceState(null, '', `#${estado.sel}`)
}

function montarLista() {
  const corpo = $('pas-linhas')
  corpo.replaceChildren(...LISTA.filter((x) => estado.filtro === 'todas' || (estado.filtro === 'inimigo') === x.inimigo).map((x) => {
    const b = el('button', { type: 'button', class: `pas-linha${x.id === estado.sel ? ' sel' : ''}`, style: `--t:${COR_TIPO[x.tipo]}`, 'data-id': x.id, 'aria-pressed': String(x.id === estado.sel) }, [
      el('span', { class: 'pas-ic', 'aria-hidden': 'true', text: x.icone }),
      el('span', { class: 'pas-linha-txt' }, [
        el('span', { class: 'pas-linha-topo' }, [el('b', { text: x.nome }), el('span', { class: 'pas-tipo', text: NOME_TIPO[x.tipo] })]),
        el('span', { class: 'pas-linha-ef', text: x.curto })
      ]),
      el('span', { class: `pas-gat g-${x.p.gatilho}`, text: x.gatCurto })
    ])
    return b
  }))
  document.querySelectorAll('[data-filtro]').forEach((b) => {
    const on = b.dataset.filtro === estado.filtro
    b.classList.toggle('ativo', on)
    b.setAttribute('aria-pressed', String(on))
  })
}

function escolher(id, rolar = false) {
  if (!PORID.has(id)) return
  estado.sel = id
  estado.caster = null
  gravarHash()
  montarLista()
  montarDetalhe()
  if (rolar && matchMedia('(max-width: 980px)').matches) $('pas-palco').scrollIntoView({ behavior: reduzido.matches ? 'auto' : 'smooth', block: 'start' })
}

function casterPadrao(x) {
  if (estado.caster != null) return estado.caster
  if (!motorPronto) return x.especies.find((s) => s <= 1025) ?? x.especies[0]
  const ok = x.especies.filter((s) => especie(s))
  return ok.find((s) => s <= 1025) ?? ok[0] ?? x.especies[0]
}

function montarDetalhe() {
  const x = PORID.get(estado.sel)
  const palco = $('pas-palco')
  palco.style.setProperty('--t', COR_TIPO[x.tipo])
  $('pas-cab').replaceChildren(
    el('span', { class: 'pas-ic grande', 'aria-hidden': 'true', text: x.icone }),
    el('span', { class: 'pas-cab-txt' }, [
      el('h2', { text: x.nome }),
      el('span', { class: 'pas-cab-chips' }, [
        el('span', { class: 'pas-tipo', text: NOME_TIPO[x.tipo] }),
        el('span', { class: `pas-lado ${x.inimigo ? 'ini' : 'time'}`, text: x.inimigo ? 'Afeta o inimigo' : 'Ajuda o time' })
      ])
    ])
  )
  $('pas-fatos').replaceChildren(
    fato('Quando', x.gatLongo),
    fato('Alvo', x.alvo),
    fato('Efeito', x.desc)
  )
  montarQuemTem(x)
  iniciarCena(x)
}
function fato(rot, txt) {
  return el('div', { class: 'pas-fato' }, [el('dt', { text: rot }), el('dd', { text: txt })])
}

function montarQuemTem(x) {
  const caixa = $('pas-quem')
  const titulo = el('h3', {}, [`Quem tem`, el('span', { class: 'pas-n', text: String(x.especies.length) })])
  if (!motorPronto) {
    caixa.replaceChildren(titulo, el('p', { class: 'pas-carregando', text: 'Carregando pokémon…' }))
    return
  }
  const itens = x.especies.map((s) => ({ s, e: especie(s) })).filter((i) => i.e)
  itens.sort((a, b) => a.e.nome.localeCompare(b.e.nome, 'pt-BR'))
  const atual = casterPadrao(x)
  caixa.replaceChildren(titulo, el('div', { class: 'pas-quem-lista' }, itens.map(({ s, e }) => {
    const b = el('button', { type: 'button', class: `pas-pk${s === atual ? ' sel' : ''}`, 'data-sp': String(s), title: `Ver ${e.nome} no tabuleiro` }, [
      el('span', { class: 'pas-pk-img' }, [imgSprite(e.looktype, s)]),
      el('span', { class: 'pas-pk-nome', text: e.nome })
    ])
    return b
  })))
}

const FILEIRAS = [[1, 6], [0, 7], [0, 7], [2, 5], [2, 5]]
const valida = (col, f) => f >= 0 && f < 5 && col >= FILEIRAS[f][0] && col <= FILEIRAS[f][1]
const yDe = (lado, f) => (lado === 'ini' ? 12 - f : 13 + f)

let cena = null

function montarTabuleiro(doisLados) {
  const tab = $('pas-tab')
  tab.classList.toggle('so-time', !doisLados)
  const casas = new Map()
  const filhos = []
  if (doisLados) filhos.push(el('span', { class: 'pas-canto deles', text: 'Inimigo' }))
  const linha = (lado, f) => {
    for (let col = 0; col < 8; col++) {
      if (!valida(col, f)) { filhos.push(el('span', { class: 'pas-fora' })); continue }
      const c = el('span', { class: `pas-casa ${lado}${(col + f) % 2 ? ' alt' : ''}` })
      casas.set(`${lado}:${col}:${f}`, c)
      filhos.push(c)
    }
  }
  if (doisLados) for (let f = 4; f >= 0; f--) linha('ini', f)
  const meio = el('span', { class: 'pas-meio', 'aria-hidden': 'true' })
  meio.innerHTML = '<svg class="pas-emblema" viewBox="0 0 100 100"><circle class="e-claro" cx="50" cy="50" r="48"/><path class="e-vermelho" d="M2 50a48 48 0 0 1 96 0z"/><rect class="e-faixa" x="2" y="47" width="96" height="6"/><circle class="e-faixa" cx="50" cy="50" r="13"/><circle class="e-botao" cx="50" cy="50" r="8"/></svg>'
  filhos.push(meio)
  for (let f = 0; f < 5; f++) linha('nos', f)
  filhos.push(el('span', { class: 'pas-canto nosso', text: 'Seu time' }))
  const camada = el('div', { class: 'pas-camada' })
  filhos.push(camada)
  tab.replaceChildren(...filhos)
  return { tab, casas, camada }
}

class Cena {
  constructor(x, doisLados) {
    this.x = x
    this.vivo = true
    this.pecas = []
    this.vel = reduzido.matches ? 0 : 1
    const { tab, casas, camada } = montarTabuleiro(doisLados)
    this.tab = tab; this.casas = casas; this.camada = camada
    this.ro = new ResizeObserver(() => this.reposicionar())
    this.ro.observe(tab)
  }
  parar() { this.vivo = false; this.ro.disconnect(); clearTimeout(this.tLoop) }
  casa(lado, col, f) { return this.casas.get(`${lado}:${col}:${f}`) }
  geo(lado, col, f) {
    const c = this.casa(lado, col, f)
    return { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth }
  }
  peca(lado, col, f, { sp = DITTO, lt = null, hp = 100, papel = 'teste', rotulo = null } = {}) {
    const n = el('div', { class: `pas-peca ${lado} ${papel}` }, [
      el('span', { class: 'pas-peca-img' }, [imgSprite(lt, sp)]),
      el('span', { class: 'pas-st' }),
      el('span', { class: 'pas-hp' }, [el('i')]),
      rotulo ? el('span', { class: 'pas-rot', text: rotulo }) : null
    ])
    this.camada.append(n)
    const p = { n, lado, col, f, hp }
    this.pecas.push(p)
    this.por(p)
    this.vida(p, hp, 0)
    return p
  }
  por(p) {
    const g = this.geo(p.lado, p.col, p.f)
    p.n.style.left = `${g.x}px`; p.n.style.top = `${g.y}px`; p.n.style.width = `${g.w}px`; p.n.style.height = `${g.w}px`
  }
  reposicionar() { for (const p of this.pecas) this.por(p) }
  centro(p) { const g = this.geo(p.lado, p.col, p.f); return { x: g.x + g.w / 2, y: g.y + g.w / 2, w: g.w } }
  ms(v) { return v * this.vel }
  async espera(ms) {
    if (!this.vivo) throw new Error('fim')
    await new Promise((ok) => setTimeout(ok, this.vel ? ms : Math.min(ms, 400)))
    if (!this.vivo) throw new Error('fim')
  }
  async mover(p, col, f, ms = 500, arco = 0) {
    const a = this.geo(p.lado, p.col, p.f)
    p.col = col; p.f = f
    const b = this.geo(p.lado, col, f)
    this.por(p)
    if (!this.ms(ms)) return this.espera(0)
    const dx = a.x - b.x, dy = a.y - b.y
    const meio = arco ? [{ transform: `translate(${dx / 2}px, ${dy / 2 - arco * b.w}px) scale(1.15)`, offset: 0.5 }] : []
    await p.n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, ...meio, { transform: 'translate(0, 0)' }], { duration: this.ms(ms), easing: 'cubic-bezier(.45,.05,.35,1)' }).finished.catch(() => {})
    if (!this.vivo) throw new Error('fim')
  }
  async investida(p, alvo, ms = 380) {
    const a = this.centro(p), b = this.centro(alvo)
    const dx = (b.x - a.x) * 0.45, dy = (b.y - a.y) * 0.45
    if (!this.ms(ms)) return this.espera(0)
    await p.n.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${dx}px, ${dy}px)`, offset: 0.45 }, { transform: 'translate(0,0)' }], { duration: this.ms(ms), easing: 'ease-in-out' }).finished.catch(() => {})
    if (!this.vivo) throw new Error('fim')
  }
  async golpe(de, para, emoji, ms = 520, classe = '') {
    const a = this.centro(de), b = this.centro(para)
    const o = el('span', { class: `pas-proj ${classe}`, text: emoji, style: `left:${a.x}px;top:${a.y}px;font-size:${Math.max(14, a.w * 0.5)}px` })
    this.camada.append(o)
    if (this.ms(ms)) await o.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0.2 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.2 }, { transform: `translate(calc(-50% + ${b.x - a.x}px), calc(-50% + ${b.y - a.y}px)) scale(1.1)`, opacity: 1 }], { duration: this.ms(ms), easing: 'cubic-bezier(.3,.1,.4,1)' }).finished.catch(() => {})
    o.remove()
    if (!this.vivo) throw new Error('fim')
    this.impacto(para)
  }
  impacto(p) {
    if (!this.vel) return
    p.n.animate([{ filter: 'brightness(2.2)' }, { filter: 'brightness(1)' }], { duration: 260 })
    p.n.animate([{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 200 })
  }
  texto(p, txt, tipo = 'dano') {
    const c = this.centro(p)
    const o = el('span', { class: `pas-txt ${tipo}`, text: txt, style: `left:${c.x}px;top:${c.y - c.w * 0.35}px` })
    this.camada.append(o)
    const fim = () => o.remove()
    if (!this.vel) { setTimeout(fim, 900); return }
    o.animate([{ transform: 'translate(-50%, 0) scale(.7)', opacity: 0 }, { transform: 'translate(-50%, -60%) scale(1.05)', opacity: 1, offset: 0.2 }, { transform: 'translate(-50%, -140%) scale(1)', opacity: 0 }], { duration: 1300, easing: 'ease-out' }).finished.then(fim, fim)
  }
  vida(p, v, ms = 350) {
    p.hp = Math.max(0, Math.min(100, v))
    const i = p.n.querySelector('.pas-hp i')
    i.style.transition = `width ${this.ms(ms)}ms ease`
    i.style.width = `${p.hp}%`
    i.classList.toggle('baixo', p.hp <= 50)
  }
  status(p, txt) {
    const s = p.n.querySelector('.pas-st')
    s.textContent = txt || ''
    s.classList.toggle('on', !!txt)
  }
  marca(p, classe, on = true) { p.n.classList.toggle(classe, on) }
  efeito(classe, sobre = 'nos', on = true) {
    let o = this.camada.querySelector(`.pas-fx.${classe}`)
    if (!on) { o?.remove(); return }
    const cs = [...this.casas.entries()].filter(([k]) => k.startsWith(`${sobre}:`)).map(([, c]) => c)
    const x0 = Math.min(...cs.map((c) => c.offsetLeft)), y0 = Math.min(...cs.map((c) => c.offsetTop))
    const x1 = Math.max(...cs.map((c) => c.offsetLeft + c.offsetWidth)), y1 = Math.max(...cs.map((c) => c.offsetTop + c.offsetHeight))
    if (!o) { o = el('span', { class: `pas-fx ${classe}` }); this.camada.prepend(o) }
    Object.assign(o.style, { left: `${x0 - 4}px`, top: `${y0 - 4}px`, width: `${x1 - x0 + 8}px`, height: `${y1 - y0 + 8}px` })
  }
  onda(p, cor) {
    const c = this.centro(p)
    const o = el('span', { class: 'pas-onda', style: `left:${c.x}px;top:${c.y}px;--c:${cor}` })
    this.camada.append(o)
    const fim = () => o.remove()
    if (!this.vel) { fim(); return }
    o.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(9)', opacity: 0 }], { duration: 1100, easing: 'ease-out' }).finished.then(fim, fim)
  }
  legenda(txt) {
    const l = $('pas-passo')
    l.textContent = txt
    if (this.vel) l.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260 })
  }
}

const pct = (v) => `${String(v).replace('.', ',')}%`

function elenco(c, x, { aliadosInseto = false, aliadoForte = false } = {}) {
  const sp = casterPadrao(x)
  const e = motorPronto ? especie(sp) : null
  const C = c.peca('nos', 3, 0, { sp, lt: e?.looktype, papel: 'dono' })
  const outrosInseto = aliadosInseto ? x.especies.filter((s) => s !== sp && especie(s)).slice(0, 2) : []
  const a1 = outrosInseto[0] ?? DITTO
  const a2 = outrosInseto[1] ?? (aliadoForte ? DRAGONITE : DITTO)
  const A1 = c.peca('nos', 5, 1, { sp: a1, lt: especie(a1)?.looktype, papel: 'aliado' })
  const A2 = c.peca('nos', 1, 2, { sp: a2, lt: especie(a2)?.looktype, papel: 'aliado', rotulo: aliadoForte ? 'BST > 500' : null })
  return { C, A1, A2 }
}
function inimigos(c) {
  return {
    E1: c.peca('ini', 3, 0), E2: c.peca('ini', 6, 1), E3: c.peca('ini', 1, 1), E4: c.peca('ini', 4, 2), E5: c.peca('ini', 3, 4)
  }
}

const CENAS = {
  async rocky_helmet(c, x) {
    const { C } = elenco(c, x); const { E1 } = inimigos(c)
    c.status(C, x.icone); c.legenda('A passiva fica ativa a luta toda.')
    await c.espera(900)
    for (let i = 0; i < 2; i++) {
      c.legenda('O inimigo bate nele…')
      await c.investida(E1, C); c.impacto(C); c.texto(C, '−10%'); c.vida(C, C.hp - 10)
      await c.espera(250)
      c.legenda(`…e leva de volta ${pct(x.n.pct)} do dano do golpe.`)
      await c.golpe(C, E1, '⛰️', 380); c.texto(E1, `−${pct(x.n.pct)} do dano`, 'refl'); c.vida(E1, E1.hp - 2)
      await c.espera(900)
    }
  },
  async rain_dance(c, x) {
    const { C, A1, A2 } = elenco(c, x, { aliadoForte: true })
    c.legenda('No começo da luta, começa a chover no seu lado.')
    await c.espera(500); c.efeito('chuva', 'nos'); await c.espera(700)
    for (const p of [C, A1]) { c.status(p, '🌧️'); c.texto(p, `+${pct(x.n.pct)} dano`, 'buff') }
    c.legenda(`Ele e os aliados de BST até ${x.n.bst}: +${pct(x.n.pct)} de dano e recarga ${pct(x.n.recarga)} mais rápida.`)
    await c.espera(1600)
    c.texto(A2, 'não recebe', 'nada'); c.marca(A2, 'apagado')
    c.legenda(`Aliado de BST acima de ${x.n.bst} não recebe. Duas Rain Dance não somam.`)
    await c.espera(2000)
  },
  async swarm(c, x) {
    const { C, A1, A2 } = elenco(c, x, { aliadosInseto: true })
    c.legenda('No começo da luta, ele conta os outros Insetos do time.')
    await c.espera(900)
    c.status(C, '🐝'); c.texto(C, `+${pct(x.n.pct)}`, 'buff'); await c.espera(700)
    for (const p of [A1, A2]) { c.onda(p, '#94a61a'); c.texto(p, `+${pct(x.n.porInseto)}`, 'buff'); await c.espera(600) }
    const total = Math.min(Number(String(x.n.teto).replace(',', '.')), Number(String(x.n.pct).replace(',', '.')) + 2 * Number(String(x.n.porInseto).replace(',', '.')))
    c.texto(C, `= +${pct(total)} de dano`, 'buff')
    c.legenda(`+${pct(x.n.pct)} e mais ${pct(x.n.porInseto)} por Inseto, até +${pct(x.n.teto)}, a luta toda.`)
    await c.espera(2200)
  },
  async intimidate(c, x) {
    const { C } = elenco(c, x); const E = inimigos(c)
    c.legenda('No começo da luta, ele intimida o lado inimigo.')
    await c.espera(700); c.onda(C, '#6a35ea'); await c.espera(500)
    for (const p of Object.values(E)) { c.status(p, '🐉'); c.texto(p, `−${pct(x.n.pct)} dano`, 'deb') }
    c.legenda(`Todos os inimigos causam ${pct(x.n.pct)} menos dano de golpe. Só vale se ele for o único Dragão do time.`)
    await c.espera(1200)
    await c.investida(E.E1, C); c.impacto(C); c.texto(C, 'dano menor', 'nada')
    await c.espera(1800)
  },
  async iron_defense(c, x) {
    const { C } = elenco(c, x)
    c.legenda('No começo da luta, ele levanta a guarda.')
    await c.espera(700); c.onda(C, '#8c8cae'); c.status(C, '🔩'); c.marca(C, 'escudo')
    c.texto(C, `+${pct(x.n.pct)} DEF e SP.DEF`, 'buff')
    c.legenda(`+${pct(x.n.pct)} de DEF e SP.DEF, a luta toda.`)
    await c.espera(2600)
  },
  async burn(c, x) { await dot(c, x, '🔥', 'queima') },
  async poison(c, x) { await dot(c, x, '☠️', 'veneno') },
  async freeze(c, x) {
    const { C, A1 } = elenco(c, x); const { E1 } = inimigos(c)
    c.legenda('No começo da luta, mira no inimigo mais perto.')
    await c.espera(600); await c.golpe(C, E1, '❄️')
    c.status(E1, '❄️'); c.marca(E1, 'gelo')
    c.legenda(`Por ${x.n.seg} s ele não ataca nem anda e as recargas param.`)
    await c.espera(1000)
    c.legenda(`Enquanto isso, toma ${pct(x.n.danoRecebido)} a mais de dano de golpe.`)
    await c.golpe(A1, E1, '✦', 420); c.texto(E1, `+${pct(x.n.danoRecebido)}`, 'deb'); c.vida(E1, E1.hp - 14)
    await c.espera(900); c.marca(E1, 'gelo', false); c.status(E1, ''); c.legenda('Depois, repete a cada ciclo, em quem ele estiver atacando.')
    await c.espera(1400)
  },
  async paralyze(c, x) {
    const { C } = elenco(c, x); const { E1 } = inimigos(c)
    c.legenda('No começo da luta, mira no inimigo mais perto.')
    await c.espera(600); await c.golpe(C, E1, '⚡', 380)
    c.status(E1, '🌩️'); c.marca(E1, 'choque')
    c.texto(E1, `recargas +${String(x.n.atraso).replace('.', ',')} s`, 'deb')
    c.legenda(`Na hora, as recargas dele atrasam ${x.n.atraso} s.`)
    await c.espera(1500)
    c.legenda(`Por ${x.n.seg} s, recargas ${pct(x.n.recarga)} mais lentas e ${pct(x.n.falha)} de chance de cada ataque falhar.`)
    await c.investida(E1, C); c.texto(E1, 'Falhou!', 'nada')
    await c.espera(1800); c.marca(E1, 'choque', false)
  },
  async leech_seed(c, x) {
    const { C } = elenco(c, x); const { E1 } = inimigos(c)
    c.vida(C, 70, 0)
    c.legenda('No começo da luta, planta uma semente no inimigo mais perto.')
    await c.espera(600); await c.golpe(C, E1, '🌱'); c.status(E1, '🌱')
    c.legenda(`Drena ${pct(x.n.pct)} do HP máximo dele por segundo durante ${x.n.seg} s e cura quem plantou no mesmo tanto.`)
    for (let i = 0; i < 4; i++) {
      c.texto(E1, `−${pct(x.n.pct)}`); c.vida(E1, E1.hp - 4)
      await c.golpe(E1, C, '✚', 420, 'cura'); c.texto(C, `+${pct(x.n.pct)}`, 'cura'); c.vida(C, C.hp + 4)
      await c.espera(250)
    }
    c.legenda(`A cura vai até ${pct(x.n.curaMax)} do HP máximo de quem plantou.`)
    await c.espera(1800)
  },
  async dig(c, x) {
    const { C } = elenco(c, x); const { E2 } = inimigos(c)
    c.status(C, '🕳️'); c.legenda('Ele fica pronto para desviar do próximo golpe.')
    await c.espera(900)
    c.legenda('Quando o golpe vem, ele some no chão…')
    const ida = c.golpe(E2, C, '✦', 650)
    await c.espera(330); c.marca(C, 'cavando')
    await ida; c.texto(C, 'Esquivou!', 'nada')
    await c.espera(500); c.marca(C, 'cavando', false); c.status(C, '')
    c.legenda(`…e não toma dano. O Z-Move não é desviado.`)
    await c.espera(1400); c.status(C, '🕳️'); c.legenda('No próximo ciclo, ele fica pronto de novo.')
    await c.espera(1600)
  },
  async confusion(c, x) {
    const { C } = elenco(c, x); const { E1, E4 } = inimigos(c)
    c.legenda('No começo da luta, confunde o inimigo mais perto.')
    await c.espera(600); await c.golpe(C, E1, '💫'); c.status(E1, '💫'); c.texto(E1, 'Confuso!', 'nada')
    await c.espera(900)
    c.legenda('O próximo golpe dele acerta o aliado mais perto dele…')
    await c.golpe(E1, E4, '✦', 520); c.texto(E4, '−12%'); c.vida(E4, E4.hp - 12); c.status(E1, '')
    c.legenda('…e o dano conta para quem confundiu. O Z-Move e a Investida não gastam a confusão.')
    await c.espera(2400)
  },
  async fear(c, x) {
    const { C } = elenco(c, x); const { E1 } = inimigos(c)
    c.legenda('No começo da luta, assusta o inimigo mais perto.')
    await c.espera(600); await c.golpe(C, E1, '👻'); c.status(E1, '👻'); c.marca(E1, 'medo')
    c.legenda(`Por ${x.n.seg} s ele recua, uma casa por vez, sem atacar, e as recargas param.`)
    for (const f of [1, 2, 3]) { await c.mover(E1, 3, f, 520); await c.espera(380) }
    c.marca(E1, 'medo', false); c.status(E1, '')
    c.legenda('Depois volta a lutar, longe de onde estava.')
    await c.espera(1800)
  },
  async rock_smash(c, x) {
    const { C, A1, A2 } = elenco(c, x); const { E1 } = inimigos(c)
    c.legenda('No começo da luta, quebra a defesa do inimigo mais perto.')
    await c.espera(600); await c.investida(C, E1); c.impacto(E1); c.status(E1, '👊'); c.marca(E1, 'quebrado')
    c.texto(E1, `−${pct(x.n.pct)} DEF e SP.DEF`, 'deb')
    c.legenda(`Por ${x.n.seg} s ele perde ${pct(x.n.pct)} da DEF e da SP.DEF, e o time inteiro aproveita.`)
    await c.espera(900)
    await Promise.all([c.golpe(A1, E1, '✦', 500), c.golpe(A2, E1, '✦', 600)])
    c.texto(E1, 'mais dano', 'deb'); c.vida(E1, E1.hp - 22)
    await c.espera(2000); c.marca(E1, 'quebrado', false)
  },
  async whirlwind(c, x) {
    const { C } = elenco(c, x); const { E1 } = inimigos(c)
    c.legenda('No começo da luta, sopra o inimigo mais perto.')
    await c.espera(600); await c.golpe(C, E1, '🌪️', 450)
    c.texto(E1, `−${pct(x.n.pct)}`); c.vida(E1, E1.hp - 15)
    c.legenda('Ele é empurrado para o fundo, na mesma coluna, e para antes de quem estiver no caminho.')
    c.marca(E1, 'girando')
    await c.mover(E1, 3, 3, 900)
    c.marca(E1, 'girando', false)
    await c.espera(2200)
  },
  async assurance(c, x) {
    const { C } = elenco(c, x); const { E1 } = inimigos(c)
    c.vida(E1, 60, 0)
    c.legenda('No começo da luta, golpeia o inimigo mais perto (aqui, com 60% do HP).')
    await c.espera(900); await c.golpe(C, E1, '🌑', 450)
    const p1 = Number(String(x.n.pct).replace(',', '.')), p2 = Number(String(x.n.faltando).replace(',', '.'))
    const extra = Math.round((40 * p2) / 100 * 10) / 10
    c.texto(E1, `−${pct(p1)} −${pct(extra)}`); c.vida(E1, E1.hp - p1 - extra)
    c.legenda(`${pct(p1)} do HP máximo mais ${pct(p2)} do HP que falta a ele: quanto mais ferido, mais dói.`)
    await c.espera(2600)
  },
  async charm(c, x) {
    const { C } = elenco(c, x); const { E5 } = inimigos(c)
    c.legenda('No começo da luta, mira no inimigo mais longe.')
    await c.espera(500); c.marca(E5, 'mira'); await c.espera(700)
    await c.golpe(C, E5, '💗', 650)
    c.marca(E5, 'mira', false); c.status(E5, '💗')
    c.legenda('Ele é puxado para a casa livre mais à frente do lado dele…')
    await c.mover(E5, 4, 0, 950, 1.2)
    c.texto(E5, `−${pct(x.n.pct)}`); c.vida(E5, E5.hp - 10)
    c.legenda(`…e toma ${pct(x.n.pct)} do HP máximo dele. Agora ele está na linha de frente.`)
    await c.espera(2400)
  },
  async recover(c, x) {
    const { C, A1 } = elenco(c, x)
    c.legenda(`Quando ele ou um aliado de BST até ${x.n.bst} cai a ${x.n.gatilhoHp}% do HP…`)
    await c.espera(700)
    for (const d of [25, 30]) { c.impacto(A1); c.texto(A1, `−${d}%`); c.vida(A1, A1.hp - d); await c.espera(650) }
    c.onda(C, '#4ade80'); await c.golpe(C, A1, '💚', 480, 'cura')
    c.texto(A1, `+${pct(x.n.pct)}`, 'cura'); c.vida(A1, A1.hp + Number(String(x.n.pct).replace(',', '.')))
    c.legenda(`…cura ${pct(x.n.pct)} do HP máximo do mais ferido do time. Depois, só volta após um ciclo completo.`)
    await c.espera(2600)
  }
}
async function dot(c, x, emoji, classe) {
  const { C } = elenco(c, x); const { E1 } = inimigos(c)
  c.legenda('No começo da luta, mira no inimigo mais perto.')
  await c.espera(600); await c.golpe(C, E1, emoji); c.status(E1, emoji); c.marca(E1, classe)
  c.legenda(`Ele perde ${pct(x.n.pct)} do HP máximo por segundo durante ${x.n.seg} s (${pct(x.n.total)} no total).`)
  const passo = Number(String(x.n.total).replace(',', '.')) / 5
  for (let i = 0; i < 5; i++) { await c.espera(520); c.texto(E1, `−${pct(x.n.pct)}`); c.vida(E1, E1.hp - passo, 400) }
  c.marca(E1, classe, false); c.status(E1, '')
  c.legenda('Depois, repete a cada ciclo, em quem ele estiver atacando.')
  await c.espera(1800)
}

function iniciarCena(x) {
  cena?.parar()
  const c = new Cena(x, x.inimigo)
  cena = c
  $('pas-legenda-tab').textContent = x.inimigo ? 'Os Ditto são pokémon de teste.' : 'Os Ditto são aliados de teste.'
  const rodar = async () => {
    if (!c.vivo) return
    try {
      await CENAS[x.id](c, x)
      if (!c.vivo) return
      c.tLoop = setTimeout(() => { if (c.vivo) { c.camada.replaceChildren(); c.pecas = []; rodar() } }, 900)
    } catch {}
  }
  requestAnimationFrame(() => requestAnimationFrame(rodar))
}

function montarCiclo() {
  const desde = new Date(P.PASSIVAS_DESDE_MS)
  const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(desde)
  const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(desde)
  const ja = P.passivasNoAr()
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const fora = P.CAMPEONATOS_SEM_PASSIVA.filter((d) => d >= hoje).map((d) => d.slice(8, 10) + '/' + d.slice(5, 7))
  $('pas-quando').replaceChildren(
    el('li', {}, [el('b', { text: ja ? 'Já valem' : `A partir de ${dia}, ${hora}` }), ja ? ' no Ranqueado, nos torneios e no Ginásio' : ' no Ranqueado, nos torneios e no Ginásio (horário de Brasília)']),
    el('li', {}, [el('b', { text: 'Já valem' }), ' no Amistoso e no Treinamento']),
    ...fora.map((d) => el('li', {}, [el('b', { text: 'Fora' }), ` do Mundial de ${d}, que fica no formato antigo`]))
  )
}

function ligar() {
  $('pas-linhas').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) escolher(b.dataset.id, true) })
  document.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => { estado.filtro = b.dataset.filtro; montarLista() }))
  $('pas-quem').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sp]')
    if (!b) return
    estado.caster = Number(b.dataset.sp)
    montarQuemTem(PORID.get(estado.sel))
    iniciarCena(PORID.get(estado.sel))
  })
  $('pas-repetir').addEventListener('click', () => iniciarCena(PORID.get(estado.sel)))
  addEventListener('hashchange', () => { lerHash(); escolher(estado.sel) })
}

lerHash()
ligar()
montarCiclo()
montarLista()
montarDetalhe()
carregarMotor().then((m) => { motorPronto = m; montarQuemTem(PORID.get(estado.sel)); iniciarCena(PORID.get(estado.sel)) }).catch(() => {
  $('pas-quem').querySelector('.pas-carregando')?.replaceChildren('Não deu para carregar a lista agora.')
})
