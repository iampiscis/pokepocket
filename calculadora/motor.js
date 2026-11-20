const BASE = new URL('./', import.meta.url)
const JOGO = new URL('jogo/', BASE)
const PRECIFICADOR = 'https://briaoale.github.io/precificador-pokemon/'
const SCRIPTS_PRECO = ['catalogo/especies.js', 'catalogo/pve-power.js', 'motor/market-bonuses.js', 'motor/pve-pricing.js', 'js/central.js']
const SCRIPT_FICHA = 'js/ficha.js'
const CATALOGOS = ['creatures', 'creatures-novos', 'creatures-outland-novos', 'creatures-formas', 'creatures-audit-overrides']
const MODULOS = {
  gi: 'ginasios.mjs', ramificadas: 'evolucoes-ramificadas.mjs', evolucoes: 'evolucoes-cruzadas.mjs', megas: 'megas.mjs',
  outland: 'outland.mjs', planilhas: 'golpes-planilhas.mjs', especiais: 'golpes-especiais.mjs', baseOutland: 'herdar-base-outland.mjs',
  golpesOrre: 'herdar-golpes-orre.mjs', ajustes: 'ajustes-especie-espelho.mjs', teto: 'teto-captura.mjs', linhagem: 'linhagem-nota.mjs',
  nota: 'nota-pokemon.mjs', formas: 'formas.mjs'
}
const STATS = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed']
const BASE_DE = { hp: 'baseHp', atk: 'baseAtk', def: 'baseDef', spAtk: 'baseSpAtk', spDef: 'baseSpDef', speed: 'baseSpeed' }
const TIPOS = ['NORMAL', 'FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY']

const NIVEL_INDICADOR = 100
const NIVEL_REFERENCIA = 2000
const ESCALA_SCORE = { pvp: [10, 25000], pve: [15, 39000] }
const CURVA_SCORE = 1.8
const LOOK_NORMAL = 60000
const LOOK_SHINY = 70000

const TABELA = {
  NORMAL: { ROCK: 0.5, GHOST: 0, STEEL: 0.5 },
  FIRE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 2, BUG: 2, ROCK: 0.5, DRAGON: 0.5, STEEL: 2 },
  WATER: { FIRE: 2, WATER: 0.5, GRASS: 0.5, GROUND: 2, ROCK: 2, DRAGON: 0.5 },
  ELECTRIC: { WATER: 2, ELECTRIC: 0.5, GRASS: 0.5, GROUND: 0, FLYING: 2, DRAGON: 0.5 },
  GRASS: { FIRE: 0.5, WATER: 2, GRASS: 0.5, POISON: 0.5, GROUND: 2, FLYING: 0.5, BUG: 0.5, ROCK: 2, DRAGON: 0.5, STEEL: 0.5 },
  ICE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 0.5, GROUND: 2, FLYING: 2, DRAGON: 2, STEEL: 0.5 },
  FIGHTING: { NORMAL: 2, ICE: 2, POISON: 0.5, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5, ROCK: 2, GHOST: 0, DARK: 2, STEEL: 2, FAIRY: 0.5 },
  POISON: { GRASS: 2, POISON: 0.5, GROUND: 0.5, ROCK: 0.5, GHOST: 0.5, STEEL: 0, FAIRY: 2 },
  GROUND: { FIRE: 2, ELECTRIC: 2, GRASS: 0.5, POISON: 2, FLYING: 0, BUG: 0.5, ROCK: 2, STEEL: 2 },
  FLYING: { ELECTRIC: 0.5, GRASS: 2, FIGHTING: 2, BUG: 2, ROCK: 0.5, STEEL: 0.5 },
  PSYCHIC: { FIGHTING: 2, POISON: 2, PSYCHIC: 0.5, DARK: 0, STEEL: 0.5 },
  BUG: { FIRE: 0.5, GRASS: 2, FIGHTING: 0.5, POISON: 0.5, FLYING: 0.5, PSYCHIC: 2, GHOST: 0.5, DARK: 2, STEEL: 0.5, FAIRY: 0.5 },
  ROCK: { FIRE: 2, ICE: 2, FIGHTING: 0.5, GROUND: 0.5, FLYING: 2, BUG: 2, STEEL: 0.5 },
  GHOST: { NORMAL: 0, PSYCHIC: 2, GHOST: 2, DARK: 0.5 },
  DRAGON: { DRAGON: 2, STEEL: 0.5, FAIRY: 0 },
  DARK: { FIGHTING: 0.5, PSYCHIC: 2, GHOST: 2, DARK: 0.5, FAIRY: 0.5 },
  STEEL: { FIRE: 0.5, WATER: 0.5, ELECTRIC: 0.5, ICE: 2, ROCK: 2, STEEL: 0.5, FAIRY: 2 },
  FAIRY: { FIRE: 0.5, FIGHTING: 2, POISON: 0.5, DRAGON: 2, DARK: 2, STEEL: 0.5 }
}
const AMPLIACAO = { 4: 5.5, 2: 2.5, 1: 1, 0.5: 0.33, 0.25: 0.17, 0: 0 }
const INICIO_MS = 1250
const RECARGA_GLOBAL_MS = 1000
const INVESTIDA = { power: 45, cooldownMs: 2000 }
const Z_MOVE = { power: 1800, cooldownMs: 60000 }
const VIDA_TABULEIRO = 1.5

