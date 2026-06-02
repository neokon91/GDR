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

## View type e funzioni non sfruttate (Table/Cards 1.9, List/Map 1.10)
Oggi generiamo solo `type: table` con filtri `and`. Disponibile e utile qui:
- **`type: cards`** — galleria con **copertina**: alto payoff per Bestiario/Cast/Atlante coi
  `ritratto`/`mappa` in `Media/` (il "primo impatto" che ci manca). Key immagine **da confermare
  in-app** (probabile `image: note.ritratto`).
- **`groupBy: <property nuda>`** — raggruppa l'Atlante per `regione`, il Cast per `fazione`.
- **`summaries`** — aggregazioni in calce (`Sum/Average/Min/Max/Median/Unique/Filled/…`): es.
  media `pressione` per indice senza una query Dataview separata.
- **`formulas:`** — colonne calcolate; in espressione si usano come `formula.<nome>` (es.
  `formula.clock_pct: (clock / clock_dim) * 100` per ordinare i Fronti).
- **Filtri `or:` / `not:`** annidati (oltre ad `and`) — indici compositi.
- **Funzioni**: `if()`, `now()/today()`, `file.hasTag()`, `file.inFolder("Mondi")`,
  `link.linksTo(file)`, `list.contains()`, `<date>.format(...)` → un `.base` "Rete" nativo
  (chi-linka-chi) accanto agli hub Dataview. Fonte: https://obsidian.md/help/bases/functions
- **Embed in nota**: un base può stare in un blocco ` ```base ` dentro una nota (fence esatto
  **da confermare in-app**).
