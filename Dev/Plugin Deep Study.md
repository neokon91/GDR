---
categoria: sviluppo
tipo: audit plugin
stato: pronto
---

# Plugin Deep Study

Studio operativo dei plugin installati. Questo file traduce documentazione ufficiale, manifest locale e uso reale del vault in vincoli di prodotto.

## Regola Madre

Un plugin non e installato perche "puo servire". E installato solo se ha un ruolo chiaro, un fallback leggibile e un gate di verifica. Ogni sintassi plugin che puo apparire grezza in Obsidian deve avere un controllo automatico o una superficie manuale di smoke test.

## Plugin Studiati

### `obsidian-icon-folder` - Iconize 2.14.7

- Capacita ufficiale rilevante: Icone cartelle e orientamento visuale.
- Uso locale ammesso: Nessuna logica di gioco; non deve essere prerequisito per capire il vault.
- Errore visibile da evitare: Icone assenti o rumorose, ma nessun blocco rotto.
- Contratto release: Manifest incluso, data.json valido, non usato come navigazione primaria.
- Gate: check:plugins, check:repo.
- Smoke manuale: Aprire una pagina che usa Iconize, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/florianwoelki/obsidian-iconize ; https://github.com/florianwoelki/obsidian-iconize#readme

### `media-extended` - Media Extended 4.2.4

- Capacita ufficiale rilevante: Playback e gestione media in note di scena.
- Uso locale ammesso: Usarlo solo per materiali audio/video realmente pronti; indici Dataview restano fallback.
- Errore visibile da evitare: Embed media non renderizzati o controlli assenti.
- Contratto release: Le pagine media devono restare leggibili senza playback.
- Gate: check:plugins, check:vault.
- Smoke manuale: Aprire una pagina che usa Media Extended, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/aidenlx/media-extended ; https://github.com/aidenlx/media-extended#readme

### `obsidian-5e-statblocks` - Fantasy Statblocks 4.10.3

- Capacita ufficiale rilevante: Blocchi statblock e parsing creature fantasy.
- Uso locale ammesso: Creature con frontmatter coerente; non inventare sintassi statblock fuori plugin.
- Errore visibile da evitare: Schede creatura grezze o errori su blocchi statblock.
- Contratto release: Mostri/creature mantengono statblock e campi verificabili.
- Gate: check:vault, check:templates, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Fantasy Statblocks, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/Obsidian-TTRPG-Community/fantasy-statblocks ; https://plugins.javalent.com/statblocks

### `dataview` - Dataview 0.5.68

- Capacita ufficiale rilevante: Query TABLE/LIST/TASK e blocchi DataviewJS.
- Uso locale ammesso: JS abilitato; blocchi devono compilare e avere fallback leggibile.
- Errore visibile da evitare: Codice dataviewjs visibile, errori rossi, tabelle vuote incomprensibili.
- Contratto release: enableDataviewJs true, blocchi DataviewJS compilati staticamente.
- Gate: check:plugins, check:smoke, check:runtime-load.
- Smoke manuale: Aprire una pagina che usa Dataview, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/blacksmithgu/obsidian-dataview ; https://blacksmithgu.github.io/obsidian-dataview/ ; https://blacksmithgu.github.io/obsidian-dataview/api/intro/

### `table-editor-obsidian` - Advanced Tables 0.23.2

- Capacita ufficiale rilevante: Editing tabelle Markdown.
- Uso locale ammesso: Solo supporto editing; non dipendere da funzioni runtime.
- Errore visibile da evitare: Nessun errore critico, al massimo editing meno comodo.
- Contratto release: Tabelle restano Markdown standard.
- Gate: check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Advanced Tables, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/tgrosinger/advanced-tables-obsidian ; https://github.com/tgrosinger/advanced-tables-obsidian#readme

### `templater-obsidian` - Templater 2.20.4

- Capacita ufficiale rilevante: Esecuzione tp.user.* e template creation.
- Uso locale ammesso: Templater vede solo wrapper funzione in z.automazioni/templater; niente object exports.
- Errore visibile da evitare: Errore Templater export object/function o template non eseguito.
- Contratto release: user_scripts_folder isolato, 54 wrapper importati e verificati come funzioni.
- Gate: check:templater-exports, check:plugins, check:release-artifact.
- Smoke manuale: Aprire una pagina che usa Templater, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/silentvoid13/Templater ; https://silentvoid13.github.io/Templater/ ; https://silentvoid13.github.io/Templater/user-functions/script-user-functions.html

