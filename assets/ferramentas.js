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
  const isolado = document.documentElement.dataset.isolado
  if (!isolado) return
  const fonte = new URL('../', document.baseURI).pathname
  const comModo = (href) => {
    const u = new URL(href, document.baseURI)
    if (u.origin !== location.origin || u.pathname.startsWith(isolado) || !u.pathname.startsWith(fonte)) return href
    const resto = u.pathname.slice(fonte.length)
    const ehRaiz = resto === '' || resto === 'index.html'
    const pagina = ehRaiz ? '' : resto.match(/^(calculadora|nivel|tier|posicionamento)\/$/)?.[1]
    if (pagina == null) return href
    return new URL(`${isolado}${pagina ? pagina + '/' : ''}${ehRaiz ? '' : u.search + u.hash}`, location.origin).toString()
  }
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
  const ITENS = [
    { p: '', n: 'Início', ic: svg('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>') },
    { p: 'calculadora/', n: 'Calculadora', ic: svg('<rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M8.5 18h.01M12 18h.01M15.5 14.5V18"/>') },
    { p: 'nivel/', n: 'Nível', ic: svg('<path d="M2.5 20.5 9 9.5l3.6 5.6 2.4-3.4 6.5 8.8z"/><path d="M15 11.7V3.5l4.5 1.8L15 7.1"/>') },
    { p: 'tier/', n: 'Tier PvP', ic: svg('<path d="M8 3.5h8V9a4 4 0 0 1-8 0z"/><path d="M8 5.5H5a3 3 0 0 0 3.2 4M16 5.5h3a3 3 0 0 1-3.2 4M12 13v3.5M8.5 20.5h7M9.5 16.5h5v4h-5z"/>') },
    { p: 'posicionamento/', n: 'Posicionamento', ic: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 12h17"/><circle cx="12" cy="12" r="3"/><path d="M8 7.5h.01M16 7.5h.01M8 16.5h.01M12 16.5h.01M16 16.5h.01"/>') },
  ]
  const atual = location.pathname.slice(isolado.length).replace(/index\.html$/, '')
  const montar = (alvo, comTexto) => {
    if (!alvo) return
    alvo.setAttribute('aria-label', 'Ferramentas')
    alvo.dataset.ferr = ''
    alvo.replaceChildren(...ITENS.map((it) => {
      const a = document.createElement('a')
      a.href = isolado + it.p
      a.innerHTML = `<span class="ic">${it.ic}</span>`
      a.append(it.n)
      if (it.p === atual) { a.className = 'ativo'; a.setAttribute('aria-current', 'page') }
      return a
    }))
  }
  montar(document.querySelector('.topo .secoes'))
  montar(document.querySelector('.painel-menu nav'))
  const marca = document.querySelector('.topo .marca')
  if (marca && !marca.querySelector('.marca-ferr')) {
    const tag = document.createElement('span')
    tag.className = 'marca-ferr'
    tag.textContent = 'Ferramentas'
    marca.append(tag)
    marca.setAttribute('aria-label', 'PokePocket Ferramentas, início')
  }
  const troca = (e) => {
    const a = e.target.closest?.('a[href]')
    if (a) { const novo = comModo(a.href); if (novo !== a.href) a.href = novo }
  }
  for (const ev of ['click', 'auxclick', 'contextmenu', 'mouseover', 'focusin', 'touchstart']) document.addEventListener(ev, troca, { capture: true, passive: true })
})()
