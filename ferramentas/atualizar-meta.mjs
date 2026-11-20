import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const JOGO = path.join(raiz, 'calculadora', 'jogo')
const ARQ_META = path.join(raiz, 'calculadora', 'meta-pvp.json')
const ARQ_REF = path.join(raiz, 'ferramentas', 'meta-pvp-ref.json')
const ARQ_TIER = path.join(raiz, 'tier', 'tier.json')
const PASTA_DADOS = path.join(raiz, 'tier', 'dados')

const API = 'https://pokeidle.io/tracker/api/'
const AGENTE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const TOPO = Math.min(200, Math.max(50, Number(process.env.META_PVP_TOPO) || 150))
const LIMITES = { partidasMin: 1000, p99: 15, max: 30 }
const IV_MEDIO = { hp: 21, atk: 21, def: 21, spAtk: 21, spDef: 21, speed: 21 }
const QUALIDADE_MEDIA = 1.28
const PADRAO = { potencia: 1, quality: 1.1, shiny: true, ivs: { hp: 20, atk: 20, def: 20, spAtk: 20, spDef: 20, speed: 20 } }
const TIERS = [['S+', 0.04], ['S', 0.08], ['S-', 0.18], ['A+', 0.23], ['A', 0.32], ['A-', 0.41], ['B+', 0.51], ['B', 0.6], ['B-', 0.69], ['C', 0.85], ['D', 1]]
const REGRA = `Só shinies, cada forma como aparece nas partidas (mega, forma regional e ramificação separadas), avaliada sozinha com qualidade 1,1, IV 20 em tudo, P1, sem refino. Sem lendários e míticos. Faixas pelas formas shiny usadas nos times do top ${TOPO} do ranqueado, com o meta dessas partidas; formas finais sem uso ficam em foraDoMeta.`
const HORA = 3600000
const DIA = 24 * HORA
const JANELAS = { dia: { idade: 20 * HORA, dias: 1 }, semana: { idade: 7 * DIA - 4 * HORA, dias: 7 }, mes: { idade: 30 * DIA - 4 * HORA, dias: 30 } }
const GUARDA_MS = 31 * DIA
const AMOSTRA = 4000
const MIN_VITORIAS = 20

const NIVEL_REFERENCIA = 2000
const ESCALA_PVP = [10, 25000]
const CURVA_SCORE = 1.8
const LOOK_NORMAL = 60000
const LOOK_SHINY = 70000

const TIPOS = ['NORMAL', 'FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY']
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
const CAMPOS_META = ['geradoEm', 'partidas', 'pokemons', 'T', 'aoe', 'inc', 'invInc', 'def', 'defInv', 'mO', 'mR', 'escala']

const MODULOS = {
  gi: 'ginasios.mjs', ramificadas: 'evolucoes-ramificadas.mjs', evolucoes: 'evolucoes-cruzadas.mjs', megas: 'megas.mjs',
  outland: 'outland.mjs', planilhas: 'golpes-planilhas.mjs', especiais: 'golpes-especiais.mjs', baseOutland: 'herdar-base-outland.mjs',
  golpesOrre: 'herdar-golpes-orre.mjs', ajustes: 'ajustes-especie-espelho.mjs', formas: 'formas.mjs', mistico: 'mistico.mjs'
}
const CATALOGOS = ['creatures', 'creatures-novos', 'creatures-outland-novos', 'creatures-formas', 'creatures-audit-overrides']
const BASE_DE = ['baseHp', 'baseAtk', 'baseDef', 'baseSpAtk', 'baseSpDef', 'baseSpeed']

const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length
const desvio = (a) => { const m = media(a); return Math.sqrt(media(a.map((x) => (x - m) ** 2))) }
const sig = (x, n = 6) => (Number.isFinite(x) ? Number(x.toPrecision(n)) : x)
const lerJson = (arq) => { try { return JSON.parse(fs.readFileSync(arq, 'utf8')) } catch { return null } }
const gravarAtomico = (arq, texto) => { fs.mkdirSync(path.dirname(arq), { recursive: true }); fs.writeFileSync(arq + '.tmp', texto); fs.renameSync(arq + '.tmp', arq) }
const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)

function medianaPonderada(pares) {
  const s = pares.filter(([v]) => Number.isFinite(v)).sort((a, b) => a[0] - b[0])
  const total = s.reduce((t, [, w]) => t + w, 0)
  let acc = 0
  for (const [v, w] of s) { acc += w; if (acc > total / 2) return v }
  return s.at(-1)?.[0]
}

