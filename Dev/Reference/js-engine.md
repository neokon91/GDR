# Reference: JS Engine (`js-engine`)

Doc: https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/

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
- `engine.importJs(path)` — importa un modulo JS dal vault (alternativa a `dv.io.load`).
- `engine.meta`, `engine.message`, `engine.query`, `engine.lib`.
- Argomenti disponibili nel blocco: `engine`, `app`, `component`, `container`, `context`.

## Quando usarlo vs dataviewjs
JS Engine è più adatto a viste/markdown dinamici riutilizzabili e a importare moduli JS
puliti; dataviewjs è legato all'indice Dataview. In questo progetto le viste usano
dataviewjs + `dv.io.load`; valutare `engine.importJs` per moduli condivisi.
