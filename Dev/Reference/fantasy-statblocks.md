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

## Schema 5e (chiavi)
`name`, `size`, `type`, `subtype`, `alignment`, `ac`, `hp`, `hit_dice`, `speed`,
`stats: [STR,DEX,CON,INT,WIS,CHA]`, `saves: [{ability: mod}]`, `skillsaves: [{skill: mod}]`,
`damage_vulnerabilities`, `damage_resistances`, `damage_immunities`, `condition_immunities`,
`senses`, `languages`, `cr`, `traits: [{name, desc}]`, `actions`, `bonus_actions`,
`reactions`, `legendary_actions`. `layout:` = nome del layout installato (default "Basic 5e Layout").

## Setting
"Parse Frontmatter in Notes" deve essere ON per registrare creature da frontmatter/inline.
