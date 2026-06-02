# Reference: Metadata Menu (`metadata-menu`)

Doc: https://mdelobelle.github.io/metadatamenu/

Gestisce i campi del frontmatter (YAML) e gli inline field (`campo::`) con **tipi**,
valori preimpostati e autocompletamento. È la chiave per **rafforzare le entità**:
schemi di campi tipizzati per categoria via **fileClass**.

## Field types
`Input` (default, testo libero), `Boolean`, `Number` (min/max/step), `Select` (1 da lista),
`Multi` (n da lista), `Cycle`, `File` (link), `MultiFile`, `Media`/`MultiMedia`, `Date`,
`DateTime`, `Time`, `Lookup` (query), `Formula`, `Object`, `ObjectList`, `YAML`, `JSON`,
`Canvas`/`Canvas Group`/`Canvas Group Link`.

## fileClass (schema di categoria)
Una **nota fileClass** nella cartella fileClasses (configurabile). La nota definisce i
campi della categoria e come le note vi si agganciano. Frontmatter del fileClass:
- `fields:` — lista di campi `{ name, type, options, path?, id? }` (opzioni dipendono dal tipo:
  es. Select → `options.values` o `options.sourceType`; Number → `min/max/step`).
- `filesPaths:` — cartelle le cui note ereditano questo fileClass.
- `tagNames:` / `mapWithTag` — aggancio via tag.
- `extends:` — eredita campi da un altro fileClass.
- `excludes`, `icon`, `limit`.

## Aggancio nota → fileClass
1. Chiave frontmatter `fileClass: <nome>` (configurabile), oppure
2. `filesPaths` del fileClass (per cartella), oppure
3. `tagNames`/`mapWithTag` (per tag).

## Integrazione pipeline (IMPLEMENTATA)
`render.py` (`fileclass_note`/`fileclass_fields`) genera **uno fileClass per categoria** in
`z.classi/` da `core.yaml`; `classFilesPath: z.classi/`. Mapping: stato/tipo/famiglia → Select;
relazioni/notes → File/MultiFile; pressione/number → Number; resto → Input.

## Chiavi/field non ancora sfruttati (utili)
- **`extends:`** — un fileClass-base condiviso (`stato`/`mondo`/`connessioni`/`sessioni`) esteso
  dagli altri ridurrebbe la duplicazione nei `z.classi/*.md` generati.
- **`savedViews` / `favoriteView`** — preset (filtri/colonne/sort) della *Table View* nativa del
  fileClass: alternativa editabile in-linea agli hub (oggi coperti da Bases).
- Aggancio anche via **bookmark-group** (oltre a fileClass/filesPaths/tag).
- **`Lookup`** — auto-deriva un campo dalle note che linkano questa (opzione `dvQueryString`,
  sintassi **da confermare in-app**): es. "membri"/"luoghi della regione" sempre aggiornati, vs
  l'inverso scritto a mano dal nostro *Collega*.
- **`Formula`** — campo calcolato da altri campi della stessa nota (espressione tipo-Dataview):
  es. un `minaccia` derivato da `pressione` + clock, tipizzato e interrogabile.
