# Reference: Fantasy Statblocks (`obsidian-5e-statblocks`)

Doc: https://plugins.javalent.com/statblocks

## Render — ` ```statblock `
- Lookup dal bestiario: 
  ```statblock
  monster: Goblin
  ```
- Inline (dati nel blocco, rende sempre):
  ```statblock
  layout: Basic 5e Layout
  name: Goblin
  ... campi 5e ...
  ```
- Nome dinamico via dataviewjs (risolve `this.name`):
  ```dataviewjs
  dv.paragraph("```statblock\nmonster: " + dv.current().name + "\n```")
  ```

## Registrazione nel bestiario (frontmatter)
- `statblock: true` + `name:` → con "Parse Frontmatter in Notes" ON, il frontmatter è
  parsato come mostro (usabile da `monster:`).
- `statblock: inline` → registra il **primo** code block ` ```statblock ` della nota.

## Schema (chiavi, 5.5e completo)
`name`, `size`, `type`, `subtype`, `alignment`, `ac`, `hp`, `hit_dice`, `speed`,
`initiative` (es. "+14 (24)"), `stats: [FOR,DES,COS,INT,SAG,CAR]`, `saves: [{Sigla: mod}]`,
`skillsaves: [{Abilità: mod}]`, `damage_vulnerabilities/resistances/immunities`,
`condition_immunities`, `gear`, `senses`, `languages`, `cr`, `pb`, `traits: [{name, desc}]`,
`actions`, `bonus_actions`, `reactions`, `legendary_description`, `legendary_actions`.

## Layout GDR (due, vendorizzati in `Dev/Source/statblocks/`)
- `statblock.layout` = **"D&D 5.5 Layout ITA - Compatibile 5e"** (default, resa 2024 fedele:
  Iniziativa, griglia caratteristiche, GS con PE+CB, gear, bonus/reazioni/leggendarie).
- `statblock.layout_5e` = **"Basic 5e Layout ITA"** (resa classica 5e).
- Mapping mostri SRD: `build_srd.srd_statblock_yaml` (tutti i campi 2024; campi vuoti omessi;
  iniziativa esplicita preferita al ricalcolo da DES).

## Template creatura — due tab, dati condivisi
- *Statblock 5.5e* = blocco **inline** completo (`name: <% tp.file.title %>`): registra la creatura.
- *Statblock 5e* = `monster: <% tp.file.title %>` + `layout_5e`: rende la **stessa** creatura
  in stile 5e, senza duplicare i numeri. (`statblock: inline` è già messo dal wizard; FS
  registra il **primo** blocco della nota.)

## Setting (la pipeline lo abilita)
`autoParse` = "Parse Frontmatter in Notes" → ON (registra creature da frontmatter/inline,
così `monster:` risolve). `diceRolling` ON (attacchi/danni cliccabili).
