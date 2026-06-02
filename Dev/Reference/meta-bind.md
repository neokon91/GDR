# Reference: Meta Bind (`obsidian-meta-bind-plugin`)

Versione vault: **v1.4.12**. Doc: https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/
Sintassi verificata dal sorgente: `packages/core/src/config/ButtonConfig.ts`, `Settings.ts`.

> Usato da: macro Jinja (`_macros.j2`) e config generata (`render.py → meta_bind_config`).

## INPUT (campi editabili)
Inline: `` `INPUT[<tipo>:<prop>]` `` — es. `INPUT[text:ruolo]`, `INPUT[number:ac]`.
Con template di settings: `` `INPUT[<template>][:<prop>]` `` — es. `INPUT[stato][:stato]`.
Tipi comuni: `text`, `textArea`, `number`, `toggle`, `slider(...)`, `date`, `datePicker`,
`inlineSelect(option(a), option(b))`, `suggester(optionQuery("Cartella"), useLinks(partial), allowOther)`,
`inlineListSuggester(...)`.

## VIEW (campi sola lettura / calcolati)
`` `VIEW[{prop}]` `` — mostra una proprietà (tipo default = math).
`` `VIEW[{prop}][text(renderMarkdown)]` `` — testo con markdown.
`` `VIEW[floor(({caratteristiche.forza.stat} - 10) / 2)]` `` — espressione calcolata.
`` `VIEW[{a} * {b}][math:dest]` `` — calcola e **salva** in `dest`.
`` `VIEW[{ritratto}][image]` `` — mostra l'immagine puntata dalla proprietà (`[[wikilink]]`/path;
anche liste). Args: `hidden`, `class`. *(Display nativo per l'infobox, alternativo a renderMap.)*
`` `VIEW[{mondo}][link]` `` — rende il valore come **link cliccabile** (un solo bindTarget).
Riferimenti: `{prop}`, annidati `{a.b.c}`, cross-nota `{NoteName#prop}`.

## BUTTON
Due modi:
1. **Inline (robusto, self-contained)** — code block nella nota:
   ````md
   ```meta-bind-button
   label: Marca Canonico
   style: primary
   action:
     type: runTemplaterFile
     templateFile: z.modelli/azioni/Marca Canonico.md
   ```
   ````
2. **Template in settings + riferimento inline**: `` `BUTTON[<id>]` `` (anche `BUTTON[id1, id2]`).
   Richiede un `ButtonConfig` con quell'`id` in `data.json → buttonTemplates`.

### ButtonConfig (campi)
`label` (req), `style` (req: `default|primary|destructive|plain`), `id?` (per riferimento inline),
`icon?`, `class?`, `cssStyle?`, `tooltip?`, `hidden?`, `action?` **oppure** `actions?` (lista).

### Action types (enum `ButtonActionType`, valori stringa)
`command`, `js`, `open`, `input`, `sleep`, `templaterCreateNote`, `runTemplaterFile`,
`updateMetadata`, `createNote`, `replaceInNote`, `regexpReplaceInNote`, `replaceSelf`,
`insertIntoNote`, `inlineJS`.
- **templaterCreateNote**: `templateFile` (req), `folderPath?`, `fileName?`, `openNote?`.
- **runTemplaterFile**: `templateFile` (req).
- **updateMetadata**: modifica una proprietà **senza** azione-nota Templater — `bindTarget` (req),
  `evaluate: true` → `value` è JS con `x` = valore corrente e `getMetadata('campo')` per altre
  proprietà. Es. `value: "x - getMetadata('danno')"`. Richiede `enableJs`. Per i bottoni di **solo
  reset numerico** (riposo, azzera-clock) elimina la coppia `buttons`+`actions` e il rischio MB_PARSING.

> Input a blocco (non inline) non sfruttati: `progressBar(minValue(0), maxValue(10), addLabels)`
> (alternativa visiva a `slider` per pressione/clock), `list`/`listSuggester` (riordino via
> right-click), `editor` (textArea con markdown).

## Settings (`data.json`)
- `enableJs: true` — necessario per `inlineJS` e view JS.
- `inputFieldTemplates: InputFieldTemplate[]` — `{ name, declaration }`.
- `buttonTemplates: ButtonConfig[]` — array di ButtonConfig (ognuno con `id`).
- ⚠️ Vuoti di default: vanno popolati dalla pipeline. Se la build gira QUANDO il plugin
  non è installato, `merge_plugin_config` salta → restano vuoti → "button Id not found".
  Fix: ribuildare con il plugin installato (la build fa merge, non distrugge).
