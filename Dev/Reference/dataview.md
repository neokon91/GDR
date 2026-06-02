# Reference: Dataview (`dataview`)

Versione vault: **v0.5.68**. Doc: https://blacksmithgu.github.io/obsidian-dataview/
Funzioni: https://blacksmithgu.github.io/obsidian-dataview/reference/functions/ (nessuna funzione in uso è deprecata)

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

## Funzioni utili (oltre alle base)
- `dateformat(date, "yyyy-MM-dd")` / `dur("2 days")` — formattazione date/durate (Cronologia/timeline).
- `link(path, display)` interno · `elink(url, display)` esterno (se le note citano fonti web).
- `length(rows)` dopo `GROUP BY` = conteggio per gruppo (già usato in Home → *Note per categoria*).
- `file.inlinks` / `length(file.inlinks)` = backlink / grado del nodo (già usato nella *Rete del mondo*).
