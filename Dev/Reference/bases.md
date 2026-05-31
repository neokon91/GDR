# Reference: Bases (core, `.base`)

Versione vault: **Obsidian 1.12** (Bases è **core**, non un community plugin).
Doc: https://help.obsidian.md/bases

> Usato da: `render.py → write_bases` / `bases_doc`. Una vista `.base` per pagina-indice
> in `Indici/`, dalla **stessa single-source** di `pages.yaml` degli hub Dataview.

## Cos'è
Database-view nativo di Obsidian: un file `.base` (YAML) definisce filtri, colonne e
viste (tabella/cards) su tutte le note del vault. Sostituisce le query Dataview per gli
indici, restando interrogabile dal core. Abilitato da `write_core_settings`
(`core-plugins.json → "bases": true`, in `CORE_PLUGINS`).

## Schema `.base` (YAML)
```yaml
filters:
  and:
    - categoria == "creatura"      # contesto ESPRESSIONE → proprietà NUDA
    - stato != "archiviata"
properties:
  file.name: { displayName: Nome }      # contesto MAPPA → chiave file.name
  note.tipo: { displayName: Tipo }       # contesto MAPPA → chiave note.<campo>
views:
  - type: table
    name: Tutte le voci
    order: [file.name, tipo, mondo]      # contesto ESPRESSIONE → nudo
    sort:
      - { property: tipo, direction: ASC }
```

## ⚠️ Gotcha — asimmetria nude vs `note.`
Verificato sui `.base` reali (Obsidian 1.12). **La stessa proprietà si scrive diversa a
seconda del contesto:**
- **Contesti di espressione** (`filters`, `views[].order`, `sort[].property`): proprietà
  **NUDE** → `categoria`, `pressione`, `tipo`. `file.name` = nome nota; `formula.X` = formula.
- **Contesti di mappa** (`properties`, `columnSize`): chiave **`note.<campo>`** →
  `note.tipo`, `note.mondo`. Eccezione: `file.name` resta `file.name`.

Sbagliare il prefisso = colonna vuota o filtro ignorato, **senza errore**. Lo schema è
**version-sensitive**: se Obsidian cambia il formato `.base`, rigenerare e riverificare
in-app. Gli **hub Dataview restano come fallback** non distruttivo finché lo schema è
confermato.

## Quando usarlo vs Dataview
Bases per gli **indici tabellari** (nativo, veloce, ordinabile in-app). Dataview per
viste/relazioni **dinamiche nel corpo nota** (backlink, fronti, inline `=this.x`) e dove
serve JS (`dataviewjs`).