let carregando = null
let ctx = null
const cacheScore = new Map()
const cacheSimular = new Map()
let precificador = null

const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

async function lerJson(url) {
  const r = await fetch(url, { cache: 'no-cache' })
  if (!r.ok) throw new Error(`${url.pathname || url}: HTTP ${r.status}`)
  return r.json()
}

async function lerTexto(url, opcional = false) {
  try {
    const r = await fetch(url, { cache: 'no-cache' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.text()
  } catch (err) {
    if (opcional) return null
    throw err
  }
}

function montarCatalogoJogo(m, f) {
  const lista = [...(f.creatures?.creatures ?? [])]
  for (const k of ['creatures-novos', 'creatures-outland-novos', 'creatures-formas']) if (f[k]?.creatures?.length) lista.push(...f[k].creatures)
  m.outland.aplicarRemapOutlandLista(lista)
  aplicarOverrides(lista, f['creatures-audit-overrides'])
  m.ajustes?.aplicarAjustesTipos?.((id) => lista.filter((c) => c.pokeId === id))
  m.planilhas.aplicarGolpesDasPlanilhas((id) => lista.filter((c) => c.pokeId === id))
  m.baseOutland.herdarBaseOutland(lista)
  m.evolucoes.aplicarCadeiasTruncadas(lista)
  m.evolucoes.normalizarEvolveLevel600(lista)
  m.ajustes?.aplicarAjustesHuntLevel?.((id) => lista.find((c) => c.pokeId === id))
  const especies = new Map()
  for (const c of lista) {
    if (m.outland.isEspelhoFantasmaPokeId(c.pokeId)) continue
    m.especiais.injetarGolpesEspeciais(c)
    especies.set(c.pokeId, c)
  }
  m.golpesOrre.herdarGolpesOrre(lista)
  for (const mega of m.megas.criarEspeciesMega(lista)) especies.set(mega.pokeId, mega)
  const todas = [...especies.values()]
  m.teto.aplicarTetoDeCaptura(todas, (id) => especies.get(id))
  m.linhagem.anotarLinhagemDaNota(todas, (id) => especies.get(id), m.megas.elosMegaDaNota(todas))
  return especies
}

function montarCatalogoIndicador(m, f) {
  const lista = [...(f.creatures?.creatures ?? [])]
  for (const k of ['creatures-novos', 'creatures-outland-novos', 'creatures-formas']) if (f[k]?.creatures?.length) lista.push(...f[k].creatures)
  m.outland.aplicarRemapOutlandLista(lista)
  aplicarOverrides(lista, f['creatures-audit-overrides'])
  m.ajustes.aplicarAjustesTipos((id) => lista.filter((c) => c.pokeId === id))
  m.planilhas.aplicarGolpesDasPlanilhas((id) => lista.filter((c) => c.pokeId === id))
  m.baseOutland.herdarBaseOutland(lista)
  m.evolucoes.aplicarCadeiasTruncadas(lista)
  m.evolucoes.normalizarEvolveLevel600(lista)
  m.ajustes.aplicarAjustesHuntLevel((id) => lista.find((c) => c.pokeId === id))
  const especies = new Map()
  for (const c of lista) {
    if (m.outland.isEspelhoFantasmaPokeId(c.pokeId)) continue
    m.especiais.injetarGolpesEspeciais(c)
    if (m.outland.isOutlandPokeId(c.pokeId)) {
      c.evolvesToId = 0
      c.evolveLevel = 0
    }
    especies.set(c.pokeId, c)
  }
  m.golpesOrre.herdarGolpesOrre(lista)
  m.evolucoes.aplicarEvolucoesEntreGeracoes(lista)
  m.ramificadas.alinharNivelPadraoRamificado(lista)
  m.evolucoes.corrigirNiveisDeEvolucao(lista)
  for (const mega of m.megas.criarEspeciesMega(lista)) {
    lista.push(mega)
    especies.set(mega.pokeId, mega)
  }
  return especies
}

function aplicarOverrides(lista, fonte) {
  for (const o of fonte?.overrides ?? []) {
    const c = lista.find((x) => x.pokeId === o.pokeId)
    if (!c) continue
    for (const k of Object.values(BASE_DE)) if (typeof o[k] === 'number') c[k] = o[k]
    if (Array.isArray(o.attacks)) c.attacks = o.attacks.map((a) => ({ ...a }))
  }
}

function formasAlcancaveis(esp, especies, m) {
  const pega = (id) => especies.get(Number(id))
  const vistos = new Map([[esp.pokeId, esp]])
  const fila = [esp]
  while (fila.length) {
    const x = fila.shift()
    for (const d of m.ramificadas.destinosDeEvolucao(x, pega)) {
      const alvo = d.especie || pega(d.pokeId)
      if (!alvo || vistos.has(alvo.pokeId)) continue
      vistos.set(alvo.pokeId, alvo)
      fila.push(alvo)
    }
    for (const mg of m.megas.megasDaEspecie(x.pokeId)) {
      const alvo = pega(m.megas.pokeIdDaMega(mg))
      if (alvo && !vistos.has(alvo.pokeId)) {
        vistos.set(alvo.pokeId, alvo)
        fila.push(alvo)
      }
    }
  }
  return [...vistos.values()]
}

const tiposDe = (esp) => [...new Set([esp?.type1, esp?.type2].filter(Boolean).map((t) => String(t).toUpperCase()))]

function efetividade(tipoGolpe, tiposDefensor) {
  const linha = TABELA[String(tipoGolpe).toUpperCase()] || {}
  let v = 1
  for (const t of tiposDefensor) v *= linha[t] ?? 1
  return AMPLIACAO[v] ?? v
}

function golpesPvp(esp, nivel, tm) {
  const gs = (esp?.attacks || [])
    .filter((g) => (g.learnLevel ?? 1) <= nivel && (g.power ?? 0) > 0)
    .map((g) => ({ power: g.power, cd: Math.max(400, g.cooldownMs ?? 2000), especial: g.category === 'SPECIAL', tipo: String(g.type).toUpperCase(), aoe: false }))
  if (tm?.tipo) gs.push({ power: Z_MOVE.power, cd: Z_MOVE.cooldownMs, especial: !tm.fisico, tipo: String(tm.tipo).toUpperCase(), aoe: !!tm.aoe })
  return gs
}

function ataqueEfetivo(meta, st, esp, nivel, tm) {
  const tipos = tiposDe(esp)
  const gs = golpesPvp(esp, nivel, tm)
  const k = ((2 * nivel) / 5 + 2) / 50
  const valor = gs.map((g) => k * g.power * (g.especial ? st.spAtk : st.atk) * (tipos.includes(g.tipo) ? 1.5 : 1) * (g.aoe ? meta.aoe : 1))
  const casts = gs.map(() => 0)
  const pronto = gs.map(() => INICIO_MS)
  let livre = INICIO_MS, investidaPronta = INICIO_MS, investidas = 0
  for (let t = INICIO_MS; t < meta.T * 1000; t += 250) {
    if (t < livre) continue
    let b = -1
    for (let i = 0; i < gs.length; i++) if (pronto[i] <= t && (b < 0 || valor[i] > valor[b])) b = i
    if (b >= 0) {
      casts[b]++
      pronto[b] = t + gs[b].cd
      livre = t + RECARGA_GLOBAL_MS
    } else if (investidaPronta <= t) {
      investidas++
      investidaPronta = t + INVESTIDA.cooldownMs
      livre = t + RECARGA_GLOBAL_MS
    }
  }
  let total = investidas * k * INVESTIDA.power * st.atk * meta.defInv
  gs.forEach((g, i) => { total += casts[i] * valor[i] * (meta.def[g.tipo]?.[g.especial ? 1 : 0] ?? 0) })
  return total
}

function resistenciaEfetiva(meta, st, hpCombate, esp) {
  const tipos = tiposDe(esp)
  let recebido = meta.invInc / st.def
  for (const t of TIPOS) {
    const e = efetividade(t, tipos)
    if (e) recebido += e * (meta.inc[t][0] / st.def + meta.inc[t][1] / st.spDef)
  }
  return (hpCombate * VIDA_TABULEIRO) / recebido
}

function melhorForcaPvp(c, pk, esp, nivel) {
  const { gi, meta } = c
  const st = gi.statsNoNivel({ ...pk, speciesId: esp.pokeId, level: nivel }, esp, nivel)
  if (!st) return null
  let melhor = null
  for (const tipo of tiposDe(esp).length ? tiposDe(esp) : ['NORMAL']) {
    for (const fisico of [true, false]) {
      const ataque = ataqueEfetivo(meta, st, esp, nivel, { tipo, fisico, aoe: false }) / meta.mO
      const resistencia = resistenciaEfetiva(meta, st, gi.hpDeCombateGinasio(st.hp), esp) / meta.mR
      const forca = ataque + resistencia
      if (!melhor || forca > melhor.forca) melhor = { forca, ataque, resistencia, tm: tipo, fisico }
    }
  }
  return melhor
}

const escalaDoNivel = (n) => ((2 * n) / 5 + 2) * n ** 3
const pokemonBase = (pk) => ({ potencia: Math.max(1, Math.round(Number(pk.potencia) || 1)), quality: Number(pk.quality ?? pk.qualidade) || 1, shiny: !!pk.shiny, ivs: pk.ivs })

function poderPadrao(gi, pk, esp, nivel, pvp) {
  let melhor = 0
  for (const tmFisico of [true, false]) {
    const como = { ...pokemonBase(pk), speciesId: esp.pokeId, level: nivel, refino: {}, tmElemental: esp.type1 || 'NORMAL', tmFisico }
    const v = gi.poderNoNivel(como, esp, nivel, { pvp })
    if (v > melhor) melhor = v
  }
  return melhor
}

function scorePoder(v, tipo) {
  if (!(Number(v) > 0)) return null
  const [lo, hi] = ESCALA_SCORE[tipo]
  const x = Math.max(0, Math.min(1, (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))))
  return Math.round(1000 * x ** CURVA_SCORE)
}

function calcularIndicador(c, pk) {
  const { gi, indicador: especies, m, meta } = c
  const esp = especies.get(Number(pk?.speciesId))
  if (!esp || !pk?.ivs) return null
  const formas = formasAlcancaveis(esp, especies, m)
  const melhorEm = (nivel, pvp) => {
    let r = null
    for (const f of formas) {
      const v = poderPadrao(gi, pk, f, nivel, pvp)
      if (!r || v > r.v) r = { v, nome: f.name, speciesId: f.pokeId }
    }
    return r
  }
  const paraNv100 = (r, nivel) => ({ ...r, v: Math.round((r.v * escalaDoNivel(NIVEL_INDICADOR)) / escalaDoNivel(nivel)) })
  const refPvp = gi.nivelNoGinasio(NIVEL_REFERENCIA)
  let efetivo = null
  if (gi.statsNoNivel && gi.hpDeCombateGinasio) {
    for (const f of formas) {
      const v = melhorForcaPvp(c, pokemonBase(pk), f, refPvp)
      if (v && (!efetivo || v.forca > efetivo.forca)) efetivo = { ...v, nome: f.name, speciesId: f.pokeId }
    }
  }
  const pvp = efetivo
    ? { v: Math.max(1, Math.round(Math.exp(meta.escala[0] + meta.escala[1] * Math.log(efetivo.forca)))), nome: efetivo.nome, ataque: efetivo.ataque, resistencia: efetivo.resistencia }
    : paraNv100(melhorEm(refPvp, true), refPvp)
  const pve = paraNv100(melhorEm(NIVEL_REFERENCIA, false), NIVEL_REFERENCIA)
  return { pvp, pve }
}

function looksDe(c, esp) {
  const { megas, formas } = c.m
  const id = Number(esp.pokeId)
  const meta = megas.megaPorPokeId(id)
  if (meta) return { looktype: megas.looktypeDaMega(meta), lookShiny: megas.megaTemShiny(meta) ? megas.looktypeShinyDaMega(meta) : null, mega: true }
  const forma = c.formaPorId.get(id)
  const looktype = c.atlas?.slots?.[LOOK_NORMAL + id] ? LOOK_NORMAL + id : esp.looktype ?? null
  if (forma) return { looktype: forma.looktype ?? looktype, lookShiny: forma.looktypeShiny ?? null, mega: false }
  if (c.m.outland.isOutlandPokeId(id)) return { looktype, lookShiny: null, mega: false }
  const dex = id <= 1025 || id >= 3000 ? id : id % 1000
  return { looktype, lookShiny: LOOK_SHINY + dex, mega: false }
}

function resumo(c, esp) {
  return { speciesId: esp.pokeId, nome: esp.name, tipos: [esp.type1, esp.type2].filter(Boolean), ...looksDe(c, esp) }
}

async function iniciar(aoProgresso) {
  const avisar = (fracao, texto) => { try { aoProgresso?.(fracao, texto) } catch {} }
  avisar(0, 'Baixando dados do jogo')
  const [versao, mods, textos, meta, atlas, extras] = await Promise.all([
    lerJson(new URL('versao.json', JOGO)).catch(() => null),
    Promise.all(Object.entries(MODULOS).map(async ([k, arq]) => [k, await import(new URL(arq, JOGO).href)])),
    Promise.all(CATALOGOS.map((c) => lerTexto(new URL(`${c}.json`, JOGO), c !== 'creatures'))),
    lerJson(new URL('meta-pvp.json', BASE)),
    lerJson(new URL('marker-atlas.json', JOGO)).catch(() => null),
    lerJson(new URL('especies-extras.json', BASE)).catch(() => null),
    carregarScript(PRECIFICADOR + SCRIPT_FICHA).catch(() => null)
  ])
  avisar(0.6, 'Montando o catálogo de espécies')
  const m = Object.fromEntries(mods)
  const fontes = () => Object.fromEntries(CATALOGOS.map((c, i) => [c, textos[i] ? JSON.parse(textos[i]) : null]))
  if (!textos[0]) throw new Error('catálogo do jogo vazio')
  const indicador = montarCatalogoIndicador(m, fontes())
  const jogo = montarCatalogoJogo(m, fontes())
  const c = { gi: m.gi, m, meta, indicador, jogo, atlas, extras, versao, formaPorId: new Map(m.formas.FORMAS.map((f) => [f.pokeId, f])) }
  c.lista = [...jogo.values()].filter((e) => e?.name).map((e) => ({ esp: e, chave: normalizar(e.name), ...resumo(c, e) }))
  c.porNome = new Map()
  for (const x of c.lista) if (!c.porNome.has(x.chave)) c.porNome.set(x.chave, x.esp)
  ctx = c
  avisar(1, 'Pronto')
  return { versaoJogo: versao?.versaoJogo ?? null, atualizadoEm: versao?.atualizadoEm ?? null, especies: c.lista.length }
}

export function carregar(aoProgresso) {
  carregando ??= iniciar(aoProgresso).catch((err) => {
    carregando = null
    throw err
  })
  return carregando
}

function exigirCarregado() {
  if (!ctx) throw new Error('motor não carregado: chame carregar() antes')
  return ctx
}

export function buscarEspecies(texto, limite = 12) {
  const c = exigirCarregado()
  const q = normalizar(texto)
  if (!q) return []
  const numero = /^#?\d+$/.test(q) ? Number(q.replace('#', '')) : null
  const prefixo = []
  const meio = []
  for (const x of c.lista) {
    if (numero != null && x.speciesId === numero) prefixo.unshift(x)
    else if (x.chave.startsWith(q)) prefixo.push(x)
    else if (x.chave.includes(q)) meio.push(x)
  }
  const ordem = (a, b) => a.chave.length - b.chave.length || a.speciesId - b.speciesId
  const fixo = numero != null && prefixo[0]?.speciesId === numero ? [prefixo.shift()] : []
  return [...fixo, ...prefixo.sort(ordem), ...meio.sort(ordem)].slice(0, limite).map(({ esp, chave, ...r }) => r)
}

export function especie(speciesId) {
  const c = exigirCarregado()
  const esp = c.jogo.get(Number(speciesId))
  if (!esp) return null
  return { ...resumo(c, esp), base: Object.fromEntries(STATS.map((k) => [k, esp[BASE_DE[k]]])) }
}

export function formas(speciesId) {
  const c = exigirCarregado()
  const esp = c.indicador.get(Number(speciesId))
  if (!esp) return []
  return formasAlcancaveis(esp, c.indicador, c.m).map((f) => c.jogo.get(f.pokeId) || f).map((f) => resumo(c, f))
}

function normalizarPk(pk) {
  const ref = pk?.refino && typeof pk.refino === 'object' ? pk.refino : {}
  return {
    speciesId: Number(pk?.speciesId),
    level: Math.max(1, Math.round(Number(pk?.level) || 1)),
    refino: Object.fromEntries(STATS.map((k) => [k, Math.max(0, Math.round(Number(ref[k]) || 0))])),
    tmElemental: pk?.tmElemental ? String(pk.tmElemental).toUpperCase() : null,
    tmFisico: !!pk?.tmFisico,
    shiny: !!pk?.shiny,
    potencia: Math.min(5, Math.max(1, Math.round(Number(pk?.potencia) || 1))),
    quality: Number(pk?.quality ?? pk?.qualidade) || 1,
    ivs: Object.fromEntries(STATS.map((k) => [k, Math.max(0, Math.min(32, Math.round(Number(pk?.ivs?.[k]) || 0)))]))
  }
}

function scoreDe(c, p) {
  const chave = JSON.stringify([p.speciesId, p.potencia, p.quality, p.shiny, STATS.map((k) => p.ivs[k])])
  if (!cacheScore.has(chave)) {
    if (cacheScore.size > 5000) cacheScore.clear()
    let r = null
    try { r = calcularIndicador(c, p) } catch {}
    cacheScore.set(chave, r)
  }
  const r = cacheScore.get(chave)
  if (!r) return { pvp: null, pve: null, formaPvp: null, formaPve: null, ataque: null, resistencia: null }
  return { pvp: scorePoder(r.pvp.v, 'pvp'), pve: scorePoder(r.pve.v, 'pve'), formaPvp: r.pvp.nome, formaPve: r.pve.nome, ataque: r.pvp.ataque ?? null, resistencia: r.pvp.resistencia ?? null }
}

export function simular(pk) {
  let c
  try { c = exigirCarregado() } catch (err) { return { erro: err.message } }
  const p = normalizarPk(pk)
  const chave = JSON.stringify(p)
  if (cacheSimular.has(chave)) return cacheSimular.get(chave)
  let r
  try {
    const { gi, m } = c
    const esp = c.jogo.get(p.speciesId)
    if (!esp) return { erro: 'espécie desconhecida' }
    const como = p
    const nivelPvp = gi.nivelNoGinasio(p.level)
    const statsPvp = gi.statsNoNivel(como, esp, nivelPvp)
    const g = gi.melhorGolpeDoGinasio(esp, nivelPvp, statsPvp, como.tmElemental || null, !!como.tmFisico, { pvp: true })
    const nota = m.nota.notaDePokemon(como, esp)
    r = {
      speciesId: p.speciesId,
      nome: esp.name,
      tipos: [esp.type1, esp.type2].filter(Boolean),
      base: Object.fromEntries(STATS.map((k) => [k, esp[BASE_DE[k]]])),
      stats: gi.statsNoNivel(como, esp, p.level),
      nivelPvp,
      pvp: gi.poderNoGinasio(como, esp),
      pve: gi.poderNoNivel(como, esp, p.level),
      nota: Number.isFinite(nota) ? nota : null,
      poder: m.nota.poderDePokemon(como, esp),
      golpe: g ? { nome: g.name || g.nome || (g.tmElemental ? 'Z-Move' : null), power: g.power ?? null, tipo: g.type || null, categoria: g.category || null, cdMs: g.cooldownMs ?? null, zmove: !!g.tmElemental } : null,
      score: scoreDe(c, p)
    }
  } catch (err) {
    return { erro: String(err?.message || err) }
  }
  if (cacheSimular.size > 2000) cacheSimular.clear()
  cacheSimular.set(chave, r)
  return r
}

function especiePorFicha(c, texto, nome) {
  const id = Number(/\(#(\d+)\)/.exec(texto)?.[1])
  if (id && c.jogo.has(id)) {
    const e = c.jogo.get(id)
    if (!nome || normalizar(e.name) === normalizar(nome)) return e
  }
  if (!nome) return null
  const limpo = normalizar(nome.replace(/\s*\(.*\)\s*$/, ''))
  return c.porNome.get(limpo) || c.porNome.get(limpo.replace(/^shiny /, '')) || null
}

export function lerFicha(texto) {
  const c = exigirCarregado()
  const leitor = globalThis.PokeIdleFicha
  if (!leitor?.parse || !String(texto ?? '').trim()) return null
  let f
  try { f = leitor.parse(texto) } catch { return null }
  if (!f || (!f.nome && !Object.keys(f.ivs || {}).length)) return null
  const esp = especiePorFicha(c, String(texto), f.nome)
  return {
    speciesId: esp?.pokeId ?? null,
    nome: esp?.name ?? f.nome ?? null,
    level: f.level ?? null,
    potencia: f.potencia ?? null,
    quality: f.quality ?? null,
    nota: f.nota ?? null,
    shiny: !!f.shiny || /✨/.test(String(texto)),
    ivs: { ...f.ivs },
    refino: Object.fromEntries(STATS.map((k) => [k, Number(f.refinoActual?.[k]) || 0]))
  }
}

function carregarScript(url) {
  if (typeof document === 'undefined') {
    return lerTexto(url).then((codigo) => {
      globalThis.window ??= globalThis
      ;(0, eval)(codigo)
    })
  }
  return new Promise((ok, falha) => {
    const s = document.createElement('script')
    s.src = url
    s.async = false
    s.onload = () => ok()
    s.onerror = () => falha(new Error(`não consegui carregar ${url}`))
    document.head.append(s)
  })
}

function complementarEspecies(lista, extras) {
  if (!Array.isArray(lista) || !extras) return
  const porId = new Map(lista.map((e) => [e.id, e]))
  for (const e of extras.especies || []) if (!porId.has(e.id)) { lista.push(e); porId.set(e.id, e) }
  for (const [id, destinos] of Object.entries(extras.evo || {})) {
    const e = porId.get(Number(id))
    if (e) e.evo = [...new Set([...(e.evo || []), ...destinos])]
  }
}

async function iniciarPrecificador() {
  const c = exigirCarregado()
  const [precos] = await Promise.all([
    lerJson(PRECIFICADOR + 'precos.json'),
    (async () => {
      for (const s of SCRIPTS_PRECO) {
        await carregarScript(PRECIFICADOR + s)
        if (s === 'catalogo/especies.js') complementarEspecies(globalThis.PI_ESPECIES, c.extras)
      }
    })()
  ])
  const v = precos?.vendas
  const temVendas = Array.isArray(v) ? v.length > 0 : v?.formato === 2 && v.n > 0 && !!v.campos
  if (!temVendas || !Array.isArray(precos.itens) || !Number.isFinite(Date.parse(precos.geradoEm))) throw new Error('arquivo de preços em formato inesperado')
  const w = globalThis
  return {
    central: w.PokeIdleCentral.create(w),
    precificar: w.PokeIdlePvePricing.priceSheet,
    linhas: w.PokeIdleCentral.linhas(precos),
    precos
  }
}

export async function preco(pk, resultadoSimular) {
  try {
    precificador ??= iniciarPrecificador().catch((err) => {
      precificador = null
      throw err
    })
    const mp = await precificador
    const p = normalizarPk(pk)
    const sim = resultadoSimular && !resultadoSimular.erro ? resultadoSimular : simular(p)
    if (sim?.erro) return { erro: sim.erro }
    const ficha = {
      nome: sim.nome,
      level: p.level,
      potencia: p.potencia,
      quality: p.quality,
      nota: Number.isFinite(Number(sim.nota)) && sim.nota != null ? Number(sim.nota) : null,
      shiny: p.shiny,
      ivs: p.ivs,
      refinoActual: Object.fromEntries(STATS.filter((k) => p.refino[k] > 0).map((k) => [k, p.refino[k]])),
      tmElemental: p.tmElemental,
      tmAoe: pk?.tmAoe === true || pk?.tmAoe === 1
    }
    const r = mp.precificar(mp.central, ficha, {
      rows: mp.linhas,
      itemPrices: mp.precos.itens,
      currentItems: {},
      now: Date.parse(mp.precos.geradoEm),
      ...(Number.isFinite(mp.precos.correcao?.bias) ? { bias: mp.precos.correcao.bias } : {})
    })
    return {
      gemas: r.available ? { rapido: r.low ?? null, justo: r.median ?? null, esperar: r.high ?? null } : null,
      coins: null,
      confianca: r.confidence?.percent ?? null,
      vendasFamilia: r.familyCount ?? 0,
      familia: r.family || null,
      adicionais: (r.parts || []).map((x) => ({ nome: x.label, total: x.total ?? null })),
      atualizadoEm: mp.precos.geradoEm
    }
  } catch (err) {
    return { erro: String(err?.message || err) }
  }
}

export function sprite(looktype) {
  const a = ctx?.atlas
  const pos = looktype != null ? a?.slots?.[String(looktype)] : null
  if (!pos) return null
  return { url: a.url, cell: a.cell, x: pos[0] * a.cell, y: pos[1] * a.cell, caixa: a.caixas?.[String(looktype)] ?? null }
}