async function carregarContexto() {
  const mods = await Promise.all(Object.entries(MODULOS).map(async ([k, arq]) => [k, await import(pathToFileURL(path.join(JOGO, arq)).href)]))
  const m = Object.fromEntries(mods)
  const fontes = Object.fromEntries(CATALOGOS.map((c) => [c, lerJson(path.join(JOGO, `${c}.json`))]))
  if (!fontes.creatures?.creatures?.length) throw new Error('catálogo do jogo vazio')
  const lista = [...fontes.creatures.creatures]
  for (const k of ['creatures-novos', 'creatures-outland-novos', 'creatures-formas']) if (fontes[k]?.creatures?.length) lista.push(...fontes[k].creatures)
  m.outland.aplicarRemapOutlandLista(lista)
  for (const o of fontes['creatures-audit-overrides']?.overrides ?? []) {
    const c = lista.find((x) => x.pokeId === o.pokeId)
    if (!c) continue
    for (const k of BASE_DE) if (typeof o[k] === 'number') c[k] = o[k]
    if (Array.isArray(o.attacks)) c.attacks = o.attacks.map((a) => ({ ...a }))
  }
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
  return {
    gi: m.gi, m, especies,
    sprites: lerJson(path.join(JOGO, 'sprites.json')),
    atlas: lerJson(path.join(JOGO, 'marker-atlas.json')),
    versao: lerJson(path.join(JOGO, 'versao.json')),
    formaPorId: new Map(m.formas.FORMAS.map((f) => [f.pokeId, f]))
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

function agendaPvp(meta, st, esp, nivel, tm) {
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
  return { gs, valor, casts, investidas, valorInvestida: k * INVESTIDA.power * st.atk }
}

function ataqueEfetivo(meta, st, esp, nivel, tm) {
  const a = agendaPvp(meta, st, esp, nivel, tm)
  let total = a.investidas * a.valorInvestida * meta.defInv
  a.gs.forEach((g, i) => { total += a.casts[i] * a.valor[i] * (meta.def[g.tipo]?.[g.especial ? 1 : 0] ?? 0) })
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

function melhorForcaPvp(gi, meta, pk, esp, nivel) {
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

const pokemonBase = (pk) => ({ potencia: Math.max(1, Math.round(Number(pk.potencia) || 1)), quality: Number(pk.quality ?? pk.qualidade) || 1, shiny: !!pk.shiny, ivs: pk.ivs })

function melhorEfetivo(c, meta, pk, formas) {
  const nivel = c.gi.nivelNoGinasio(NIVEL_REFERENCIA)
  let r = null
  for (const f of formas) {
    const v = melhorForcaPvp(c.gi, meta, pokemonBase(pk), f, nivel)
    if (v && (!r || v.forca > r.forca)) r = { ...v, nome: f.name, speciesId: f.pokeId }
  }
  return r
}

function scorePoder(v) {
  if (!(Number(v) > 0)) return null
  const [lo, hi] = ESCALA_PVP
  const x = Math.max(0, Math.min(1, (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))))
  return Math.round(1000 * x ** CURVA_SCORE)
}

const scoreDaForca = (meta, forca) => scorePoder(Math.max(1, Math.round(Math.exp(meta.escala[0] + meta.escala[1] * Math.log(forca)))))

function metaValido(m) {
  return !!m && CAMPOS_META.every((k) => m[k] != null) && TIPOS.every((t) => Array.isArray(m.inc[t]) && Array.isArray(m.def[t])) && m.mO > 0 && m.mR > 0 && m.escala.length === 2
}

async function api(rota, q) {
  const url = API + rota + '?' + new URLSearchParams(q)
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': AGENTE, accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
      if (r.ok) return await r.json()
    } catch {}
    await espera(3000 + 5000 * t)
  }
  return null
}

async function coletar() {
  const nicks = []
  let temporada = null
  for (let p = 0; nicks.length < TOPO; p++) {
    const j = await api('ladder', { pagina: p, limite: 50 })
    if (!j?.linhas?.length) break
    temporada = j.temporada
    nicks.push(...j.linhas.map((x) => x.nick))
    await espera(500)
  }
  nicks.length = Math.min(nicks.length, TOPO)
  log(`ladder: ${nicks.length} jogadores da temporada ${temporada}`)
  const listas = []
  for (const nick of nicks) {
    const j = await api('partidas', { nick })
    if (j) listas.push({ nick, partidas: j.partidas || [] })
    await espera(500)
    if (listas.length && listas.length % 50 === 0) log(`partidas: ${listas.length} jogadores`)
  }
  const cobertos = new Set()
  const detalhes = []
  for (const l of listas) {
    if (cobertos.has(l.nick) || !l.partidas.length) continue
    const p = l.partidas[0]
    const j = await api('partida', { nick: l.nick, em: p.em })
    cobertos.add(l.nick)
    if (j?.eu && j?.ele) {
      detalhes.push(j)
      cobertos.add(j.ele.nick)
    }
    await espera(400)
  }
  log(`detalhes: ${detalhes.length} partidas`)
  return { temporada, listas, detalhes }
}

function deBruto(c, r) {
  const [id, nv, shiny, hp, tmc] = r
  const esp = c.especies.get(Number(id))
  if (!esp || !(hp > 0)) return null
  const st0 = c.gi.statsNoNivel({ ivs: IV_MEDIO, quality: QUALIDADE_MEDIA, potencia: 1, shiny: !!shiny, speciesId: id, refino: {} }, esp, nv)
  const mul = hp / (c.gi.hpDeCombateGinasio(st0.hp) * 1.5)
  const st = { hp: st0.hp * mul, atk: st0.atk * mul, def: st0.def * mul, spAtk: st0.spAtk * mul, spDef: st0.spDef * mul }
  const tm = tmc >= 0 ? { tipo: TIPOS[tmc % 18], aoe: tmc >= 18, fisico: st.atk > st.spAtk } : null
  return { esp, nv, st, hp, tm, bruto: r }
}

function montarPartidas(c, { listas, detalhes }, dentro) {
  const hpMap = new Map()
  const tmMap = new Map()
  const tmEsp = {}
  const kn = (nick, id) => `${nick}|${id}`
  const guardaHp = (nick, p, hp) => { const k = kn(nick, p.id); const a = hpMap.get(k) || []; a.push([p.nivel, hp]); hpMap.set(k, a) }
  for (const m of detalhes) {
    ;[m.eu, m.ele].forEach((L, lado) => (L.pks || []).forEach((p, idx) => {
      if (p.hp) guardaHp(L.nick, p, p.hp)
      let tm = null
      let bateu = false
      const alvos = {}
      for (const h of m.golpes || []) {
        if (h[1] !== lado || h[2] !== idx) continue
        bateu = true
        const g = m.tabelaGolpes?.[h[4]]
        if (g && /^Z-Move/.test(g.nome)) { tm = tm || { tipo: g.tipo }; (alvos[h[0]] ||= new Set()).add(h[3]) }
      }
      if (tm) { tm.aoe = Object.values(alvos).some((s) => s.size > 1); (tmEsp[p.id] ||= []).push(tm) }
      if (bateu) tmMap.set(kn(L.nick, p.id), tm)
    }))
  }
  for (const j of listas) for (const p of j.partidas) {
    ;[[p.eu, j.nick], [p.ele, p.oponente?.nick]].forEach(([L, nick]) => { for (const pk of L?.pks || []) if (pk.caiu && pk.recebido > 0) guardaHp(nick, pk, pk.recebido) })
  }
  const tmModa = {}
  for (const [id, arr] of Object.entries(tmEsp)) {
    const cont = {}
    for (const t of arr) { const k = t.tipo + (t.aoe ? '*' : ''); cont[k] = (cont[k] || 0) + 1 }
    const [k] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0]
    tmModa[id] = { tipo: k.replace('*', ''), aoe: k.endsWith('*') }
  }
  const hpDe = (nick, p) => {
    const a = hpMap.get(kn(nick, p.id))
    if (!a) return null
    let best = null
    for (const x of a) if (!best || Math.abs(x[0] - p.nivel) < Math.abs(best[0] - p.nivel)) best = x
    if (Math.abs(best[0] - p.nivel) / p.nivel > 0.05) return null
    return best[1] * p.nivel / best[0]
  }
  const cria = (nick, p) => {
    if (!c.especies.has(Number(p.id))) return null
    const hp = hpDe(nick, p)
    if (!hp) return null
    const tm0 = tmMap.has(kn(nick, p.id)) ? tmMap.get(kn(nick, p.id)) : (tmModa[p.id] ?? null)
    const ti = tm0 ? TIPOS.indexOf(String(tm0.tipo).toUpperCase()) : -1
    const o = deBruto(c, [Number(p.id), p.nivel, p.shiny ? 1 : 0, hp, ti >= 0 ? ti + (tm0.aoe ? 18 : 0) : -1])
    if (o) o.bruto = [o.bruto[0], o.bruto[1], o.bruto[2], Math.round(hp), o.bruto[4]]
    return o
  }
  const vistos = new Set()
  const partidas = []
  const unicas = []
  for (const j of listas) for (const p of j.partidas) {
    if (!p.oponente?.nick || !dentro(p.em)) continue
    const k = p.em + '|' + [j.nick, p.oponente.nick].sort().join('|')
    if (vistos.has(k)) continue
    vistos.add(k)
    unicas.push({ venci: !!p.venci, ids: [p.eu, p.ele].map((L) => (L?.pks || []).filter((x) => x.shiny).map((x) => Number(x.id))) })
    const lados = [[p.eu, j.nick], [p.ele, p.oponente.nick]].map(([L, nick]) => (L?.pks || []).map((x) => cria(nick, x)))
    if (lados.some((L) => !L.length || L.some((x) => !x))) continue
    partidas.push({ venci: !!p.venci, lados })
  }
  return { partidas, unicas }
}

