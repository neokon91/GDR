---
cssclasses:
  - indice
categoria: risorsa
tipo: sviluppo
stato: pronto
---

# Plugin Technical Reference

Riferimento tecnico per usare tutti i plugin installati nel vault. Questa nota serve allo sviluppo: l'utente finale non deve conoscere questi dettagli.

## Core Obsidian

| Funzione | Uso nel vault | Riferimento |
| --- | --- | --- |
| Properties/frontmatter | Campi YAML letti da Dataview, Bases, Metadata Menu, Meta Bind e controlli. | Help Obsidian: `Properties` |
| Canvas `.canvas` | Reti visuali di note, gruppi, media e connessioni. | https://obsidian.md/help/plugins/canvas |
| Bases `.base` | Viste editabili su frontmatter, table/cards/map, formule, filtri, sort, limit e groupBy. | https://obsidian.md/help/bases |
| Bookmarks | Accesso rapido a pagine vive, non archivio parallelo. | File config: `.obsidian/bookmarks.json` |
| Workspaces | Layout salvati per tavolo, worldbuilding e manutenzione. | File config: `.obsidian/workspaces.json` |

## Plugin Community

| Plugin | Funzioni tecniche da sfruttare | Sintassi/file usati | Riferimento |
| --- | --- | --- | --- |
| Dataview | Query `TABLE`, `LIST`, `TASK`; query JS con `dv.pages`, `dv.table`, `dv.el`, filtri e mapping. | Blocchi `dataview`, `dataviewjs`; config `.obsidian/plugins/dataview/data.json`. | https://blacksmithgu.github.io/obsidian-dataview/ |
| Templater | Script asincroni, `tp.user.*`, prompt, include, move/rename note, creazione guidata. | `<% await tp.user.script(tp) %>`, `<%* ... %>`; script in `z.automazioni`. | https://silentvoid13.github.io/Templater/ |
| Meta Bind | Input inline/blocco, button templates, toggles, suggester, slider, update metadata via template. | `INPUT[text:campo]`, `INPUT[toggle:campo]`, sintassi pulsante `BUTTON` con id template; config `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`. | https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/ |
| JS Engine | Esecuzione JavaScript in note e componenti riusabili quando DataviewJS diventa troppo verboso. | Plugin `js-engine`; moduli locali in `z.engine/`. | https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/ |
| Metadata Menu | FileClass, preset field, tipi campo, suggerimenti e gestione frontmatter. | `z.fileclass/*.md`; config `.obsidian/plugins/metadata-menu/data.json`. | https://mdelobelle.github.io/metadatamenu/ |
| Folder Notes | Note indice associate alle cartelle per navigazione non tecnica. | File indice con stesso nome della cartella. | https://lostpaul.github.io/obsidian-folder-notes/ |
| Homepage | Apertura automatica su pagina iniziale. | Config `.obsidian/plugins/homepage/data.json`; target `Inizia Qui.md`. | Manifest locale `.obsidian/plugins/homepage/manifest.json` |
| Kanban | Board Markdown con liste e task operative. | Frontmatter `kanban-plugin: board`; file in `z.bacheche`. | https://publish.obsidian.md/kanban/Obsidian+Kanban+Plugin |
| Tasks | Filtro globale, priorita, scadenze, ricorrenze, grouping, sorting, done dates. | `#task`, `🔺`, `🔼`, `📅`, `🔁`; blocchi `tasks`; config `.obsidian/plugins/obsidian-tasks-plugin/data.json`. | https://publish.obsidian.md/tasks/ |
| Maps per Bases | Vista mappa dentro file `.base`, marker da proprietà. | `type: map`; campi `coordinates`, `icon`, `color`; plugin id `maps`. | Manifest locale `.obsidian/plugins/maps/manifest.json`; help Bases map view |
| Callout Manager | Tipi callout coerenti e riconoscibili. | Sintassi `> [!tipo]`; config `.obsidian/plugins/callout-manager/data.json`. | https://github.com/eth-p/obsidian-callout-manager |
| Fantasy Statblocks | Parsing frontmatter statblock, rendering schede creatura, richiamo bestiario. | `statblock: true`, campo `name`, blocchi `statblock`. | https://plugins.javalent.com/statblocks |
| Initiative Tracker | Incontri con creature, iniziativa, PF, CA, condizioni e turni. | Blocchi `encounter`; config `.obsidian/plugins/initiative-tracker/data.json`. | https://plugins.javalent.com/it |
| Dice Roller | Tiri inline, table roller, lookup table e risultati annidati. | `dice: 1d20`, richiamo tabella tramite wikilink a block id. | https://plugins.javalent.com/dice |
| Calendarium | Calendari custom/default, eventi, campi `fc-*`, date del mondo. | `fc-calendar`, `fc-date`, `fc-category`, `fc-display-name`, `fc-end`; config `.obsidian/plugins/calendarium/data.json`. | https://plugins.javalent.com/calendarium |
| Excalidraw | Disegni Markdown, mappe, embed, link a note, aree/gruppi e template disegno. | File `.excalidraw.md`; cartella `Risorse/Mappe`; config `.obsidian/plugins/obsidian-excalidraw-plugin/data.json`. | https://github.com/zsviczian/obsidian-excalidraw-plugin |
| Advanced Canvas | Canvas potenziati per reti, fronti e mappe di note. | File `.canvas`; plugin id `advanced-canvas`. | Manifest locale `.obsidian/plugins/advanced-canvas/manifest.json` |
| Media Extended | Apertura media, timestamp, riferimenti a scene/audio/video. | Campi `media`, `timestamp`, `scena`; config `.obsidian/plugins/media-extended/data.json`. | https://mx.aidenlx.site/docs/v4/load-media |
| Fantasy Content Generator | Generazione bozze fantasy e salvataggio in Inbox. | Plugin customizzato; output in `Inbox/Generati` con `plugin: fantasy-content-generator`. | Manifest locale `.obsidian/plugins/fantasy-content-generator/manifest.json` |
| Iconize | Icone su file/cartelle/link per orientamento. | Config `.obsidian/plugins/obsidian-icon-folder/data.json`. | https://florianwoelki.github.io/obsidian-iconize/ |
| Tabs | Sezioni tabbed in note lunghe e dashboard. | Codeblock `tabs`; pattern `tab: Nome`. | https://xhuajin.github.io/obsidian-tabs/ |
| Style Settings | Opzioni visuali per snippet e tema. | Config `.obsidian/plugins/obsidian-style-settings/data.json`; CSS snippet `.obsidian/snippets/gdr-vault.css`. | https://github.com/mgmeyers/obsidian-style-settings |
| Linter | Pulizia manuale controllata: newline, spazi, righe vuote, YAML. | Config `.obsidian/plugins/obsidian-linter/data.json`; mai lint on save. | Manifest locale `.obsidian/plugins/obsidian-linter/manifest.json` |
| Advanced Tables | Editing tabelle Markdown e tabelle casuali leggibili. | Tabelle Markdown standard; config `.obsidian/plugins/table-editor-obsidian/data.json`. | https://github.com/tgrosinger/advanced-tables-obsidian |
| TTRPG Tools: Maps | Mappe zoomabili, marker, layer, misure e note collegate. | Plugin id `zoom-map`; template `z.modelli/mappe/Mappa Zoom.md`. | https://ttrpg-tools-obsidian.org/ |
| Hex Cartographer | Mappe esagonali per hexcrawl, regioni e viaggi. | Plugin id `hex-cartographer`; file JSON/plugin map. | Manifest locale `.obsidian/plugins/hex-cartographer/manifest.json` |
| BRAT | Installazione/test plugin beta o non ufficiali. | Plugin id `obsidian42-brat`; manutenzione, non UX utente. | https://tfthacker.com/BRAT |

## Binding Da TemplateFactory

| Modulo YAML | Responsabilita |
| --- | --- |
| `Dev/TemplateFactory/modules/fields_core.yaml` | Campi canonici e controlli attesi. |
| `Dev/TemplateFactory/modules/plugin_bindings.yaml` | Sintassi plugin usabile nei template generati. |
| `Dev/TemplateFactory/modules/template_blueprints.yaml` | Blueprint per generare template sorgente. |
| `Dev/TemplateFactory/modules/workflows.yaml` | Flussi 1.0 e plugin richiesti. |

## Regole Di Integrazione

- Ogni plugin installato deve apparire in almeno una pagina operativa, una guida o una smoke checklist.
- Se una funzione plugin non ha fallback Markdown, non e pronta per la 1.0.
- Se una sintassi plugin entra in un template, deve essere citata in `plugin_bindings.yaml`.
- Se un campo entra in tre o piu template, deve passare da `fields_core.yaml`, Meta Bind input template, Metadata Menu/FileClass e controlli.
- Le funzioni di manutenzione restano in `Dev/` o script CLI; il DM vede solo pulsanti, viste e note leggibili.
