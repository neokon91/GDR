# Contratti con i plugin

`render.build()` inietta la config nei plugin **in modo non distruttivo**: tocca
solo le chiavi che la pipeline possiede, e **solo se il plugin è già installato**
(`merge_plugin_config` salta se la cartella del plugin non esiste — non crea
plugin fittizi). Le impostazioni e i contenuti dell'utente sono preservati.

| Plugin | Cosa scrive la pipeline | Sorgente |
|---|---|---|
| **Templater** | `templates_folder: z.modelli`, `user_scripts_folder: z.automazioni`. Gli script JS sono copiati 1:1 in `z.automazioni/` e richiamati come `tp.user.<nome>`. | `Dev/Source/JS/` |
| **Dataview** | `enableDataviewJs: true`. Le pagine-indice (`index.md.j2`) usano blocchi ` ```dataview `; il pannello *Vista* interroga la Dataview API (backlink/fronti). | `index.md.j2`, `views.js` |
| **JS Engine** | Standard per i pannelli dinamici. Macro che emettono ` ```js-engine ` di **una riga**: importano il guscio unico `boot.mjs` (`engine.importJs`) che carica `views.js` come CommonJS e disegna. Pannelli: `vista` (pronto al tavolo + Citato da), `grafico_assi` (radar), `profilo` (tag-da-assi), `clock` (orologio fronte), `difficolta` (incontri), `progressione` (PG). `views.js` è logica condivisa, `boot.mjs` il guscio: aggiornarli si propaga alle note. Vedi [play_layer](play_layer.md). | macro in `_macros.j2`, `boot.mjs`, `views.js` |
| **Tab Panels** | `enableCaching: true` (`write_tab_panels`): i `[[wikilink]]`/heading scritti a mano nel corpo di una tab finiscono nell'indice di Obsidian (backlink/Outline/Dataview) — tutto il corpo nota vive in ` ````tabs `. Note esistenti: "Rebuild cache" una tantum. | `merge_plugin_config` |
| **Bases** (core) | Una vista-DB nativa (`.base`) per dominio in `Indici/`, dalla stessa single-source di `pages.yaml` (filtro categoria, colonne, sort). Gli hub Dataview `.md` restano come fallback. `bases` abilitato in `core-plugins.json`. | `bases_doc()` da `pages.yaml` |
| **Meta Bind** | `enableJs`, `inputFieldTemplates` (da `metabind_inputs`), `buttonTemplates` (un "Crea <X>" per template + le azioni). Le azioni-bottone sono `runTemplaterFile` (richiedono l'azione-nota in `templates.yaml:actions`) **oppure** `command` (lanciano un comando di Obsidian, niente azione-nota: campo `command` su un button in `plugins.yaml`). Le note usano `INPUT[...]`/`VIEW[...]`/`BUTTON[...]`. | `plugins.yaml`, template-entità |
| **Metadata Menu** | Un **fileClass** per categoria in `z.classi/` (campi tipizzati: Select per stato/tipo, File/MultiFile per i link, Number/Input per il resto) + `classFilesPath`. | `fileclass_fields()` dal modello |
| **Fantasy Statblocks** | Union per id dei layout in `obsidian-5e-statblocks/data.json` (NON cambia il default) + `diceRolling: true`. Due layout IT: `statblock.layout` (5.5e fedele, default) e `statblock.layout_5e` (5e classico). `srd_statblock_yaml` mappa i mostri SRD su TUTTI i campi 2024 (initiative/saves/skillsaves/resist./immunità/gear/bonus_actions/reactions/leggendarie+desc/pb). Template creatura: 2 tab (5.5e inline + 5e via `monster:`, dati condivisi); le note creatura hanno `statblock: inline`. | `Dev/Source/statblocks/*.json`, `srd_statblock_yaml`, `creature.md.j2` |
| **Initiative Tracker** | Dichiarato; usato via blocco ` ```encounter ` (combattimento + iniziativa, legge il bestiario FS). Il pannello *difficoltà* (`renderEncounter`) stima il budget XP 2024 e suggerisce la lista creature per il blocco. | `encounter.md.j2`, `views.js` |
| **Dice Roller** | Macro `tiri()` (d20 Normale/Vantaggio/Svantaggio, ` `dice: …` ` inline) in scheda PG + incontro; più `diceRolling` negli statblock (vedi Fantasy Statblocks). | macro `tiri()`, `encounter.md.j2`, `pg.md.j2` |
| **Tasks** | Convenzione `#gancio`/`#trama` (fili narrativi) + `#prep` (checklist sessione). Home → *Al tavolo* ha **🧵 Fili narrativi** e **✅ Da fare**; `sessione` ha la checklist *Prep*. | `home.md.j2`, `session.md.j2` |
| **Calendarium** | Parsing eventi (`write_calendarium`: `autoParse`/`parseDates`/`eventFrontmatter` + `inlineEventsTag: #cronologia`) **+ ponte modello→calendario**: `evento` emette `fc-date` (callout *Calendario*, macro `calendario()`); `epoca` emette `fc-date`+`fc-end` (intervallo, `calendario(range=true)`). Le chiavi `fc-*` sono whitelisted in `validate.INTEROP_FIELDS` (trattino voluto). Il **calendario** (mesi/ere) è contenuto per-mondo: creato in-app dai preset (opt-in). | `write_calendarium()`, macro `calendario()` |
| **Fantasy Content Generator** | Generazione nomi/spunti in corpo nota (PNG/luogo/fazione, macro `genera_nome()`): **suggester inline** (`inlineCallout: "@"`) + **bottone *Genera*** (azione `command` → modale → clipboard). Generatori configurabili **italianizzati** (monete/locande/bevande, struttura esatta `DEFAULT_SETTINGS`). Niente hook wizard (FCG non espone API). Affiancato dal **generatore homebrew** (`genera.js`, vedi [play_layer](play_layer.md)). | `write_fantasy_content_generator()`, `fcg_it.yaml`, macro `genera_nome()` |
| **Folder Notes** | Una **nota-cartella** auto-indice per categoria (`Mondi/<X>/<X>.md`, resa con `index.md.j2`): cliccare la cartella apre l'indice di quella categoria. Config allineata (`insideFolder`, `{{folder_name}}`, `hideFolderNote`). | `folder_index_pages()`, `write_folder_notes()` |
| **Iconize** | Mappa percorso-cartella → emoji nel `data.json` (emojiStyle native). | `plugins.yaml:folder_icons` |
| **Callout Manager** | Aggiunge i callout GDR custom (`tavolo`/`gancio`/`segreto`: id/color/icon) in `callouts.custom`; degradano a standard se assenti. | `plugins.yaml:callouts` |
| **Bookmarks** (core) | Aggiunge (senza rimuovere) Home + le pagine-indice (`.md` + `.base`) + l'indice SRD. | `pages.yaml` |
| **community-plugins.json** | Union degli id dei plugin dichiarati. | `plugins.yaml:plugins` |

## Plugin dichiarati, non configurati (uso user-driven)

Alcuni plugin sono solo **dichiarati** (union in `community-plugins.json`): la pipeline non ne
scrive config — si usano a mano nelle note. Il punto d'aggancio comune è il campo **`mappa`**
(luogo/mondo), embeddato da `views.renderMap` nel tab *Mappa* (macro `mappa()`).

- **Excalidraw** (`obsidian-excalidraw-plugin`) — disegni `*.excalidraw.md` embeddati col campo
  `mappa` (`![[…excalidraw]]`): dimensione `|800`, ritaglio regione `#area=…` (export SVG), link
  interni `[[Luogo]]` cliccabili con hover, annotazione su immagine. → [Reference](../Dev/Reference/excalidraw.md).
- **TTRPG Tools - Maps** (`zoom-map`) — mappe interattive immagine+pin: blocco ` ```zoommap `
  (`image:`; marker che linkano note con hover; righello distanze→tempi di viaggio; overlay/layer;
  `storage` json/note). Via rapida: comando *«Insert new map…»*. → [Reference](../Dev/Reference/zoom-map.md).

## Workspace chrome (non plugin)

- `snippets/gdr.css` (+ `appearance.json:enabledCssSnippets`) nasconde le cartelle
  di sistema `z.*` dall'esploratore (restano **indicizzate**: i plugin le vedono).
- `app.json:userIgnoreFilters` esclude le `z.*` da ricerca/grafo. L'albero `SRD/`
  resta navigabile e cercabile.
- `app.json:attachmentFolderPath` = **`Media/`**: cartella unica per i file utente
  (ritratti/mappe/immagini) e destinazione degli allegati trascinati. Scaffoldata
  (`MEDIA_FOLDER`) + icona Iconize; non è una categoria.

## Sintassi che i template emettono

- Meta Bind: `INPUT[type(args):prop]` (editabile), `VIEW[expr]` / `VIEW[expr][math:dest]`
  (sola lettura / calcolato-e-salvato), `BUTTON[id]`.
- Tab Panels: blocco ` ````tabs ` con separatori `--- <Titolo>`.
- Statblock: blocco ` ```statblock ` con `layout:` dal modello.
- JS Engine: blocco ` ```js-engine ` (pannello *Vista*); Dice Roller: ` `dice: 1d20` ` inline.
- Bases: file `.base` (YAML) accanto agli hub `.md` in `Indici/`.

## Verifica in-app necessaria

La generazione è validata da `npm test`/`check`, ma il **rendering reale dei
plugin** (Meta Bind, tabelle, statblock, wizard Templater) va confermato aprendo
`dist/GDR-vault` in Obsidian dopo un build: l'agente non pilota Obsidian desktop.