function somarMeta(meta0, pks) {
  const inc = Object.fromEntries(TIPOS.map((t) => [t, [0, 0]]))
  const def = Object.fromEntries(TIPOS.map((t) => [t, [0, 0]]))
  let invInc = 0
  let defInv = 0
  for (const o of pks) {
    const a = agendaPvp(meta0, o.st, o.esp, o.nv, o.tm)
    a.gs.forEach((g, i) => { if (inc[g.tipo]) inc[g.tipo][g.especial ? 1 : 0] += a.casts[i] * a.valor[i] })
    invInc += a.investidas * a.valorInvestida
    const tipos = tiposDe(o.esp)
    for (const t of TIPOS) { const e = efetividade(t, tipos); def[t][0] += e / o.st.def; def[t][1] += e / o.st.spDef }
    defInv += 1 / o.st.def
  }
  return { inc, def, invInc, defInv }
}

function montarBalde(c, ativo, bruta, de, ate) {
  const dentro = (em) => { const t = Date.parse(em); return t > de && t <= ate }
  const { partidas, unicas } = montarPartidas(c, bruta, dentro)
  const pks = partidas.flatMap((p) => p.lados.flat())
  const uso = {}
  const vit = {}
  const nicks = []
  let times = 0
  for (const j of bruta.listas) {
    const p = j.partidas.find((x) => dentro(x.em))
    if (!p) continue
    nicks.push(crypto.createHash('sha1').update(String(j.nick).toLowerCase()).digest('hex').slice(0, 10))
    if (!p.eu?.pks?.length) continue
    times++
    for (const id of new Set(p.eu.pks.filter((x) => x.shiny).map((x) => Number(x.id)))) uso[id] = (uso[id] || 0) + 1
  }
  for (const u of unicas) {
    u.ids.forEach((lado, i) => {
      const venceu = i === 0 ? u.venci : !u.venci
      for (const id of new Set(lado)) {
        const v = (vit[id] ||= [0, 0])
        v[0]++
        if (venceu) v[1]++
      }
    })
  }
  const soma = somarMeta(ativo, pks)
  const embaralhados = pks.slice()
  for (let i = embaralhados.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [embaralhados[i], embaralhados[k]] = [embaralhados[k], embaralhados[i]] }
  return {
    balde: {
      v: 2, de: new Date(de).toISOString(), ate: new Date(ate).toISOString(), temporada: bruta.temporada ?? null,
      versaoJogo: c.versao?.versaoJogo ?? null, partidas: unicas.length, completas: partidas.length, N: pks.length,
      soma: { inc: Object.fromEntries(TIPOS.map((t) => [t, soma.inc[t].map((x) => sig(x, 9))])), def: Object.fromEntries(TIPOS.map((t) => [t, soma.def[t].map((x) => sig(x, 9))])), invInc: sig(soma.invInc, 9), defInv: sig(soma.defInv, 9) },
      amostra: embaralhados.slice(0, AMOSTRA).map((o) => o.bruto),
      times, uso, vit, nicks
    },
    partidas,
    pks
  }
}

