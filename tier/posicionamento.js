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
      bloco('↑', 'Frente', 'A fileira de cima é a mais perto do adversário'),
      bloco('#', 'Ordem', 'Em empate de distância, o adversário mira primeiro o número menor'),
      bloco('🏹', 'Alcance', '🗡️ corpo a corpo, 🏹 de longe; cada quadradinho é uma casa')
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

const ALC_MAX = 4
function alcanceInfo(a) {
  const n = Math.max(1, Math.min(ALC_MAX, Math.round(Number(a) || 1)))
  const longe = n > 1
  return el('span', { class: `pos-alc${longe ? ' longe' : ''}`, title: longe ? `Ataca de longe: alcance de ${n} casas` : 'Corpo a corpo: alcance de 1 casa', 'aria-label': longe ? `alcance de ${n} casas` : 'corpo a corpo' }, [
    el('span', { class: 'pos-alc-emoji', 'aria-hidden': 'true', text: longe ? '🏹' : '🗡️' }),
    el('span', { class: 'pos-alc-casas', 'aria-hidden': 'true' }, Array.from({ length: ALC_MAX }, (_, i) => el('i', { class: i < n ? 'on' : null }))),
    el('b', { class: 'pos-alc-n', 'aria-hidden': 'true', text: String(n) })
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

function cartao(j) {
  const ocupa = new Map(j.pks.map((p) => [p.casa, p]))
  const casas = new Map()
  const tab = el('div', { class: 'pos-tab', role: 'img', 'aria-label': `Formação de ${j.nick}: ${j.pks.map((p) => `${p.nome} na ${zona(p.casa)}`).join(', ')}` })
  for (let fileira = 0; fileira < FILEIRAS.length; fileira++) {
    for (let cx = 11; cx <= 18; cx++) {
      const c = CASAS.find((x) => x.fileira === fileira && x.cx === cx)
      if (!c) { tab.append(el('span', { class: 'pos-fora', 'aria-hidden': 'true' })); continue }
      const p = ocupa.get(c.casa)
      const casa = el('span', { class: `pos-casa${p ? ' ocupada' : ''}`, title: p ? `${p.ordem}. ${p.nome} · ${alcance(p.alcance)}` : null }, p ? [sprite(p), el('b', { class: 'pos-casa-n', text: String(p.ordem) })] : [])
      if (p) casas.set(p.ordem, casa)
      tab.append(casa)
    }
  }
  const pks = [...j.pks].sort((a, b) => a.ordem - b.ordem)
  const lista = el('ol', { class: 'pos-pks' }, [
    ...pks.map((p) => {
      const li = el('li', {}, [el('a', { class: 'pos-pk', href: linkCalc(p), title: `${p.nome} · ${alcance(p.alcance)}` }, [
        el('span', { class: 'pos-pk-n', text: String(p.ordem) }),
        el('span', { class: 'pos-pk-img' }, [sprite(p)]),
        el('span', { class: 'pos-pk-nome', text: p.nome }),
        alcanceInfo(p.alcance)
      ])])
      const ligar = (on) => casas.get(p.ordem)?.classList.toggle('foco', on)
      li.addEventListener('pointerenter', () => ligar(true))
      li.addEventListener('pointerleave', () => ligar(false))
      li.addEventListener('focusin', () => ligar(true))
      li.addEventListener('focusout', () => ligar(false))
      return li
    }),
    ...Array.from({ length: Math.max(0, 5 - pks.length) }, () => el('li', { class: 'pos-pk-vazio', 'aria-hidden': 'true' }))
  ])
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
      usadoEm(j.usadoEm)
    ]),
    el('p', { class: 'pos-frente', 'aria-hidden': 'true' }, [ico('frente'), 'Frente']),
    tab,
    lista
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
