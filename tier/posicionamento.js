const SPRITES = '../calculadora/jogo/sprites-png/'
const BOLA = '../assets/pokebola.svg'
const FILEIRAS = [[12, 17], [11, 18], [11, 18], [13, 16], [13, 16]]
const CASAS = (() => {
  const l = []
  FILEIRAS.forEach(([de, ate], fileira) => { for (let cx = de; cx <= ate; cx++) l.push({ casa: l.length, fileira, cx }) })
  return l
})()
const fmt = new Intl.NumberFormat('pt-BR')
const fmtDia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const ehNum = (v) => v != null && v !== '' && Number.isFinite(Number(v))
const $ = (id) => document.getElementById(id)
const ICO = {
  semana: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  topo: '<path d="M8 3.5h8V9a4 4 0 0 1-8 0zM12 13v3.5M8.5 20.5h7M8 5.5H5.5c0 2.6 1.2 4 3 4.3M16 5.5h2.5c0 2.6-1.2 4-3 4.3"/>',
  formacoes: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>',
  hora: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  usados: '<path d="M5 20v-6M12 20V5M19 20v-9"/>',
  pontos: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  vitorias: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l2.7 2.7L16.5 9"/>',
  frente: '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>'
}

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
function ico(nome) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor')
  s.setAttribute('stroke-width', '2.1'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true')
  s.innerHTML = ICO[nome]
  return s
}
function sprite(p) {
  const img = el('img', { alt: '', loading: 'lazy', decoding: 'async' })
  const tentativas = [...new Set([p.looktype, 60000 + Number(p.speciesId)].filter(ehNum).map(Number))].map((l) => `${SPRITES}${l}.png`)
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
const zona = (casa) => { const f = CASAS[casa]?.fileira ?? 0; return f === 0 ? 'frente' : f <= 2 ? 'meio' : 'fundo' }
const alcance = (a) => (a > 1 ? `alcance ${a}` : 'corpo a corpo')
function indicador(icone, texto, titulo) {
  return el('li', { class: `ind ind-${icone}`, title: titulo || null }, [ico(icone), el('span', { text: texto })])
}

let dados = null
let carregando = null

function aba() { return location.hash === '#posicionamento' ? 'pos' : 'tier' }

function aplicarAba() {
  const v = aba()
  document.documentElement.classList.toggle('ver-pos', v === 'pos')
  document.querySelectorAll('[data-vista]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.vista === v)))
  if (v === 'pos') carregar()
}

async function carregar() {
  if (dados || carregando) return carregando
  const corpo = $('pos-corpo')
  corpo.replaceChildren(el('div', { class: 'carga vao' }, [el('img', { class: 'carga-bola', src: BOLA, alt: '' }), el('b', { text: 'Carregando as formações' })]))
  carregando = (async () => {
    try {
      const r = await fetch('posicionamento.json', { cache: 'no-cache' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      dados = await r.json()
      pintar()
    } catch {
      const tentar = el('button', { type: 'button', class: 'botao pequeno', text: 'Tentar de novo' })
      tentar.onclick = () => { carregando = null; carregar() }
      corpo.replaceChildren(el('div', { class: 'carga vao falhou' }, [el('b', { text: 'Não deu para carregar as formações agora.' }), tentar]))
    } finally {
      carregando = null
    }
  })()
  return carregando
}

function pintar() {
  const corpo = $('pos-corpo')
  const js = Array.isArray(dados?.jogadores) ? dados.jogadores : []
  if (!js.length) { corpo.replaceChildren(el('p', { class: 'vazio', text: 'As formações da semana ainda não saíram.' })); return }
  const n = js.length
  const g = new Date(dados.geradoEm)
  const s = new Date(`${dados.semana}T12:00:00`)
  const inds = [
    Number.isNaN(s.getTime()) ? null : indicador('semana', `Semana de ${fmtDia.format(s)}`, 'Renova toda segunda'),
    indicador('topo', 'Top do PvP mensal'),
    indicador('formacoes', `${n} formações`),
    Number.isNaN(g.getTime()) ? null : indicador('hora', `${fmtDia.format(g)} às ${fmtHora.format(g)}`, 'Última atualização')
  ].filter(Boolean)
  const explica = el('div', { id: 'pos-explica', class: 'explica explica-pop', role: 'dialog', 'aria-label': 'Como as formações são escolhidas', hidden: true }, [
    el('div', { class: 'ex-cab' }, [el('b', { text: 'Como as formações são escolhidas' })]),
    el('div', { class: 'ex-grade' }, [
      bloco('⚔', 'Formação real', 'Casas tiradas de partidas ranqueadas da semana'),
      bloco('★', 'Variedade', 'Times e posições diferentes entre si'),
      bloco('↑', 'Tabuleiro', 'Adversário em cima; toque num pokémon para ver as casas que ele alcança'),
      bloco('🏹', 'Alcance', '🗡️ corpo a corpo, 🏹 de longe; o número é quantas casas o golpe alcança')
    ])
  ])
  const info = el('button', { type: 'button', class: 'info', 'aria-expanded': 'false', 'aria-controls': 'pos-explica', 'aria-label': 'Como as formações são escolhidas', text: 'i' })
  info.onclick = (e) => {
    e.stopPropagation()
    const abrir = explica.hidden
    explica.hidden = !abrir
    info.setAttribute('aria-expanded', String(abrir))
  }
  document.addEventListener('click', (e) => { if (!explica.hidden && !explica.contains(e.target)) { explica.hidden = true; info.setAttribute('aria-expanded', 'false') } })
  const linha = el('div', { class: 'info-linha' }, [el('ul', { class: 'indicadores', 'aria-label': 'Resumo' }, inds), info, explica])
  corpo.replaceChildren(linha, resumo(dados.resumo || [], n), el('div', { class: 'pos-grade' }, js.map(cartao)))
}

function bloco(icone, titulo, texto) {
  return el('div', { class: 'ex-bloco' }, [el('span', { class: 'ex-ico', 'aria-hidden': 'true', text: icone }), el('b', { text: titulo }), el('span', { text: texto })])
}

function resumo(lista, n) {
  if (!lista.length) return null
  return el('section', { class: 'pos-usos', 'aria-labelledby': 'pos-usos-t' }, [
    el('h2', { id: 'pos-usos-t', class: 'pos-sub' }, [ico('usados'), el('span', { text: `Mais usados nos ${n} times` })]),
    el('div', { class: 'pos-usos-lista' }, lista.map((r) => {
      const f = r.fileiras || []
      const z = [['frente', f[0] || 0], ['meio', (f[1] || 0) + (f[2] || 0)], ['fundo', (f[3] || 0) + (f[4] || 0)]].sort((a, b) => b[1] - a[1])[0][0]
      return el('a', { class: 'pos-uso', href: linkCalc(r), title: `${r.nome}: em ${r.usos} de ${n} times, mais na ${z}`, style: `--p:${Math.min(1, r.usos / n)}` }, [
        el('span', { class: 'poke-img' }, [sprite(r), r.shiny ? el('i', { class: 'poke-shiny', 'aria-hidden': 'true', text: '✦' }) : null]),
        el('span', { class: 'pos-uso-txt' }, [
          el('span', { class: 'pos-uso-nome', text: r.nome }),
          el('span', { class: 'pos-uso-meta' }, [el('b', { text: `${r.usos}/${n}` }), el('span', { text: z })])
        ]),
        el('i', { class: 'pos-uso-barra', 'aria-hidden': 'true' })
      ])
    }))
  ])
}

function guildTag(g) {
  const tag = String(g?.tag || '').trim().slice(0, 8)
  if (!tag) return null
  const cor = /^#[0-9a-f]{3,8}$/i.test(String(g.cor || '')) ? g.cor : '#c9b8a8'
  return el('span', { class: 'pos-guild', style: `--g:${cor}`, title: g.nome ? `Guild ${g.nome}` : 'Guild' }, [`[${tag}]`])
}

function usadoEm(dia) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dia || ''))) return null
  const d = new Date(`${dia}T12:00:00`)
  return el('li', { class: 'pos-usado', title: 'Última partida em que essa formação foi usada' }, [ico('semana'), el('span', { text: `usada em ${fmtDia.format(d)}` })])
}

