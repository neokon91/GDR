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
