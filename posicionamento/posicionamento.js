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
  espada: '<path d="M20 4l-1.2 4.6L9.6 17.8 6.2 14.4 15.4 5.2z"/><path d="M5 13.2l5.8 5.8M7.6 16.4 4 20"/>',
  arco: '<path d="M6.5 4.2c7.3.3 13 6 13.3 13.3"/><path d="M6.5 4.2 19.8 17.5"/><path d="M4 20 15.6 8.4M15.6 8.4h-3.7M15.6 8.4v3.7M4 20h2.6M4 20v-2.6"/>',
  usados: '<path d="M5 20v-6M12 20V5M19 20v-9"/>',
  pontos: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  vitorias: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l2.7 2.7L16.5 9"/>',
  frente: '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>',
  busca: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>'
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
const zona = (casa) => { const f = CASAS[casa]?.fileira ?? 0; return f === 0 ? 'frente' : f <= 2 ? 'meio' : 'fundo' }
const alcance = (a) => (a > 1 ? `alcance ${a}` : 'corpo a corpo')
function indicador(icone, texto, titulo) {
  return el('li', { class: `ind ind-${icone}`, title: titulo || null }, [ico(icone), el('span', { text: texto })])
}

let dados = null
let tiers = new Map()
const COR_TIER = { 'S+': '#ff6fae', S: '#ff7676', 'S-': '#b495ff', 'A+': '#f5b13d', A: '#ffa25a', 'A-': '#ffd95e', 'B+': '#8c93f0', B: '#5f9ad6', 'B-': '#3fd4c6', C: '#9aa0aa', D: '#e4e7ec' }

async function lerTiers() {
  try {
    const r = await fetch('../tier/tier.json', { cache: 'no-cache' })
    if (!r.ok) return
    const j = (await r.json())?.janelas?.dia
    const m = new Map()
    for (const g of j?.tiers || []) for (const x of g.itens || []) m.set(Number(x.speciesId), g.tier)
    for (const x of j?.foraDoMeta || []) if (!m.has(Number(x.speciesId)) && COR_TIER[x.tier]) m.set(Number(x.speciesId), x.tier)
    tiers = m
  } catch {}
}
const tierDe = (p) => tiers.get(Number(p.speciesId)) || null
function seloTier(p, cls = 'pos-tier') {
  const t = tierDe(p)
  return t ? el('span', { class: cls, style: `--t:${COR_TIER[t]}`, title: `Tier ${t} no tier de hoje` }, [t]) : null
}
let carregando = null