const CY_NOSSO = (f) => 13 + f
const CY_DELES = (f) => 12 - f
const distancia = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]))
const alcanceN = (a) => Math.max(1, Math.min(4, Math.round(Number(a) || 1)))

function cartao(j) {
  const ocupa = new Map(j.pks.map((p) => [p.casa, p]))
  const nossas = []
  const deles = []
  const tab = el('div', { class: 'pos-tab', role: 'group', 'aria-label': `Formação de ${j.nick}` })
  for (let f = FILEIRAS.length - 1; f >= 0; f--) {
    for (let cx = 11; cx <= 18; cx++) {
      const c = CASAS.find((x) => x.fileira === f && x.cx === 29 - cx)
      if (!c) { tab.append(el('span', { class: 'pos-fora', 'aria-hidden': 'true' })); continue }
      const s = el('span', { class: 'pos-casa inimiga', 'aria-hidden': 'true' })
      deles.push({ el: s, xy: [cx, CY_DELES(f)] })
      tab.append(s)
    }
  }
  tab.append(el('span', { class: 'pos-meio', 'aria-hidden': 'true' }))
  for (let f = 0; f < FILEIRAS.length; f++) {
    for (let cx = 11; cx <= 18; cx++) {
      const c = CASAS.find((x) => x.fileira === f && x.cx === cx)
      if (!c) { tab.append(el('span', { class: 'pos-fora', 'aria-hidden': 'true' })); continue }
      const p = ocupa.get(c.casa)
      if (!p) { tab.append(el('span', { class: 'pos-casa', 'aria-hidden': 'true' })); continue }
      const n = alcanceN(p.alcance)
      const b = el('button', { type: 'button', class: `pos-casa ocupada${n > 1 ? ' longe' : ''}`, title: `${p.nome} · ${alcance(n)}`, 'aria-label': `${p.nome}, ${alcance(n)}`, 'aria-pressed': 'false' }, [
        sprite(p),
        el('b', { class: `pos-casa-alc${n > 1 ? ' longe' : ''}`, 'aria-hidden': 'true' }, [el('i', { text: n > 1 ? '🏹' : '🗡️' }), String(n)])
      ])
      nossas.push({ el: b, p, n, xy: [cx, CY_NOSSO(f)] })
      tab.append(b)
    }
  }
  const legenda = el('p', { class: 'pos-legenda', role: 'status' })
  let fixo = null
  const mostrar = (o) => {
    for (const x of nossas) { x.el.classList.toggle('sel', x === o); x.el.setAttribute('aria-pressed', String(x === o)) }
    let total = 0
    for (const d of deles) {
      const ok = !!o && distancia(o.xy, d.xy) <= o.n
      d.el.classList.toggle('alcanca', ok)
      if (ok) total++
    }
    tab.classList.toggle('mirando', !!o)
    if (!o) {
      legenda.replaceChildren(el('span', { class: 'pos-legenda-dica', text: 'Toque num pokémon para ver onde ele alcança' }))
      return
    }
    legenda.replaceChildren(
      el('b', { text: o.p.nome }),
      el('span', { class: `pos-legenda-alc${o.n > 1 ? ' longe' : ''}` }, [o.n > 1 ? '🏹' : '🗡️', ` ${o.n > 1 ? `${o.n} casas` : 'corpo a corpo'}`]),
      el('span', { class: 'pos-legenda-n', text: total ? `alcança ${total} ${total === 1 ? 'casa' : 'casas'} do adversário` : 'precisa andar para alcançar' })
    )
  }
  for (const o of nossas) {
    o.el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !fixo) mostrar(o) })
    o.el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !fixo) mostrar(null) })
    o.el.addEventListener('focus', () => { if (!fixo) mostrar(o) })
    o.el.addEventListener('blur', () => { if (!fixo) mostrar(null) })
    o.el.addEventListener('click', () => { fixo = fixo === o ? null : o; mostrar(fixo || o) })
  }
  mostrar(null)
  const faltam = 5 - j.pks.length
  const jogos = (j.vitorias || 0) + (j.derrotas || 0)
  const wr = jogos ? Math.round((100 * j.vitorias) / jogos) : null
  const podio = j.pos <= 3 ? ` p${j.pos}` : ''
  return el('article', { class: `pos-card${podio}` }, [
    el('header', { class: 'pos-card-cab' }, [
      el('span', { class: 'pos-lugar', title: 'Posição no PvP mensal', text: `${j.pos}º` }),
      el('strong', { class: 'pos-nick', title: j.guild?.nome ? `${j.nick} · ${j.guild.nome}` : j.nick }, [el('span', { text: j.nick })]),
      guildTag(j.guild)
    ]),
    el('ul', { class: 'pos-stats' }, [
      el('li', { title: 'Pontos no mês' }, [ico('pontos'), el('span', { text: `${fmt.format(j.pontos || 0)} pts` })]),
      wr != null ? el('li', { title: `${fmt.format(j.vitorias)} vitórias e ${fmt.format(j.derrotas)} derrotas no mês` }, [ico('vitorias'), el('span', { text: `${wr}%` })]) : null,
      usadoEm(j.usadoEm),
      faltam > 0 ? el('li', { class: 'pos-menos', title: 'Esse jogador entra com menos de 5 pokémon' }, [el('span', { text: `${j.pks.length} pokémon` })]) : null
    ]),
    el('p', { class: 'pos-lado deles', 'aria-hidden': 'true', text: 'Adversário' }),
    tab,
    el('p', { class: 'pos-lado', 'aria-hidden': 'true' }, [ico('frente'), 'Formação']),
    legenda
  ])
}

function montar() {
  const abas = document.querySelectorAll('[data-vista]')
  abas.forEach((b) => {
    b.addEventListener('click', () => {
      const alvo = b.dataset.vista
      if (alvo === aba()) return
      if (alvo === 'pos') location.hash = 'posicionamento'
      else history.pushState(null, '', location.pathname + location.search)
      aplicarAba()
    })
  })
  addEventListener('hashchange', aplicarAba)
  addEventListener('popstate', aplicarAba)
  aplicarAba()
}

montar()
