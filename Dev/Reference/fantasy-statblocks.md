# Reference: Fantasy Statblocks (`obsidian-5e-statblocks`)

Versione vault: **v4.10.3**. Doc: https://plugins.javalent.com/statblocks · Repo: https://github.com/javalent/fantasy-statblocks

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
- Nome dinamico: il nostro template usa **Templater** `monster: <% tp.config.target_file.basename %>`
  (vedi sotto). *(Alternativa storica: un blocco `dataviewjs` con `dv.current().name`; non più usata.)*

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
- *Statblock 5.5e* = blocco **inline** completo (`name: <% tp.config.target_file.basename %>`): registra la creatura.
- *Statblock 5e* = `monster: <% tp.config.target_file.basename %>` + `layout_5e`: rende la **stessa**
  creatura in stile 5e, senza duplicare i numeri. (`statblock: inline` è già messo dal wizard; FS
  registra il **primo** blocco della nota.) NB: `tp.config.target_file.basename`, NON `tp.file.title`
  (che cattura lo snapshot pre-rename → "Untitled").

## Setting (la pipeline lo abilita)
`autoParse` = "Parse Frontmatter in Notes" → ON (registra creature da frontmatter/inline,
così `monster:` risolve). `diceRolling` ON (attacchi/danni cliccabili).

## Integrazione Initiative Tracker (già nel layout 5.5e)
Il layout `5-5e-ita.json` espone due `action` block nello statblock:
- **"Avvia incontro"** → `InitiativeTracker.newEncounter({roll:true, creatures:[monster]})`
- **"Aggiungi al tracker"** → `InitiativeTracker.addCreatures([monster])`

(richiede Initiative Tracker attivo; degrada silenzioso se assente).

## Campi statblock extra (supportati dal layout, non ancora popolati dal SRD)
- `spells: [...]`, `spellsNotes: "…"` — incantatori.
- `lair_actions: [{name, desc}]`, `regional_effects: [{name, desc}]` — creature da tana 2024.
- `mythic_description`, `mythic_actions: [{name, desc}]` — creature mitiche.
- `image: [[Media/Ritratto.png]]` — ritratto nel cerchio accanto al nome.

## Opzioni di resa (per-blocco)
- `render: true` → dadi 3D anche con il setting globale off.
- `columns: 2` / `forceColumns: true` → forza il numero di colonne (statblock lunghi/leggendari).