function nomeBalde(b) {
  return b.ate.slice(0, 16).replace(':', '-') + '.json.gz'
}

function lerBaldes(c) {
  const saida = []
  let nomes = []
  try { nomes = fs.readdirSync(PASTA_DADOS).filter((n) => n.endsWith('.json.gz')) } catch {}
  for (const n of nomes) {
    try {
      const b = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(PASTA_DADOS, n))).toString('utf8'))
      if (b?.v !== 2 || !b.ate) continue
      b.arquivo = n
      b.pks = null
      saida.push(b)
    } catch {}
  }
  for (const b of saida) b.carregarPks = () => (b.pks ??= b.amostra.map((r) => deBruto(c, r)).filter(Boolean))
  return saida.sort((a, b) => Date.parse(a.ate) - Date.parse(b.ate))
}

function gravarBalde(b) {
  const { arquivo, pks, carregarPks, ...limpo } = b
  gravarAtomico(path.join(PASTA_DADOS, nomeBalde(b)), zlib.gzipSync(JSON.stringify(limpo), { level: 9 }))
}

function podarBaldes(agora) {
  let nomes = []
  try { nomes = fs.readdirSync(PASTA_DADOS).filter((n) => n.endsWith('.json.gz')) } catch {}
  for (const n of nomes) {
    const t = Date.parse(n.replace('.json.gz', '').replace(/T(\d\d)-(\d\d)$/, 'T$1:$2:00Z'))
    if (Number.isFinite(t) && agora - t > GUARDA_MS) fs.rmSync(path.join(PASTA_DADOS, n))
  }
}

