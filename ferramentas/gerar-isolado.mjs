import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const [origem, destino] = process.argv.slice(2)
if (!origem || !destino) {
  console.error('uso: node gerar-isolado.mjs <pasta do pokepocket> <pasta do pokepocketferramentas>')
  process.exit(2)
}
const PAGINAS = ['calculadora', 'nivel', 'tier', 'posicionamento', 'monte-seu-time', 'farm', 'shinies']
const SITE = 'https://iampiscis.github.io'
const FONTE = '/pokepocket/'
const ISOLADO = '/pokepocketferramentas/'
const caminho = (p) => `${p}/`
const MODO_VELHO = (p) => `if (new URLSearchParams(location.search).has('ferramentas')) location.replace('${ISOLADO}${caminho(p)}' + location.hash)`
const MODO_NOVO = `document.documentElement.classList.add('so-ferr'); document.documentElement.dataset.isolado = '${ISOLADO}'`
const FORA = [/PokePocket-Setup\.exe/, /github\.com\/iampiscis\/pokepocket"/, /href="\.\.\/#(?!apoie")/, /class="final-txt"/]
const APOIE = (l) => (/class="(coracao|apoio)"/.test(l) ? l.replace('href="../#apoie"', 'href="#apoie"') : l)

const falhou = []
for (const pagina of PAGINAS) {
  const original = readFileSync(resolve(origem, pagina, 'index.html'), 'utf8')
  if (!original.includes(MODO_VELHO(pagina)) || !original.includes('<meta charset="utf-8" />')) { falhou.push(pagina); continue }
  const linhas = original.split('\n').map(APOIE).filter((l) => !FORA.some((r) => r.test(l)))
  const html = linhas.join('\n')
    .replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n  <!-- gerado a partir de iampiscis/pokepocket ${pagina}/index.html; não editar -->\n  <base href="${FONTE}${pagina}/" />`)
    .replace(MODO_VELHO(pagina), MODO_NOVO)
    .replace(`content="${SITE}${FONTE}${pagina}/"`, `content="${SITE}${ISOLADO}${caminho(pagina)}"`)
    .replace(/class="marca" href="\.\.\/"/g, `class="marca" href="${ISOLADO}"`)
    .replace(/ · <a href="\.\.\/">Página inicial<\/a>/g, '')
    .replace(/href="\.\.\/(calculadora|nivel|tier|posicionamento|monte-seu-time|farm|shinies)\/"/g, (_, p) => `href="${ISOLADO}${caminho(p)}"`)
    .replace(/href="\.\/"/g, `href="${ISOLADO}${caminho(pagina)}"`)
  const sobra = html.match(/Setup\.exe|github\.com\/iampiscis|href="\.\.\/"|href="\.\.\/#|href="\.\.\/(calculadora|nivel|tier|posicionamento|monte-seu-time|farm|shinies)\/"/)
  if (sobra) { falhou.push(`${pagina} (sobrou ${sobra[0]})`); continue }
  const pasta = resolve(destino, caminho(pagina))
  mkdirSync(pasta, { recursive: true })
  writeFileSync(resolve(pasta, 'index.html'), html)
}
writeFileSync(resolve(destino, 'index.html'), readFileSync(resolve(origem, 'ferramentas', 'inicio.html'), 'utf8'))
if (falhou.length) {
  console.error(`modelo mudou, revisar o gerador: ${falhou.join(', ')}`)
  process.exit(1)
}
console.log(`geradas: ${PAGINAS.map((p) => ISOLADO + caminho(p)).join(', ')}`)
