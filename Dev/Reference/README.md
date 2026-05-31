# Reference plugin — sintassi verificata

Cheat-sheet della sintassi dei plugin **realmente installati** in `dist/GDR-vault`,
da consultare/aggiornare quando si toccano template (Jinja), script (JS) o config.
Ogni file cita la doc ufficiale; le parti critiche sono verificate dal sorgente. Le schede
*non ancora cablate* marcano la sintassi **da verificare in-app** al momento dell'integrazione.

### Attivi nella pipeline (core + cablati da `render.py`)
| File | Plugin | Uso nel progetto |
|---|---|---|
| [obsidian-core](obsidian-core.md) | Core Obsidian | frontmatter, callout (+gotcha collassati), link, embed |
| [bases](bases.md) | Bases (core) | viste-indice native `.base` (`write_bases`) |
| [templater](templater.md) | Templater | wizard creazione (`tp.user.*`), user script autonomi |
| [dataview](dataview.md) | Dataview | viste/query, `dv.io.load`, inline `=this.x` |
| [js-engine](js-engine.md) | JS Engine | markdown/moduli dinamici (pannello Vista, radar) |
| [tab-panels](tab-panels.md) | Tab Panels | schede note (` ```tabs / --- `) |
| [meta-bind](meta-bind.md) | Meta Bind | INPUT/VIEW/BUTTON |
| [metadata-menu](metadata-menu.md) | Metadata Menu | fileClass = schemi campi entità |
| [fantasy-statblocks](fantasy-statblocks.md) | Fantasy Statblocks | statblock creature |
| [callout-manager](callout-manager.md) | Callout Manager | callout GDR custom (tavolo/gancio/segreto) |
| [iconize](iconize.md) | Iconize | icone-emoji cartelle di categoria |
| [homepage](homepage.md) | Homepage | apre Home all'avvio |
| [tasks](tasks.md) | Tasks | task sessioni |
| [dice-roller](dice-roller.md) | Dice Roller | tiri al tavolo |
| [initiative-tracker](initiative-tracker.md) | Initiative Tracker | blocco `encounter` (base; manca XP/auto-popola) |

### Installati, non ancora cablati (aggancio previsto)
| File | Plugin | Aggancio previsto |
|---|---|---|
| [calendarium](calendarium.md) | Calendarium | timeline/cronologia (epoca/evento) — roadmap #4 |
| [excalidraw](excalidraw.md) | Excalidraw | mappe/diagrammi disegnati — roadmap #4 |
| [zoom-map](zoom-map.md) | TTRPG Tools - Maps | mappe interattive con pin — roadmap #4 |
| [fantasy-content-generator](fantasy-content-generator.md) | Fantasy Content Generator | nomi/spunti nel wizard — roadmap #8 |
| [brat](brat.md) | BRAT | manutenzione: install plugin beta da GitHub |

Architettura invariata: **YAML** sorgente → `render.py` genera **JSON** (per i JS) e rende
**Jinja → MD**; i JS sono autonomi e leggono il JSON via `app.vault.adapter.read`.
Architettura completa, modello YAML e workflow: vedi [`README.md`](../../README.md) alla radice.