function fichasReferencia(ref) {
  return ref.fichas.map(([speciesId, quality, potencia, shiny, hp, atk, def, spAtk, spDef, speed]) => ({ speciesId, level: 100, quality, potencia, shiny: !!shiny, ivs: { hp, atk, def, spAtk, spDef, speed } }))
}

function avaliarReferencia(c, formasDe, fichas, meta) {
  return fichas.map((f) => {
    const formas = formasDe(f.speciesId)
    if (!formas) return null
    const r = melhorEfetivo(c, meta, f, formas)
    return r?.ataque ? { bruto: r.ataque + r.resistencia, nome: r.nome } : null
  })
}

function ancorarEscala(brutos, ref) {
  const logs = brutos.filter(Boolean).map((b) => Math.log(b.bruto))
  const b = ref.dp / desvio(logs)
  return [ref.media - b * media(logs), b]
}

function metaDosBaldes(c, ativo, ref, fichas, formasDe, baldes, geradoEm) {
  const N = baldes.reduce((t, b) => t + b.N, 0)
  if (!N) return null
  const inc = Object.fromEntries(TIPOS.map((t) => [t, [0, 1].map((k) => baldes.reduce((s, b) => s + b.soma.inc[t][k], 0) / N)]))
  const def = Object.fromEntries(TIPOS.map((t) => [t, [0, 1].map((k) => baldes.reduce((s, b) => s + b.soma.def[t][k], 0) / N)]))
  const meta = {
    ...Object.fromEntries(CAMPOS_META.map((k) => [k, ativo[k]])),
    geradoEm,
    partidas: baldes.reduce((t, b) => t + b.completas, 0),
    pokemons: N,
    inc,
    invInc: baldes.reduce((s, b) => s + b.soma.invInc, 0) / N,
    def,
    defInv: baldes.reduce((s, b) => s + b.soma.defInv, 0) / N
  }
  const pares = []
  for (const b of baldes) {
    const pks = b.carregarPks()
    const w = b.N / Math.max(1, pks.length)
    for (const o of pks) pares.push([o, w])
  }
  meta.mO = medianaPonderada(pares.map(([o, w]) => [ataqueEfetivo(meta, o.st, o.esp, o.nv, o.tm), w]))
  meta.mR = medianaPonderada(pares.map(([o, w]) => [resistenciaEfetiva(meta, o.st, o.hp / 1.5, o.esp), w]))
  meta.escala = ancorarEscala(avaliarReferencia(c, formasDe, fichas, meta), ref)
  return meta
}

function auc(partidas, f) {
  const xs = partidas.map((p) => ({ y: p.venci, x: Math.log(p.lados[0].reduce((t, o) => t + f(o), 0) / p.lados[1].reduce((t, o) => t + f(o), 0)) }))
  const v = xs.filter((p) => p.y).map((p) => p.x).sort((a, b) => a - b)
  const d = xs.filter((p) => !p.y).map((p) => p.x).sort((a, b) => a - b)
  let s = 0
  let j = 0
  let iguais = 0
  for (const a of v) {
    while (j < d.length && d[j] < a) j++
    iguais = 0
    for (let k = j; k < d.length && d[k] === a; k++) iguais++
    s += j + iguais / 2
  }
  return v.length && d.length ? s / (v.length * d.length) : null
}

function forcaJogo(gi, o) {
  const g = gi.melhorGolpeDoGinasio(o.esp, o.nv, o.st, o.tm?.tipo, o.tm?.fisico, { pvp: true })
  return ((2 * o.nv) / 5 + 2) * (g.power ?? 30) * Math.max(o.st.atk, o.st.spAtk) / 50 / (Math.max(400, g.cooldownMs ?? 2000) / 1000) * o.hp * (o.st.def + o.st.spDef) / 2
}

