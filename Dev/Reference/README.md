# Reference plugin — sintassi verificata

Cheat-sheet della sintassi dei plugin **realmente installati** in `dist/GDR-vault`,
da consultare/aggiornare quando si toccano template (Jinja), script (JS) o config.
Ogni file cita la doc ufficiale; le parti critiche sono verificate dal sorgente.

| File | Plugin | Uso nel progetto |
|---|---|---|
| [obsidian-core](obsidian-core.md) | Core Obsidian | frontmatter, callout, link, embed |
| [templater](templater.md) | Templater | wizard creazione (`tp.user.*`), user script autonomi |
| [dataview](dataview.md) | Dataview | viste/query, `dv.io.load`, inline `=this.x` |
| [js-engine](js-engine.md) | JS Engine | markdown/moduli dinamici |
| [tab-panels](tab-panels.md) | Tab Panels | schede note (` ```tabs / --- `) |
| [meta-bind](meta-bind.md) | Meta Bind | INPUT/VIEW/BUTTON |
| [metadata-menu](metadata-menu.md) | Metadata Menu | fileClass = schemi campi entità |
| [fantasy-statblocks](fantasy-statblocks.md) | Fantasy Statblocks | statblock creature |
| [tasks](tasks.md) | Tasks | task sessioni |
| [dice-roller](dice-roller.md) | Dice Roller | tiri al tavolo |

Architettura invariata: **YAML** sorgente → `render.py` genera **JSON** (per i JS) e rende
**Jinja → MD**; i JS sono autonomi e leggono il JSON via `app.vault.adapter.read`.
Architettura completa, modello YAML e workflow: vedi [`README.md`](../../README.md) alla radice.
