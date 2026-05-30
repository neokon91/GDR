# Reference: Dataview (`dataview`)

Doc: https://blacksmithgu.github.io/obsidian-dataview/

## Query (DQL) — ` ```dataview `
Tipi: `LIST`, `TABLE`, `TASK`, `CALENDAR`.
```
TABLE col1, col2 AS "Etichetta" FROM <source>
WHERE <condizione>
SORT campo ASC|DESC
GROUP BY campo
FLATTEN campo
LIMIT n
```
**Source** (FROM): `#tag`, `"Cartella"` (doppi apici!), `[[Nota]]` (link a/da),
`outgoing([[Nota]])`, combinabili con `and`/`or`/`-`. `FROM ""` = tutto il vault.

## Inline DQL
`` `= this.campo` `` mostra un campo della nota corrente. `` `= date(today)` ``.

## Campi impliciti `file.*`
`file.name`, `file.link`, `file.folder`, `file.path`, `file.tags`, `file.etags`,
`file.inlinks`, `file.outlinks`, `file.ctime`, `file.mtime`, `file.size`, `file.tasks`.

## DataviewJS — ` ```dataviewjs `
- `dv.current()` — pagina corrente.
- `dv.pages(source)` — es. `dv.pages('"Mondi/Creature"')`, `dv.pages("#tag")`.
- `dv.page(path)`.
- `dv.el(tag, text, {cls, attr})`, `dv.header(level, text)`, `dv.paragraph(text)`.
- `dv.table(headers, rows)`, `dv.list(items)`, `dv.taskList(tasks)`.
- `dv.view(path, input)` — esegue una view JS riutilizzabile.
- `dv.io.load(path)` — legge un file (usato per caricare `z.automazioni/views.js` + `eval`).
- `dv.io.csv(path)`.

Config: `enableDataviewJs: true` (necessario per i blocchi dataviewjs).
