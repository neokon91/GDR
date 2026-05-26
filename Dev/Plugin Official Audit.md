---
categoria: sviluppo
tipo: audit plugin
stato: pronto
---

# Plugin Official Audit

Audit operativo dei plugin inclusi nella release. Questa pagina non sostituisce le guide utente: serve a bloccare regressioni su fonti, sintassi e uso reale.

## Fonti Primarie Usate

- Directory ufficiale Obsidian community plugin: `obsidianmd/obsidian-releases/community-plugins.json`.
- Manifest locali vendorizzati in `.obsidian/plugins/*/manifest.json`.
- `helpUrl` ufficiali quando presenti nel manifest.
- README o sito ufficiale del repository indicato dalla directory community quando il plugin non espone `helpUrl`.

## Contratto Di Verifica

- Ogni plugin abilitato in `.obsidian/community-plugins.json` deve avere record in `Dev/plugin_official_sources.json`.
- Il record deve puntare alla directory ufficiale Obsidian e al repository ufficiale dichiarato.
- Nome e versione devono coincidere con il manifest locale vendorizzato.
- Ogni uso locale rilevante deve essere esplicitato: sintassi Markdown, config, file runtime o limite operativo.
- I plugin senza documentazione separata sono verificati sul README ufficiale del repository dichiarato dalla directory community.

## Limiti Non Negoziabili

- Se un plugin cambia sintassi ufficiale, prima si aggiorna il contratto e poi i template.
- Non aggiungere `BUTTON[...]`, `INPUT[...]`, blocchi `dataviewjs`, `tasks`, `encounter`, `statblock` o `fc-*` senza passare da check automatici.
- Non inserire calendari o contenuti di ambientazioni protette come default release.
- Non disattivare plugin del percorso base nella release: l’utente deve aprire il vault e vedere pagine renderizzate, non codice grezzo.

## Matrice Plugin