### `obsidian-kanban` - Kanban 2.0.51

- Capacita ufficiale rilevante: Bacheche Markdown con frontmatter kanban-plugin.
- Uso locale ammesso: Bacheche sono supporto operativo, non workflow unico obbligatorio.
- Errore visibile da evitare: Board non renderizzata, ma contenuto Markdown ancora leggibile.
- Contratto release: Frontmatter board e fallback link/workflow presenti.
- Gate: check:vault, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Kanban, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/obsidian-community/obsidian-kanban ; https://publish.obsidian.md/kanban/Obsidian+Kanban+Plugin

### `fantasy-content-generator` - Generatore di Contenuti Fantasy 1.2.4

- Capacita ufficiale rilevante: Generazione bozze fantasy.
- Uso locale ammesso: Solo bozze in Inbox/Generati; mai canonico automatico.
- Errore visibile da evitare: Contenuto generato non smistato o confuso con lore canonica.
- Contratto release: Smistamento/canonizzazione passano da workflow e controlli.
- Gate: check:demo-contract, check:workflow-actions, check:vault.
- Smoke manuale: Aprire una pagina che usa Generatore di Contenuti Fantasy, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/gregory-jagermeister/Fantasy-Content-Generator ; https://github.com/gregory-jagermeister/Fantasy-Content-Generator#readme

### `calendarium` - Calendarium 2.1.0

- Capacita ufficiale rilevante: Calendari, fc-date e scadenze diegetiche.
- Uso locale ammesso: Un solo calendario neutro; nessun calendario proprietario come default.
- Errore visibile da evitare: Errori calendario o riferimenti a setting protetti.
- Contratto release: defaultCalendar neutro e marker vietati assenti.
- Gate: check:plugins, check:vault, check:release-artifact.
- Smoke manuale: Aprire una pagina che usa Calendarium, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/javalent/calendarium ; https://plugins.javalent.com/calendarium

### `obsidian-meta-bind-plugin` - Meta Bind 1.4.10

- Capacita ufficiale rilevante: INPUT, BUTTON e azioni operative.
- Uso locale ammesso: Button solo da template globali; input complessi in blocchi meta-bind; target sempre esistenti.
- Errore visibile da evitare: BUTTON grezzi, input non renderizzati, azioni verso file mancanti.
- Contratto release: Tutti BUTTON/INPUT e templateFile verificati contro data.json.
- Gate: check:plugins, check:workflow-actions, check:vault.
- Smoke manuale: Aprire una pagina che usa Meta Bind, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/mprojectscode/obsidian-meta-bind-plugin ; https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/ ; https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/guides/inputfields/ ; https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/guides/buttons/

### `js-engine` - JS Engine 0.3.5

- Capacita ufficiale rilevante: Esecuzione JS avanzata in note.
- Uso locale ammesso: Opzionale; runtime condiviso resta in z.engine e DataviewJS.
- Errore visibile da evitare: Blocchi JS non renderizzati o doppione di DataviewJS.
- Contratto release: Nessuna dipendenza critica dal plugin per primo percorso utente.
- Gate: check:plugin-docs, check:runtime-load.
- Smoke manuale: Aprire una pagina che usa JS Engine, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/mprojectscode/obsidian-js-engine-plugin ; https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/

### `metadata-menu` - Metadata Menu 0.8.12

- Capacita ufficiale rilevante: FileClass, presetFields e gestione metadata.
- Uso locale ammesso: Preset coerenti con Meta Bind/Bases; non deve riscrivere campi a caso.
- Errore visibile da evitare: Campi incoerenti, suggerimenti mancanti, classi non trovate.
- Contratto release: classFilesPath e preset principali verificati.
- Gate: check:plugins, check:vault, check:metadata.
- Smoke manuale: Aprire una pagina che usa Metadata Menu, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/mdelobelle/metadatamenu ; https://mdelobelle.github.io/metadatamenu/

### `homepage` - Homepage 4.4.2