function validarMeta(c, ativo, meta, partidas, refNovo, refAtual) {
  const relatorio = { partidas: meta.partidas, pokemons: meta.pokemons }
  if (meta.partidas < LIMITES.partidasMin) return { ...relatorio, status: 'rejeitado', motivo: `poucas partidas (${meta.partidas})` }
  if (!metaValido(meta)) return { ...relatorio, status: 'rejeitado', motivo: 'meta incompleto' }
  const mesmoRecorte = ativo.topo === TOPO
  const nv = (b, esc) => scorePoder(Math.exp(esc[0] + esc[1] * Math.log(b))) ?? 0
  const difs = []
  refNovo.forEach((x, i) => {
    const y = refAtual[i]
    if (x && y) difs.push(Math.abs(nv(x.bruto, meta.escala) - nv(y.bruto, ativo.escala)))
  })
  difs.sort((a, b) => a - b)
  const q = (p) => difs[Math.floor(p * (difs.length - 1))]
  relatorio.estabilidade = { referencia: difs.length, mediana: q(0.5), p99: q(0.99), max: difs.at(-1) }
  const forcaCom = (m) => { const cache = new Map(); return (o) => { if (!cache.has(o)) cache.set(o, ataqueEfetivo(m, o.st, o.esp, o.nv, o.tm) / m.mO + resistenciaEfetiva(m, o.st, o.hp / 1.5, o.esp) / m.mR); return cache.get(o) } }
  const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000)
  relatorio.auc = { novo: r3(auc(partidas, forcaCom(meta))), ativo: r3(auc(partidas, forcaCom(ativo))), jogo: r3(auc(partidas, (o) => forcaJogo(c.gi, o))) }
  if (!(relatorio.auc.novo > relatorio.auc.jogo)) return { ...relatorio, status: 'rejeitado', motivo: 'o meta novo não previu os vencedores melhor que o poder do jogo' }
  if (!mesmoRecorte) return { ...relatorio, status: 'aplicado', motivo: `primeiro meta do top ${TOPO}, sem comparar estabilidade` }
  if (relatorio.estabilidade.p99 <= LIMITES.p99 && relatorio.estabilidade.max <= LIMITES.max) return { ...relatorio, status: 'aplicado' }
  return { ...relatorio, status: 'pendente', motivo: `mudança acima do limite (99% até ${relatorio.estabilidade.p99} pts, máximo ${relatorio.estabilidade.max})` }
}

function arredondarMeta(m) {
  const r = (x) => sig(x, 6)
  return {
    geradoEm: m.geradoEm, topo: TOPO, partidas: m.partidas, pokemons: m.pokemons, T: m.T, aoe: m.aoe,
    inc: Object.fromEntries(TIPOS.map((t) => [t, m.inc[t].map(r)])), invInc: r(m.invInc),
    def: Object.fromEntries(TIPOS.map((t) => [t, m.def[t].map(r)])), defInv: r(m.defInv),
    mO: r(m.mO), mR: r(m.mR), escala: m.escala.map(r)
  }
}

const temSprite = (c, lt) => lt != null && !!(c.sprites?.looks?.[lt] || c.atlas?.slots?.[lt])

function shinyDe(c, looktype, padrao) {
  const lt = c.sprites?.shiny?.[looktype] ?? padrao ?? (looktype != null && c.sprites?.looks?.[looktype + 10000] ? looktype + 10000 : null)
  if (lt == null) return null
  return !c.sprites || temSprite(c, lt) ? lt : null
}

function looksDe(c, esp) {
  const { megas, outland } = c.m
  const id = Number(esp.pokeId)
  const mg = megas.megaPorPokeId(id)
  if (mg) {
    const looktype = megas.looktypeDaMega(mg)
    return { looktype, lookShiny: megas.megaTemShiny(mg) ? shinyDe(c, looktype, megas.looktypeShinyDaMega(mg)) : null }
  }
  const forma = c.formaPorId.get(id)
  const looktype = forma?.looktype ?? (temSprite(c, LOOK_NORMAL + id) ? LOOK_NORMAL + id : esp.looktype ?? null)
  if (forma) return { looktype, lookShiny: shinyDe(c, looktype, forma.looktypeShiny) }
  if (outland.isOutlandPokeId(id)) return { looktype, lookShiny: shinyDe(c, looktype, null) }
  const dex = id <= 1025 || id >= 3000 ? id : id % 1000
  return { looktype, lookShiny: shinyDe(c, looktype, LOOK_SHINY + dex) }
}

function prepararLinhas(c) {
  const iniciais = [...c.especies.values()].filter((e) => e?.name && !c.m.megas.isMegaPokeId(e.pokeId) && !c.m.mistico.ehLendarioOuMitico(e.pokeId))
  const formas = new Map()
  for (const e of iniciais) {
    try { formas.set(e.pokeId, formasAlcancaveis(e, c.especies, c.m)) } catch {}
  }
  const alcancaveis = new Map([...formas].map(([id, fs]) => [id, new Set(fs.map((f) => f.pokeId))]))
  const quemAlcanca = new Map()
  for (const [id, set] of alcancaveis) for (const f of set) (quemAlcanca.get(f) || quemAlcanca.set(f, []).get(f)).push(id)
  const baseCache = new Map()
  const baseDe = (fid) => {
    if (baseCache.has(fid)) return baseCache.get(fid)
    const cands = quemAlcanca.get(fid) || [fid]
    const raizes = cands.filter((a) => !cands.some((b) => b !== a && alcancaveis.get(b)?.has(a)))
    const id = (raizes.length ? raizes : cands).reduce((x, y) => Math.min(x, y))
    baseCache.set(fid, id)
    return id
  }
  const folhas = [...c.especies.values()].filter((e) => e?.name && !c.m.mistico.ehLendarioOuMitico(e.pokeId) && (c.m.megas.isMegaPokeId(e.pokeId) || formas.get(e.pokeId)?.length === 1))
  return { formas, baseDe, folhas }
}

