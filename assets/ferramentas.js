(() => {
  for (const raiz of document.querySelectorAll('[data-ferramentas]')) {
    const botao = raiz.querySelector('.ferr-botao')
    const lista = raiz.querySelector('.ferr-lista')
    if (!botao || !lista) continue
    const itens = () => [...lista.querySelectorAll('a')]
    const aberto = () => botao.getAttribute('aria-expanded') === 'true'
    const abre = (v, foco) => {
      botao.setAttribute('aria-expanded', String(v))
      lista.classList.toggle('aberta', v)
      if (v && foco !== undefined) {
        const l = itens()
        l[(foco + l.length) % l.length]?.focus()
      }
    }
    botao.addEventListener('click', () => abre(!aberto()))
    botao.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      abre(true, e.key === 'ArrowDown' ? 0 : -1)
    })
    lista.addEventListener('keydown', (e) => {
      const l = itens()
      const i = l.indexOf(document.activeElement)
      const ir = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: l.length - 1 }[e.key]
      if (ir === undefined) return
      e.preventDefault()
      l[(ir + l.length) % l.length].focus()
    })
    raiz.addEventListener('focusout', (e) => { if (aberto() && e.relatedTarget && !raiz.contains(e.relatedTarget)) abre(false) })
    document.addEventListener('click', (e) => { if (aberto() && !raiz.contains(e.target)) abre(false) })
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !aberto()) return
      abre(false)
      botao.focus()
    })
  }
})()

;(() => {
  if (!new URLSearchParams(location.search).has('ferramentas')) return
  const comModo = (href) => {
    const u = new URL(href, location.href)
    if (!/\/(calculadora|nivel|tier)\/$/.test(u.pathname)) return href
    u.searchParams.set('ferramentas', '')
    return u.toString().replace('ferramentas=', 'ferramentas')
  }
  const lista = document.querySelector('.ferr-lista')
  const fontes = lista ? [...lista.querySelectorAll('a')] : []
  const curto = { 'Calculadora Pokémon': 'Calculadora' }
  const nomeDe = (a) => { const t = a.querySelector('.ferr-txt b')?.firstChild?.textContent?.trim() || a.textContent.trim(); return curto[t] || t }
  const secoes = document.querySelector('.topo .secoes')
  if (secoes && fontes.length) {
    secoes.setAttribute('aria-label', 'Ferramentas')
    secoes.replaceChildren(...fontes.map((f) => {
      const a = document.createElement('a')
      a.href = comModo(f.href)
      a.textContent = nomeDe(f)
      if (f.getAttribute('aria-current') === 'page') { a.className = 'ativo'; a.setAttribute('aria-current', 'page') }
      return a
    }))
  }
  const painel = document.querySelector('.painel-menu nav')
  if (painel && fontes.length) {
    painel.setAttribute('aria-label', 'Ferramentas')
    painel.replaceChildren(...fontes.map((f) => {
      const a = document.createElement('a')
      a.href = comModo(f.href)
      const ic = document.createElement('span')
      ic.className = 'ic'
      const svg = f.querySelector('.ferr-ic svg')
      if (svg) ic.append(svg.cloneNode(true))
      a.append(ic, nomeDe(f))
      if (f.getAttribute('aria-current') === 'page') a.setAttribute('aria-current', 'page')
      return a
    }))
  }
  document.querySelectorAll('[data-ferramentas], .painel-pe .pe-rot, .painel-pe .pe-ferr').forEach((el) => { el.hidden = true; el.style.display = 'none' })
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]')
    if (a && !a.target) { const novo = comModo(a.href); if (novo !== a.href) a.href = novo }
  }, true)
})()