| Plugin | Versione | Fonte ufficiale | Uso locale verificato | Esito |
| --- | --- | --- | --- | --- |
| `obsidian-icon-folder` | 2.14.7 | https://github.com/florianwoelki/obsidian-iconize<br>https://github.com/florianwoelki/obsidian-iconize#readme | orientamento cartelle | verificato |
| `media-extended` | 4.2.4 | https://github.com/aidenlx/media-extended<br>https://github.com/aidenlx/media-extended#readme | audio/video indicizzati | verificato |
| `obsidian-5e-statblocks` | 4.10.3 | https://github.com/Obsidian-TTRPG-Community/fantasy-statblocks<br>https://plugins.javalent.com/statblocks | statblock: true; blocchi statblock | verificato |
| `dataview` | 0.5.68 | https://github.com/blacksmithgu/obsidian-dataview<br>https://blacksmithgu.github.io/obsidian-dataview/<br>https://blacksmithgu.github.io/obsidian-dataview/api/intro/ | ```dataview`; ```dataviewjs`; dv.pages; dv.table | verificato |
| `table-editor-obsidian` | 0.23.2 | https://github.com/tgrosinger/advanced-tables-obsidian<br>https://github.com/tgrosinger/advanced-tables-obsidian#readme | editing tabelle Markdown | verificato |
| `templater-obsidian` | 2.20.4 | https://github.com/silentvoid13/Templater<br>https://silentvoid13.github.io/Templater/<br>https://silentvoid13.github.io/Templater/user-functions/script-user-functions.html | <% await tp.user.* %>; user_scripts_folder; templates_folder; runTemplaterFile | verificato |
| `obsidian-kanban` | 2.0.51 | https://github.com/obsidian-community/obsidian-kanban<br>https://publish.obsidian.md/kanban/Obsidian+Kanban+Plugin | frontmatter kanban-plugin: board | verificato |
| `fantasy-content-generator` | 1.2.4 | https://github.com/gregory-jagermeister/Fantasy-Content-Generator<br>https://github.com/gregory-jagermeister/Fantasy-Content-Generator#readme | bozze in Inbox/Generati | verificato |
| `calendarium` | 2.1.0 | https://github.com/javalent/calendarium<br>https://plugins.javalent.com/calendarium | fc-calendar; fc-date; calendario neutro | verificato |
| `obsidian-meta-bind-plugin` | 1.4.10 | https://github.com/mprojectscode/obsidian-meta-bind-plugin<br>https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/<br>https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/guides/inputfields/ | INPUT[...]; BUTTON[...]; buttonTemplates; inputFieldTemplates | verificato |
| `js-engine` | 0.3.5 | https://github.com/mprojectscode/obsidian-js-engine-plugin<br>https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/ | runtime JS opzionale; moduli z.engine usati da DataviewJS | verificato |
| `metadata-menu` | 0.8.12 | https://github.com/mdelobelle/metadatamenu<br>https://mdelobelle.github.io/metadatamenu/ | FileClass; presetFields; classFilesPath | verificato |
| `homepage` | 4.4.2 | https://github.com/mirnovov/obsidian-homepage<br>https://github.com/mirnovov/obsidian-homepage#readme | openOnStartup su Inizia Qui | verificato |
| `callout-manager` | 1.1.1 | https://github.com/eth-p/obsidian-callout-manager<br>https://github.com/eth-p/obsidian-callout-manager#readme | callout custom scena/indizio/segreto | verificato |
| `folder-notes` | 1.8.19 | https://github.com/lostpaul/obsidian-folder-notes<br>https://lostpaul.github.io/obsidian-folder-notes/ | folder note come indice cartella | verificato |
| `obsidian42-brat` | 2.0.4 | https://github.com/tfthacker/obsidian42-brat<br>https://tfthacker.com/BRAT | manutenzione plugin beta | verificato |
| `obsidian-dice-roller` | 11.4.2 | https://github.com/Obsidian-TTRPG-Community/dice-roller<br>https://plugins.javalent.com/dice-roller | dice:; tabelle casuali | verificato |
| `initiative-tracker` | 13.0.21 | https://github.com/Obsidian-TTRPG-Community/initiative-tracker<br>https://plugins.javalent.com/it | blocchi encounter; condizioni combattimento | verificato |
| `obsidian-excalidraw-plugin` | 2.23.3 | https://github.com/zsviczian/obsidian-excalidraw-plugin<br>https://github.com/zsviczian/obsidian-excalidraw-plugin#readme<br>https://excalidraw-obsidian.online/ | file .excalidraw.md; template mappe | verificato |
| `hex-cartographer` | 1.0.2 | https://github.com/taroslord/Hex-Cartographer<br>https://github.com/taroslord/Hex-Cartographer#readme | mappe esagonali opzionali | verificato |
| `zoom-map` | 1.9.5 | https://github.com/jareika/zoom-map<br>https://github.com/jareika/zoom-map#readme | mappe zoomabili | verificato |
| `obsidian-style-settings` | 1.0.9 | https://github.com/obsidian-community/obsidian-style-settings<br>https://github.com/obsidian-community/obsidian-style-settings#readme | snippet gdr-vault settings | verificato |
| `tabs` | 1.1.8 | https://github.com/xhuajin/obsidian-tabs<br>https://github.com/xhuajin/obsidian-tabs#readme | blocchi tabs nelle dashboard | verificato |
| `obsidian-tasks-plugin` | 8.0.0 | https://github.com/obsidian-tasks-group/obsidian-tasks<br>https://publish.obsidian.md/tasks/ | ```tasks`; #task globalFilter | verificato |
| `advanced-canvas` | 6.1.6 | https://github.com/developer-mike/obsidian-advanced-canvas<br>https://github.com/developer-mike/obsidian-advanced-canvas#readme | estensione canvas core | verificato |
| `obsidian-linter` | 1.31.2 | https://github.com/platers/obsidian-linter<br>https://platers.github.io/obsidian-linter/ | lint manuale prudente | verificato |
| `maps` | 0.1.6 | https://github.com/obsidianmd/obsidian-maps<br>https://github.com/obsidianmd/obsidian-maps#readme | .base con vista mappa; coordinates/icon/color | verificato |

## Esito Release

La release corrente passa `npm run check:plugins` e `npm run check:plugin-docs`. Il controllo ufficiale non garantisce che Obsidian renderizzi visivamente ogni plugin su ogni macchina, ma impedisce configurazioni senza fonte, target rotti, usi non dichiarati e documentazione non allineata.