- Capacita ufficiale rilevante: Apertura automatica su nota iniziale.
- Uso locale ammesso: Deve aprire Inizia Qui; non creare pagine nuove automaticamente.
- Errore visibile da evitare: Vault apre vuoto o pagina tecnica.
- Contratto release: openOnStartup e target verificati in repo e release.
- Gate: check:plugins, check:release-artifact.
- Smoke manuale: Aprire una pagina che usa Homepage, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/mirnovov/obsidian-homepage ; https://github.com/mirnovov/obsidian-homepage#readme

### `callout-manager` - Callout Manager 1.1.1

- Capacita ufficiale rilevante: Callout custom e resa semantica.
- Uso locale ammesso: Callout devono restare blockquote leggibili senza plugin.
- Errore visibile da evitare: Callout non colorati ma testo leggibile.
- Contratto release: Tipi callout custom configurati e fallback Markdown presente.
- Gate: check:vault, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Callout Manager, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/eth-p/obsidian-callout-manager ; https://github.com/eth-p/obsidian-callout-manager#readme

### `folder-notes` - Folder notes 1.8.19

- Capacita ufficiale rilevante: Note indice per cartelle.
- Uso locale ammesso: Navigazione assistita, non dipendenza logica.
- Errore visibile da evitare: Cartella non apre indice, ma note restano accessibili.
- Contratto release: Config presente e indici cartella verificati indirettamente.
- Gate: check:plugins, check:vault.
- Smoke manuale: Aprire una pagina che usa Folder notes, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/lostpaul/obsidian-folder-notes ; https://lostpaul.github.io/obsidian-folder-notes/

### `obsidian42-brat` - BRAT 2.0.4

- Capacita ufficiale rilevante: Gestione plugin beta.
- Uso locale ammesso: Fuori dal percorso DM; non deve essere necessario al primo uso.
- Errore visibile da evitare: Rumore tecnico o update beta non richiesti.
- Contratto release: Documentato come manutenzione, non workflow utente.
- Gate: check:plugin-docs, check:user-path.
- Smoke manuale: Aprire una pagina che usa BRAT, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/tfthacker/obsidian42-brat ; https://tfthacker.com/BRAT

### `obsidian-dice-roller` - Dice Roller 11.4.2

- Capacita ufficiale rilevante: Sintassi dice e tabelle casuali.
- Uso locale ammesso: Usare solo dove il testo resta comprensibile senza roll automatico.
- Errore visibile da evitare: dice: visibile come testo invece di roll.
- Contratto release: Tabelle e guide restano Markdown leggibile.
- Gate: check:vault, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Dice Roller, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/Obsidian-TTRPG-Community/dice-roller ; https://plugins.javalent.com/dice-roller

### `initiative-tracker` - Initiative Tracker 13.0.21

- Capacita ufficiale rilevante: Encounter e iniziativa.
- Uso locale ammesso: Solo incontri preparati; nomi creature coerenti con statblock.
- Errore visibile da evitare: Encounter non caricato o creature non trovate.
- Contratto release: Template incontro/creatura e riferimenti verificati.
- Gate: check:vault, check:templates, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Initiative Tracker, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/Obsidian-TTRPG-Community/initiative-tracker ; https://plugins.javalent.com/it

### `obsidian-excalidraw-plugin` - Excalidraw 2.23.3

- Capacita ufficiale rilevante: Disegni .excalidraw.md e mappe fronti.
- Uso locale ammesso: Nuove mappe in Risorse/Mappe con template dedicato; niente path mancanti.
- Errore visibile da evitare: Disegni aperti in Markdown grezzo o template non trovato.
- Contratto release: folder/templateFilePath verificati e target esistenti.
- Gate: check:plugins, check:vault.
- Smoke manuale: Aprire una pagina che usa Excalidraw, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/zsviczian/obsidian-excalidraw-plugin ; https://github.com/zsviczian/obsidian-excalidraw-plugin#readme ; https://excalidraw-obsidian.online/

### `hex-cartographer` - Hex Cartographer 1.0.2

- Capacita ufficiale rilevante: Mappe esagonali.
- Uso locale ammesso: Opzionale guidato; non deve bloccare flusso base.
- Errore visibile da evitare: Mappa esagonale non renderizzata.
- Contratto release: Patch difensiva e presenza plugin verificate.
- Gate: check:vault, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Hex Cartographer, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/taroslord/Hex-Cartographer ; https://github.com/taroslord/Hex-Cartographer#readme

### `zoom-map` - TTRPG Tools: Maps 1.9.5

