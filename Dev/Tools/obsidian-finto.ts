/**
 * Un `obsidian` FINTO per le prove headless del plugin (jsdom). Solo ciò che la Board e i
 * modali usano: le estensioni DOM di Obsidian (createDiv, createEl…), ItemView, Notice,
 * Modal e SuggestModal. Le scelte dei modali le decide la prova (`globalThis.__scegli`,
 * `globalThis.__conferma`), come farebbe il GM cliccando.
 */
type Opz = { cls?: string; text?: string; attr?: Record<string, string>; type?: string } | string

function crea(this: HTMLElement, tag: string, o?: Opz): HTMLElement {
  const el = this.ownerDocument.createElement(tag)
  if (typeof o === 'string') el.className = o
  else if (o) {
    if (o.cls) el.className = o.cls
    if (o.text != null) el.textContent = o.text
    if (o.type) el.setAttribute('type', o.type)
    for (const [k, v] of Object.entries(o.attr ?? {})) el.setAttribute(k, v)
  }
  this.appendChild(el)
  return el
}

export function installaDom(win: { HTMLElement: typeof HTMLElement }): void {
  const P = win.HTMLElement.prototype as any
  P.createEl = function (tag: string, o?: Opz) { return crea.call(this, tag, o) }
  P.createDiv = function (o?: Opz) { return crea.call(this, 'div', o) }
  P.createSpan = function (o?: Opz) { return crea.call(this, 'span', o) }
  P.empty = function () { this.innerHTML = '' }
  P.addClass = function (...c: string[]) { this.classList.add(...c) }
  P.removeClass = function (...c: string[]) { this.classList.remove(...c) }
  P.setText = function (t: string) { this.textContent = t }
}

export const avvisi: string[] = []
export class Notice { constructor(m: string) { avvisi.push(String(m)) } }
export class TFile { path = ''; basename = '' }
export type WorkspaceLeaf = any
export type App = any

export class ItemView {
  containerEl: HTMLElement
  app: any
  constructor(public leaf: any) {
    this.app = leaf.app
    this.containerEl = document.createElement('div')
    this.containerEl.appendChild(document.createElement('div'))
    this.containerEl.appendChild(document.createElement('div'))
  }
}

export class Modal {
  contentEl: HTMLElement
  constructor(public app: any) { this.contentEl = document.createElement('div') }
  onOpen?(): void
  onClose?(): void
  open() {
    this.onOpen?.()
    // La prova decide: spunta/conferma (modale multiplo) o risponde (prompt).
    ;(globalThis as any).__conferma?.(this)
  }
  close() { this.onClose?.() }
}

export class SuggestModal<T> extends Modal {
  setPlaceholder(_p: string) {}
  getSuggestions(_q: string): T[] { return [] }
  renderSuggestion(_v: T, _el: HTMLElement) {}
  onChooseSuggestion(_v: T) {}
  open() {
    const voci = this.getSuggestions('')
    const etichette = voci.map((v) => { const el = document.createElement('div'); this.renderSuggestion(v, el); return el.textContent ?? '' })
    const i = (globalThis as any).__scegli?.(etichette) ?? 0
    if (i != null && i >= 0 && voci[i] !== undefined) this.onChooseSuggestion(voci[i])
    this.close()
  }
}

// Lo statblock rende il markdown: nella prova basta il testo.
export class MarkdownRenderChild { constructor(public containerEl: HTMLElement) {} }
export const MarkdownRenderer = {
  render: async (_app: unknown, md: string, el: HTMLElement) => { el.textContent = md },
}
