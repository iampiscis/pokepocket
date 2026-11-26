import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-sonnet-5-5'
const PRECO_ENTRADA = 2 / 1e6
const PRECO_SAIDA = 10 / 1e6
const RESERVA_USD = 0.02
const MAX_IMAGEM = 1.5 * 1024 * 1024
const ORIGENS = ['https://iampiscis.github.io', 'http://localhost:4326']
const TIPOS = ['NORMAL', 'FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY']

const ou = (tipo) => ({ anyOf: [{ type: tipo }, { type: 'null' }] })
const STATS = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed']
const porStat = { anyOf: [{ type: 'object', properties: Object.fromEntries(STATS.map((k) => [k, ou('integer')])), required: STATS, additionalProperties: false }, { type: 'null' }] }

const ESQUEMA = {
  type: 'object',
  properties: {
    ehFicha: { type: 'boolean' },
    nome: ou('string'),
    shiny: { type: 'boolean' },
    nivel: ou('integer'),
    potencia: ou('integer'),
    qualidade: ou('number'),
    nota: ou('number'),
    ivSomado: ou('integer'),
    ivs: porStat,
    stats: porStat,
    refino: ou('integer'),
    tmTipo: { anyOf: [{ type: 'string', enum: TIPOS }, { type: 'null' }] },
    tmFisico: { type: 'boolean' },
    zMove: { type: 'boolean' },
    aoe: { type: 'boolean' }
  },
  required: ['ehFicha', 'nome', 'shiny', 'nivel', 'potencia', 'qualidade', 'nota', 'ivSomado', 'ivs', 'stats', 'refino', 'tmTipo', 'tmFisico', 'zMove', 'aoe'],
  additionalProperties: false
}

const INSTRUCOES = `Você lê prints do jogo Pokéidle e devolve os dados de UM pokémon. Os prints podem ser: a ficha do pokémon (celular ou PC), o cartão de um anúncio do Mercado, ou um cartão de preço de outro app. Leia só o que está visível; quando um campo não aparece, devolva null (ou false para os booleanos). Nunca estime nem calcule valores.

Como ler cada campo:
- nome: a espécie exatamente como escrita, sem "Shiny" na frente (ex.: "Mega Charizard Y", "Alolan Raichu"). Use o título do pokémon, não o nome do jogador.
- shiny: true se houver o selo/etiqueta SHINY, "✨ Shiny" no título ou a palavra shiny junto do nome.
- nivel: o número depois de "Nv" (ex.: "Nv 3.804" = 3804; "Nv 1,044" = 1044). Ignore "conta como Nv".
- potencia: o número de "P1" a "P5" (cartão POTÊNCIA ou pílula "P2").
- qualidade: o número do cartão QUALIDADE, "Q 1,228" ou "Qualidade 1,06". Fica entre 0,8 e 2,0.
- nota: o número grande "5,972 / 10,0", "N 6,503" ou "Nota 5,93". Fica entre 0 e 10.
- ivSomado: "IV SOMADO 126/192", "IV 134" ou "IV 129" (soma dos IVs, de 6 a 192).
- ivs: só se aparecerem as etiquetas "IV n" ao lado de cada stat (HP, ATK, DEF, SP.ATK, SP.DEF, SPD); senão null.
- stats: só se aparecerem os valores atuais de cada stat (ex.: HP 23.469); senão null.
- refino: o número do selo "+N" ao lado do nome (ex.: "+5" = 5); senão null.
- tmTipo e tmFisico: a etiqueta "E: FIRE" é TM elemental especial (tmTipo FIRE, tmFisico false); "F: GRASS" é físico (tmTipo GRASS, tmFisico true). As etiquetas de tipo comuns do pokémon (só "FIRE", "FLYING") NÃO são TM.
- zMove: true se aparecer "Z-Move" como etiqueta, mesmo sem o tipo.
- aoe: true se aparecer a etiqueta "AoE".
- ehFicha: false se o print não mostrar um pokémon do Pokéidle.

Números: o jogo usa vírgula ou ponto como separador decimal e de milhar conforme o idioma. Qualidade e nota têm parte decimal; nível, IVs e stats são inteiros.`