async function carregar() {
  if (dados || carregando) return carregando
  const corpo = $('pos-corpo')
  corpo.replaceChildren(el('div', { class: 'carga vao' }, [el('img', { class: 'carga-bola', src: BOLA, alt: '' }), el('b', { text: 'Carregando as formações' })]))
  carregando = (async () => {
    try {
      const [r] = await Promise.all([fetch('posicionamento.json', { cache: 'no-cache' }), lerTiers()])
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
  const total = n + (Array.isArray(dados.outros) ? dados.outros.length : 0)
  const g = new Date(dados.geradoEm)
  const mes = /^\d{4}-\d{2}$/.test(String(dados.mes || '')) ? new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(`${dados.mes}-15T12:00:00`)) : null
  const inds = [
    indicador('topo', mes ? `Top 200 de ${mes}` : 'Top 200 do mensal', 'Ranking do PvP mensal'),
    indicador('formacoes', `${total} formações`, total > n ? `${n} em destaque e ${total - n} na lista` : null),
    Number.isNaN(g.getTime()) ? null : indicador('hora', `Atualizado ${fmtDia.format(g)} às ${fmtHora.format(g)}`, 'Atualiza sozinho quando aparece jogador novo')
  ].filter(Boolean)
  const explica = el('div', { id: 'pos-explica', class: 'explica explica-pop', role: 'dialog', 'aria-label': 'Como as formações são escolhidas', hidden: true }, [
    el('div', { class: 'ex-cab' }, [el('b', { text: 'Como as formações são escolhidas' })]),
    el('div', { class: 'ex-grade' }, [
      bloco('⚔', 'Formação montada', 'Jogadores do top que fogem da formação automática.'),
      bloco('★', 'Ranking', 'Os 10 mais bem colocados em destaque; abaixo, o resto até o top 200.'),
      bloco('↑', 'Tabuleiro', 'Adversário em cima. Toque num pokémon para ver o alcance.'),
      bloco('➶', 'Alcance', 'Espada luta colado, arco ataca de longe.')
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
  const outros = Array.isArray(dados.outros) ? dados.outros : []
  const grade = el('div', { class: 'pos-grade' }, js.map(cartao))
  const secao = outrosSecao(outros)
  const busca = buscaCampo(grade, secao)
  corpo.replaceChildren(linha, resumo(dados.resumo || [], n), busca.campo, busca.vazio, grade, secao)
}

function outrosSecao(lista) {
  if (!lista.length) return null
  return el('section', { class: 'pos-outros', 'aria-labelledby': 'pos-outros-t' }, [
    el('h2', { id: 'pos-outros-t', class: 'pos-sub' }, [ico('formacoes'), el('span', { text: `Mais formações do top 200 · ${lista.length}` })]),
    el('div', { class: 'pos-outros-lista' }, lista.map(outro))
  ])
}

function outro(j) {
  const jogos = (j.vitorias || 0) + (j.derrotas || 0)
  const wr = jogos ? Math.round((100 * j.vitorias) / jogos) : null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(j.usadoEm || '')) ? fmtDia.format(new Date(`${j.usadoEm}T12:00:00`)) : null
  const pks = [...j.pks].sort((a, b) => (CASAS[a.casa]?.fileira ?? 0) - (CASAS[b.casa]?.fileira ?? 0) || a.casa - b.casa)
  const corpo = el('div', { class: 'pos-outro-corpo' })
  const item = el('details', { class: 'pos-outro', 'data-busca': textoBusca(j) }, [
    el('summary', { title: `Ver a formação de ${j.nick}` }, [
      el('span', { class: 'pos-lugar', text: `${j.pos}º` }),
      el('span', { class: 'pos-outro-quem' }, [
        el('span', { class: 'pos-outro-nome' }, [el('strong', { class: 'pos-nick' }, [el('span', { text: j.nick })]), guildTag(j.guild)]),
        el('span', { class: 'pos-outro-meta' }, [
          el('span', { text: `${fmt.format(j.pontos || 0)} pts` }),
          wr != null ? el('span', { text: `${wr}%` }) : null,
          d ? el('span', { title: 'Última partida em que essa formação foi usada', text: `usada em ${d}` }) : null
        ])
      ]),
      el('span', { class: 'pos-outro-pks', 'aria-label': pks.map((p) => p.nome).join(', ') }, pks.map((p) => el('span', { class: 'pos-outro-pk', title: p.nome }, [sprite(p)]))),
      el('span', { class: 'pos-outro-seta', 'aria-hidden': 'true' })
    ]),
    corpo
  ])
  item.addEventListener('toggle', () => {
    if (!item.open || corpo.childElementCount) return
    const c = cartao(j)
    c.querySelector('.pos-card-cab')?.remove()
    corpo.append(...c.children)
  })
  return item
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
      return el('div', { class: 'pos-uso', title: `${r.nome}: em ${r.usos} de ${n} times, mais na ${z}`, style: `--p:${Math.min(1, r.usos / n)}` }, [
        el('span', { class: 'poke-img' }, [sprite(r), r.shiny ? el('i', { class: 'poke-shiny', 'aria-hidden': 'true', text: '✦' }) : null]),
        el('span', { class: 'pos-uso-txt' }, [
          el('span', { class: 'pos-uso-nome', text: r.nome }),
          el('span', { class: 'pos-uso-meta' }, [seloTier(r, 'pos-tier mini'), el('b', { text: `${r.usos}/${n}` }), el('span', { text: z })])
        ]),
        el('i', { class: 'pos-uso-barra', 'aria-hidden': 'true' })
      ])
    }))
  ])
}