- Capacita ufficiale rilevante: Mappe zoomabili e pin.
- Uso locale ammesso: Opzionale per mappe tavolo; fallback via mappe Markdown/Dataview.
- Errore visibile da evitare: Mappa non interattiva o pin assenti.
- Contratto release: Uso limitato e guide mappa presenti.
- Gate: check:plugin-docs, check:vault.
- Smoke manuale: Aprire una pagina che usa TTRPG Tools: Maps, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/jareika/zoom-map ; https://github.com/jareika/zoom-map#readme

### `obsidian-style-settings` - Style Settings 1.0.9

- Capacita ufficiale rilevante: Impostazioni snippet CSS.
- Uso locale ammesso: Solo controlli visuali; contenuto non dipende dallo stile.
- Errore visibile da evitare: Aspetto meno rifinito ma funzionale.
- Contratto release: Snippet gdr-vault e setting presenti.
- Gate: check:plugins, check:release-artifact.
- Smoke manuale: Aprire una pagina che usa Style Settings, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/obsidian-community/obsidian-style-settings ; https://github.com/obsidian-community/obsidian-style-settings#readme

### `tabs` - Tabs 1.1.8

- Capacita ufficiale rilevante: Blocchi tabs.
- Uso locale ammesso: Ridurre scrolling; contenuto deve restare ordinato anche se tabs non renderizza.
- Errore visibile da evitare: Blocchi tabs grezzi o sezioni lunghe.
- Contratto release: Dashboard/template chiave verificati come plugin-native.
- Gate: check:vault, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Tabs, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/xhuajin/obsidian-tabs ; https://github.com/xhuajin/obsidian-tabs#readme

### `obsidian-tasks-plugin` - Tasks 8.0.0

- Capacita ufficiale rilevante: Query tasks con globalFilter #task.
- Uso locale ammesso: Solo task DM operative, non lore/canone.
- Errore visibile da evitare: Task non visibili o warning cache.
- Contratto release: globalFilter e loggingOptions verificati.
- Gate: check:plugins, check:vault.
- Smoke manuale: Aprire una pagina che usa Tasks, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/obsidian-tasks-group/obsidian-tasks ; https://publish.obsidian.md/tasks/

### `advanced-canvas` - Advanced Canvas 6.1.6

- Capacita ufficiale rilevante: Estensione canvas core.
- Uso locale ammesso: Supporto visuale, non percorso base.
- Errore visibile da evitare: Canvas meno potente ma file apribili.
- Contratto release: Canvas non richiesto per primo percorso utente.
- Gate: check:plugin-docs, check:user-path.
- Smoke manuale: Aprire una pagina che usa Advanced Canvas, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/developer-mike/obsidian-advanced-canvas ; https://github.com/developer-mike/obsidian-advanced-canvas#readme

### `obsidian-linter` - Linter 1.31.2

- Capacita ufficiale rilevante: Lint manuale Markdown.
- Uso locale ammesso: Mai lint distruttivo/on save su release utente.
- Errore visibile da evitare: Formattazione automatica che altera frontmatter/template.
- Contratto release: Config prudente e documentata come manutenzione.
- Gate: check:plugins, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Linter, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/platers/obsidian-linter ; https://platers.github.io/obsidian-linter/

### `maps` - Maps 0.1.6

- Capacita ufficiale rilevante: Map view per Bases.
- Uso locale ammesso: Solo su .base/coordinate; tabella resta fallback.
- Errore visibile da evitare: Vista mappa non disponibile, ma Bases tabellare leggibile.
- Contratto release: Atlante Mappe.base e fields coordinate/icon/color presenti.
- Gate: check:release-artifact, check:vault, check:plugin-docs.
- Smoke manuale: Aprire una pagina che usa Maps, verificare resa plugin e fallback Markdown senza errori visibili.
- Fonti: https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json ; https://github.com/obsidianmd/obsidian-maps ; https://github.com/obsidianmd/obsidian-maps#readme

## Debito Residuo

- Questo studio blocca incoerenze statiche e configurazioni incompatibili, ma non sostituisce un passaggio reale nel renderer Obsidian.
- Il prossimo collaudo deve aprire la release zip in un vault pulito e attraversare il percorso Inizia Qui -> Demo -> Prepara -> Gioca -> Post Sessione -> Vista Giocatori.