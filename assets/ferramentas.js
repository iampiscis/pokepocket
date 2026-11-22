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