const ESCUDO = '<path d="M12 3.2 19 6v5.2c0 4.4-3 7.9-7 9.6-4-1.7-7-5.2-7-9.6V6z"/>'
function guildTag(g) {
  const tag = String(g?.tag || '').trim().replace(/^\[|\]$/g, '').slice(0, 8)
  if (!tag) return null
  const cor = /^#[0-9a-f]{3,8}$/i.test(String(g.cor || '')) ? g.cor : '#c9b8a8'
  const esc = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  esc.setAttribute('viewBox', '0 0 24 24'); esc.setAttribute('aria-hidden', 'true'); esc.innerHTML = ESCUDO
  return el('span', { class: 'pos-guild', style: `--g:${cor}`, title: g.nome ? `Guild ${g.nome}` : `Guild ${tag}` }, [esc, el('b', { text: tag })])
}
const textoBusca = (j) => normalizar(`${j.nick} ${j.guild?.tag || ''} ${j.guild?.nome || ''}`)
const normalizar = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

function buscaCampo(grade, secao) {
  const input = el('input', { id: 'pos-busca', class: 'campo', type: 'search', autocomplete: 'off', spellcheck: 'false', placeholder: 'Buscar jogador ou guild', 'aria-label': 'Buscar jogador ou guild' })
  const vazio = el('p', { class: 'vazio pos-busca-vazio', hidden: true, text: 'Nenhum jogador ou guild com esse nome.' })
  input.addEventListener('input', () => {
    const q = normalizar(input.value)
    let achou = 0
    for (const sel of [grade, secao]) {
      if (!sel) continue
      let n = 0
      for (const it of sel.querySelectorAll('[data-busca]')) {
        const ok = !q || it.dataset.busca.includes(q)
        it.hidden = !ok
        if (ok) n++
      }
      sel.hidden = !n
      achou += n
    }
    vazio.hidden = !!achou
  })
  return { campo: el('label', { class: 'busca pos-busca' }, [el('span', { class: 'busca-ico', 'aria-hidden': 'true' }, [ico('busca')]), input]), vazio }
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

const BOLA_SVG = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#fff3df" fill-opacity=".34"/><path d="M2 50a48 48 0 0 1 96 0z" fill="#e0505c" fill-opacity=".5"/><rect x="2" y="46.5" width="96" height="7" fill="#10070c"/><circle cx="50" cy="50" r="14" fill="#10070c"/><circle cx="50" cy="50" r="8.5" fill="#f3e4cf" fill-opacity=".85"/></svg>')}")`
function pintarBola(tab) {
  const meio = tab.querySelector('.pos-meio')
  if (!meio || !meio.offsetWidth) return
  const cx = meio.offsetLeft + meio.offsetWidth / 2, cy = meio.offsetTop + meio.offsetHeight / 2
  const D = meio.offsetWidth * 0.52
  for (const c of tab.querySelectorAll('.pos-casa:not(.ocupada)')) {
    let b = c.querySelector('.pos-casa-bola')
    if (!b) { b = el('i', { class: 'pos-casa-bola', 'aria-hidden': 'true' }); c.prepend(b) }
    const x = cx - D / 2 - c.offsetLeft, y = cy - D / 2 - c.offsetTop
    const longe = x > c.offsetWidth || y > c.offsetHeight || x + D < 0 || y + D < 0
    b.style.backgroundImage = longe ? 'none' : BOLA_SVG
    b.style.backgroundSize = `${D}px ${D}px`
    b.style.backgroundPosition = `${x}px ${y}px`
  }
}
const observaBola = new ResizeObserver((itens) => { for (const it of itens) pintarBola(it.target) })

function cartao(j) {
  const ocupa = new Map(j.pks.map((p) => [p.casa, p]))
  const nossas = []
  const deles = []
  const tab = el('div', { class: 'pos-tab', role: 'group', 'aria-label': `Formação de ${j.nick}` }, [
    el('span', { class: 'pos-canto deles', 'aria-hidden': 'true', text: 'Adversário' }),
    el('span', { class: 'pos-canto nosso', 'aria-hidden': 'true', text: 'Formação' })
  ])
  for (let f = FILEIRAS.length - 2; f >= 0; f--) {
    for (let cx = 11; cx <= 18; cx++) {
      const c = CASAS.find((x) => x.fileira === f && x.cx === 29 - cx)
      if (!c) { tab.append(el('span', { class: 'pos-fora', 'aria-hidden': 'true' })); continue }
      const s = el('span', { class: `pos-casa inimiga${(cx + f) % 2 ? ' alt' : ''}`, 'aria-hidden': 'true' })
      deles.push({ el: s, xy: [cx, CY_DELES(f)] })
      tab.append(s)
    }
  }
  const meio = el('span', { class: 'pos-meio', 'aria-hidden': 'true' })
  tab.append(meio)
  observaBola.observe(tab)
  for (let f = 0; f < FILEIRAS.length; f++) {
    for (let cx = 11; cx <= 18; cx++) {
      const c = CASAS.find((x) => x.fileira === f && x.cx === cx)
      if (!c) { tab.append(el('span', { class: 'pos-fora', 'aria-hidden': 'true' })); continue }
      const p = ocupa.get(c.casa)
      const alt = (cx + f) % 2 ? ' alt' : ''
      if (!p) { tab.append(el('span', { class: `pos-casa nossa${alt}`, 'aria-hidden': 'true' })); continue }
      const n = alcanceN(p.alcance)
      const t = tierDe(p)
      const b = el('button', { type: 'button', style: t ? `--t:${COR_TIER[t]}` : null, class: `pos-casa nossa ocupada${alt}${n > 1 ? ' longe' : ''}`, title: `${p.nome}${t ? ` · tier ${t}` : ''} · ${alcance(n)}`, 'aria-label': `${p.nome}${t ? `, tier ${t}` : ''}, ${alcance(n)}`, 'aria-pressed': 'false' }, [
        sprite(p),
        t ? el('span', { class: 'pos-casa-info', 'aria-hidden': 'true' }, [seloTier(p, 'pos-tier mini')]) : null
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
      legenda.replaceChildren(el('span', { class: 'pos-legenda-dica', text: 'Toque num pokémon para ver o alcance' }))
      return
    }
    legenda.replaceChildren(
      el('b', { text: o.p.nome }),
      seloTier(o.p),
      el('span', { class: `pos-legenda-alc${o.n > 1 ? ' longe' : ''}` }, [ico(o.n > 1 ? 'arco' : 'espada'), o.n > 1 ? `${o.n} casas` : 'corpo a corpo']),
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
  return el('article', { class: `pos-card${podio}`, 'data-busca': textoBusca(j) }, [
    el('header', { class: 'pos-card-cab' }, [
      el('span', { class: 'pos-lugar', title: 'Posição no PvP mensal', text: `${j.pos}º` }),
      el('strong', { class: 'pos-nick', title: j.guild?.nome ? `${j.nick} · ${j.guild.nome}` : j.nick }, [el('span', { text: j.nick })]),
      guildTag(j.guild),
      el('ul', { class: 'pos-stats' }, [
      el('li', { title: 'Pontos no mês' }, [ico('pontos'), el('span', { text: `${fmt.format(j.pontos || 0)} pts` })]),
      wr != null ? el('li', { title: `${fmt.format(j.vitorias)} vitórias e ${fmt.format(j.derrotas)} derrotas no mês` }, [ico('vitorias'), el('span', { text: `${wr}%` })]) : null,
      usadoEm(j.usadoEm),
      faltam > 0 ? el('li', { class: 'pos-menos', title: 'Esse jogador entra com menos de 5 pokémon' }, [el('span', { text: `${j.pks.length} pokémon` })]) : null
      ])
    ]),
    tab,
    legenda
  ])
}

carregar()
