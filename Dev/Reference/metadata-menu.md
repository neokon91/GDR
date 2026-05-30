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

## Integrazione pipeline (proposta)
Generare i fileClass da YAML (`render.py`) nella cartella fileClasses del vault: ogni
categoria di `core.yaml` → un fileClass con i suoi campi tipizzati. Così i campi del
wizard e quelli del template hanno uno **schema validato** unico.