function cors(req) {
  const o = req.headers.get('origin') || ''
  return ORIGENS.includes(o) ? { 'access-control-allow-origin': o, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'origin' } : {}
}

const json = (req, corpo, status = 200) => new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors(req) } })

function tipoImagem(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp'
  return null
}

function base64(b) {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return btoa(s)
}

async function hashIp(ip, dia) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${dia}|${ip}`)))
  return [...h.slice(0, 10)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

const lerNum = async (kv, k) => Number(await kv.get(k)) || 0

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) })
    if (url.pathname !== '/ler' || req.method !== 'POST') return json(req, { erro: 'rota' }, 404)
    if (!cors(req)['access-control-allow-origin']) return json(req, { erro: 'origem' }, 403)
    if (!env.ANTHROPIC_API_KEY) return json(req, { erro: 'indisponivel' }, 503)

    const agora = new Date()
    const dia = agora.toISOString().slice(0, 10)
    const mes = dia.slice(0, 7)
    const tetoMes = Number(env.TETO_MES_USD) || 15
    const tetoDia = Number(env.TETO_DIA_USD) || 0.75
    const limiteIp = Number(env.LIMITE_IP_DIA) || 20
    const kGastoMes = `gasto:${mes}`
    const kGastoDia = `gasto:${dia}`
    const [gastoMes, gastoDia] = await Promise.all([lerNum(env.LEITOR, kGastoMes), lerNum(env.LEITOR, kGastoDia)])
    if (gastoMes + RESERVA_USD > tetoMes || gastoDia + RESERVA_USD > tetoDia) return json(req, { erro: 'orcamento' }, 429)

    const ip = req.headers.get('cf-connecting-ip') || 'sem-ip'
    const kIp = `ip:${dia}:${await hashIp(ip, dia)}`
    const usosIp = await lerNum(env.LEITOR, kIp)
    if (usosIp >= limiteIp) return json(req, { erro: 'limite' }, 429)

    const bytes = new Uint8Array(await req.arrayBuffer())
    if (!bytes.length || bytes.length > MAX_IMAGEM) return json(req, { erro: 'tamanho' }, 413)
    const tipo = tipoImagem(bytes)
    if (!tipo) return json(req, { erro: 'formato' }, 415)

    await env.LEITOR.put(kIp, String(usosIp + 1), { expirationTtl: 2 * 86400 })

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 45000 })
    let resp
    try {
      resp = await client.beta.messages.create({
        model: MODELO,
        max_tokens: 2000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
        system: INSTRUCOES,
        messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: tipo, data: base64(bytes) } }, { type: 'text', text: 'Leia este print.' }] }]
      })
    } catch (e) {
      const status = e instanceof Anthropic.RateLimitError ? 429 : 502
      return json(req, { erro: status === 429 ? 'ocupado' : 'falha' }, status)
    }

    const custo = (resp.usage?.input_tokens || 0) * PRECO_ENTRADA + (resp.usage?.output_tokens || 0) * PRECO_SAIDA
    await Promise.all([
      env.LEITOR.put(kGastoMes, String(gastoMes + custo), { expirationTtl: 40 * 86400 }),
      env.LEITOR.put(kGastoDia, String(gastoDia + custo), { expirationTtl: 3 * 86400 })
    ])

    if (resp.stop_reason === 'refusal' || resp.stop_reason === 'max_tokens') return json(req, { erro: 'sem-leitura' }, 422)
    const texto = resp.content.find((b) => b.type === 'text')?.text
    let ficha
    try { ficha = JSON.parse(texto) } catch { return json(req, { erro: 'sem-leitura' }, 422) }
    return json(req, { ficha })
  }
}