function cortarEmTiers(itens) {
  const ordem = itens.slice().sort((a, b) => b.score - a.score || b.forca - a.forca || a.nome.localeCompare(b.nome))
  const n = ordem.length
  const tiers = []
  let i = 0
  for (const [tier, ate] of TIERS) {
    let fim = Math.max(i, Math.round(n * ate))
    while (fim > i && fim < n && ordem[fim].score === ordem[fim - 1].score) fim++
    tiers.push({ tier, itens: ordem.slice(i, fim) })
    i = fim
  }
  if (i < n) tiers[tiers.length - 1].itens.push(...ordem.slice(i))
  return tiers
}

function tierDaJanela(c, linhas, meta, baldes) {
  const nivel = c.gi.nivelNoGinasio(NIVEL_REFERENCIA)
  const times = baldes.reduce((t, b) => t + b.times, 0)
  const uso = new Map()
  const vit = new Map()
  for (const b of baldes) {
    for (const [id, k] of Object.entries(b.uso)) uso.set(Number(id), (uso.get(Number(id)) || 0) + k)
    for (const [id, [n, w]] of Object.entries(b.vit)) { const v = vit.get(Number(id)) || [0, 0]; v[0] += n; v[1] += w; vit.set(Number(id), v) }
  }
  const candidatos = new Set([...uso.keys(), ...linhas.folhas.map((e) => e.pokeId)])
  const itens = []
  for (const id of candidatos) {
    const esp = c.especies.get(id)
    if (!esp?.name || c.m.mistico.ehLendarioOuMitico(id) || c.m.outland.isOutlandPokeId(id)) continue
    const lk = looksDe(c, esp)
    if (lk.lookShiny == null) continue
    const r = melhorForcaPvp(c.gi, meta, pokemonBase(PADRAO), esp, nivel)
    const score = r ? scoreDaForca(meta, r.forca) : null
    if (score == null) continue
    const usam = uso.get(id) || 0
    const [n, w] = vit.get(id) || [0, 0]
    const bid = linhas.baseDe(id)
    itens.push({
      speciesId: id, nome: esp.name, looktype: lk.lookShiny, ...(lk.looktype != null ? { lookNormal: lk.looktype } : {}), tipos: tiposDe(esp),
      score, forca: r.forca, ataque: Math.round(r.ataque * 100) / 100, resistencia: Math.round(r.resistencia * 100) / 100,
      base: { speciesId: bid, nome: c.especies.get(bid)?.name ?? esp.name },
      uso: times ? Math.min(100, Math.round((1000 * usam) / times) / 10) : null,
      vitorias: n >= MIN_VITORIAS ? Math.round((1000 * w) / n) / 10 : null,
      n,
      usado: usam > 0
    })
  }
  const tiers = cortarEmTiers(itens.filter((x) => x.usado))
  const cortes = tiers.filter((t) => t.itens.length).map((t) => ({ tier: t.tier, min: t.itens.at(-1).score }))
  const faixaDe = (score) => (cortes.find((k) => score >= k.min) || cortes.at(-1))?.tier ?? null
  const foraDoMeta = itens.filter((x) => !x.usado)
    .sort((a, b) => b.score - a.score || b.forca - a.forca || a.nome.localeCompare(b.nome))
    .map((x) => ({ ...x, tier: faixaDe(x.score) }))
  for (const x of [...tiers.flatMap((t) => t.itens), ...foraDoMeta]) { delete x.forca; delete x.usado }
  return { cortes, tiers, foraDoMeta }
}

