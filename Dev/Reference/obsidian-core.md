# Reference: Obsidian core

Doc: https://help.obsidian.md/

## Properties (frontmatter YAML)
Tipi: `text`, `list`, `number`, `checkbox` (bool), `date` (YYYY-MM-DD), `datetime`.
Speciali: `tags`, `aliases`, `cssclasses`.
```yaml
---
nome: Goblin
livello: 3
canonico: true
data: 2026-05-30
tags: [gdr/pronto]
---
```

## Callout
```md
> [!tipo] Titolo
> contenuto
```
Pieghevole: `[!tipo]-` (chiuso) / `[!tipo]+` (aperto). Tipi standard: note, abstract,
info, todo, tip, success, question, warning, failure, danger, bug, example, quote.
Tipi non standard → render come box di default (icona generica). I custom si definiscono
con **Callout Manager** o snippet CSS.

### ⚠️ Callout collassati + blocchi dinamici (gotcha)
Comportamento **core** di Obsidian (non del plugin Callout Manager), rilevante qui perché
la macro `_macros.j2 → tavolo()` emette callout **foldable** (`[!tipo]-`) contenenti campi
**Meta Bind** (`VIEW`/`INPUT`).
- **Render pigro**: un callout chiuso (`[!tipo]-`) **non renderizza il contenuto dinamico**
  (Meta Bind, Dataview, `js-engine`, statblock) finché non lo **apri la prima volta**. Da
  chiuso il campo appare vuoto/assente — non è un bug della pipeline. A volte serve un
  focus/scroll dopo l'apertura per far partire il blocco.
- **Prefisso `>` su OGNI riga**: dentro un callout, ogni riga del contenuto — comprese le
  righe vuote e le **tre backtick** di apertura/chiusura di un code-block — deve iniziare
  con `>`. Una riga senza `>` **spezza** il callout: il blocco "esce" e rende fuori.
- **Stesso effetto nei Tab Panels**: un blocco dinamico in un tab **non attivo** non rende
  finché non apri quel tab (vedi il blocco `encounter`/Vista in ` ````tabs `).
- **Default del progetto**: tenere i blocchi dinamici "pesanti" (Vista js-engine, statblock,
  encounter) **fuori** dai callout foldable chiusi, oppure lasciarli `[!tipo]+` (aperti) se
  devono rendere subito.

## Link & embed
`[[Nota]]`, `[[Nota|alias]]`, `[[Nota#Heading]]`, `[[Nota#^blockid]]`.
Embed: `![[Nota]]`, `![[immagine.png]]`, `![[Nota#Heading]]`.

## Core plugin utili (built-in)
Properties view, Backlinks, Outgoing links, Graph view, Canvas, Bookmarks,
Page preview, Daily notes, Templates (core, distinto da Templater).

## Code block speciali (resi da plugin)
` ```dataview ` / ` ```dataviewjs ` (Dataview), ` ```js-engine ` (JS Engine),
` ```statblock ` (Fantasy Statblocks), ` ```tasks ` (Tasks), ` ````tabs ` (Tab Panels),
` ```meta-bind-button ` (Meta Bind), `` `dice: ...` `` (Dice Roller).
