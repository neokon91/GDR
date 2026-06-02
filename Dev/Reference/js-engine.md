# Reference: JS Engine (`js-engine`)

Versione vault: **v0.3.5**. Doc: https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/

## Uso
Code block ` ```js-engine `: esegue JS e **rende il valore ritornato** al posto del blocco.
```js-engine
return engine.markdown.create('*test*');
```
- ` ```js-engine-debug ` — identico ma con icona per rerun/stats (per debugging).

## API `engine.*`
- `engine.markdown.create(md)` — crea markdown renderizzabile da una stringa.
- `engine.markdown.createBuilder()` — builder: `createHeading(level, text)`,
  `createParagraph(text)`, ... poi `return markdownBuilder`.
- `engine.importJs(path)` — importa un modulo JS dal vault con `import()` **ESM**.
  ⚠️ NON vede `module.exports` (CommonJS): un file con `module.exports = {...}`
  importato così dà un namespace vuoto → `views.fn is not a function`. Per moduli
  CommonJS condivisi (es. `views.js`, usato anche da Templater) leggerli e valutarli
  come CommonJS: `const src = await app.vault.adapter.read(path); const mod={exports:{}};
  new Function("module","exports", src)(mod, mod.exports); const m = mod.exports;`
- `engine.meta`, `engine.message`, `engine.query`, `engine.lib`.
- Argomenti disponibili nel blocco: `engine`, `app`, `component`, `container`, `context`.

## Quando usarlo vs dataviewjs
JS Engine è più adatto a viste/markdown dinamici riutilizzabili. In questo progetto è
lo **standard** per i pannelli (macro `vista`/`grafico_assi`/`confronto_assi`): il
blocco carica `z.automazioni/views.js` (CommonJS via new Function, vedi sopra) e
ritorna `engine.markdown.create(...)` o disegna nel `container`. La logica vive in
`views.js` → aggiornarla si propaga alle note senza ricrearle. Le **query** (backlink,
fronti) usano la Dataview API (`app.plugins.plugins.dataview.api`).

## API non sfruttate (v0.3.5)
- **`engine.prompt.*`** — modali nativi `await`-abili (ritornano `undefined` se annullati):
  `suggester({placeholder?, options:[{label,value}]})`, `button({title, content?, buttons:[{label,value,variant?}]})`,
  `confirm({title,content?})` / `yesNo(...)`, `text/textarea/number({title, ...})`. Più leggeri di
  un wizard Templater per le micro-scelte (scegli bersaglio, conferma "Scatena conseguenza?"); la
  logica vive in `views.js`.
- **`engine.reactive(fn, ...args)`** → `ReactiveComponent`; `component.refresh(...nuoviArgs)` rirun
  `fn` e ridisegna. È la via **supportata** per il render dinamico — candidata a risolvere la
  reattività live di radar/infobox (oggi non-reattivi perché `meta-bind-js-view` dava `META_BIND_ERROR`).
- **`engine.markdown.createBuilder()`** — oltre a `createHeading`/`createParagraph`: `createTable(header[],
  body[][])`, `createCallout(title,type,args)`, **`createCollapsibleCallout(title,type,args,collapsed)`**,
  `createCodeBlock(lang,content)`, `createList()/createOrderedList()`. Più robusto delle stringhe per
  tabelle/callout. `engine.getObsidianModule()` espone `obsidian` (es. `Notice`).