async function principal() {
  const agora = Date.now()
  const c = await carregarContexto()
  const ativo = lerJson(ARQ_META)
  if (!metaValido(ativo)) throw new Error('calculadora/meta-pvp.json inválido')
  const ref = lerJson(ARQ_REF)
  if (!ref?.fichas?.length) throw new Error('ferramentas/meta-pvp-ref.json ausente')
  const linhas = prepararLinhas(c)
  const formasExtras = new Map()
  const formasDe = (id) => {
    const n = Number(id)
    if (linhas.formas.has(n)) return linhas.formas.get(n)
    if (!formasExtras.has(n)) { const e = c.especies.get(n); formasExtras.set(n, e ? formasAlcancaveis(e, c.especies, c.m) : null) }
    return formasExtras.get(n)
  }
  const fichas = fichasReferencia(ref)
  log(`catálogo: ${c.especies.size} espécies, ${linhas.formas.size} iniciais`)

  let bruta = null
  const cache = process.env.META_PVP_COLETA
  if (cache && fs.existsSync(cache)) bruta = JSON.parse(zlib.gunzipSync(fs.readFileSync(cache)).toString('utf8'))
  else {
    const t0 = Date.now()
    bruta = await coletar()
    log(`coleta em ${Math.round((Date.now() - t0) / 60000)} min`)
    if (cache && bruta.listas.length) fs.writeFileSync(cache, zlib.gzipSync(JSON.stringify(bruta)))
  }
  if (!bruta?.listas?.length) {
    console.warn('aviso: o tracker não respondeu; mantive meta-pvp.json e tier.json como estão')
    return
  }

  const anteriores = lerBaldes(c).filter((b) => agora - Date.parse(b.ate) <= GUARDA_MS)
  const ultimo = anteriores.length ? Date.parse(anteriores.at(-1).ate) : 0
  const de = Math.max(ultimo, agora - DIA)
  const atual = montarBalde(c, ativo, bruta, de, agora)
  log(`balde ${atual.balde.de} a ${atual.balde.ate}: ${atual.balde.partidas} partidas, ${atual.balde.completas} completas, ${atual.balde.N} pokémons, ${atual.balde.times} times`)
  if (!atual.balde.partidas) {
    console.warn('aviso: nenhuma partida nova no período; mantive os arquivos como estão')
    return
  }
  atual.balde.carregarPks = () => atual.pks
  const baldes = [...anteriores, atual.balde]
  const geradoEm = new Date(agora).toISOString()
  const naJanela = (j) => baldes.filter((b) => agora - Date.parse(b.ate) < JANELAS[j].idade)

  const baldesDia = naJanela('dia')
  const novoDia = metaDosBaldes(c, ativo, ref, fichas, formasDe, baldesDia, geradoEm)
  let metaDia = ativo
  if (novoDia) {
    const refNovo = avaliarReferencia(c, formasDe, fichas, novoDia)
    const refAtual = avaliarReferencia(c, formasDe, fichas, ativo)
    const rel = validarMeta(c, ativo, novoDia, atual.partidas, refNovo, refAtual)
    log(`meta do dia: ${rel.status}${rel.motivo ? ` (${rel.motivo})` : ''} ${JSON.stringify({ auc: rel.auc, estabilidade: rel.estabilidade })}`)
    if (rel.status === 'aplicado') {
      metaDia = arredondarMeta(novoDia)
      if (!metaValido(metaDia)) metaDia = ativo
      else gravarAtomico(ARQ_META, JSON.stringify(metaDia))
    }
  }

  gravarBalde(atual.balde)
  podarBaldes(agora)

  const janelas = {}
  for (const j of Object.keys(JANELAS)) {
    const bs = naJanela(j)
    let meta = j === 'dia' ? metaDia : metaDosBaldes(c, ativo, ref, fichas, formasDe, bs, geradoEm)
    if (!metaValido(meta)) meta = metaDia
    const nicks = new Set(bs.flatMap((b) => b.nicks))
    const dias = Math.max(1, Math.round(bs.reduce((t, b) => t + Date.parse(b.ate) - Date.parse(b.de), 0) / DIA))
    const { cortes, tiers, foraDoMeta } = tierDaJanela(c, linhas, meta, bs)
    janelas[j] = {
      de: bs[0].de, ate: bs.at(-1).ate, jogadores: nicks.size, partidas: bs.reduce((t, b) => t + b.partidas, 0),
      ...(dias < JANELAS[j].dias ? { parcial: true, dias } : {}),
      cortes, tiers, foraDoMeta
    }
    log(`${j}: ${dias} dia(s), ${janelas[j].partidas} partidas, ${tiers.reduce((t, g) => t + g.itens.length, 0)} formas no meta, ${foraDoMeta.length} fora; S+: ${tiers[0].itens.slice(0, 5).map((x) => `${x.nome} ${x.score}`).join(', ')}`)
  }
  const saida = { geradoEm, versaoJogo: c.versao?.versaoJogo ?? null, temporada: bruta.temporada ?? null, topo: TOPO, regra: REGRA, janelas }
  const texto = JSON.stringify(saida)
  gravarAtomico(ARQ_TIER, texto)
  log(`tier.json: ${Math.round(texto.length / 1024)} KB`)
}

principal().catch((err) => {
  console.error(err?.stack || err)
  process.exit(1)
})
