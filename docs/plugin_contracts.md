# Contratti con i plugin

`render.build()` inietta la config nei plugin **in modo non distruttivo**: tocca
solo le chiavi che la pipeline possiede, e **solo se il plugin è già installato**
(`merge_plugin_config` salta se la cartella del plugin non esiste — non crea
plugin fittizi). Le impostazioni e i contenuti dell'utente sono preservati.

| Plugin | Cosa scrive la pipeline | Sorgente |
|---|---|---|
| **Templater** | `templates_folder: z.modelli`, `user_scripts_folder: z.automazioni`. Gli script JS sono copiati 1:1 in `z.automazioni/` e richiamati come `tp.user.<nome>`. | `Dev/Source/JS/` |
| **Dataview** | `enableDataviewJs: true`. Le pagine-indice (`index.md.j2`) usano blocchi ` ```dataview `; il pannello *Vista* interroga la Dataview API (backlink/fronti). | `index.md.j2`, `views.js` |
| **JS Engine** | Standard per i pannelli dinamici. Macro che emettono ` ```js-engine ` (caricano `views.js` come CommonJS): `vista` (pronto al tavolo + Citato da), `grafico_assi` (radar), `profilo` (tag-da-assi), `clock` (orologio fronte), `difficolta` (incontri), `progressione` (PG). `views.js` è logica condivisa: aggiornarlo si propaga alle note. Vedi [play_layer](play_layer.md). | macro in `_macros.j2`, `views.js` |
| **Bases** (core) | Una vista-DB nativa (`.base`) per dominio in `Indici/`, dalla stessa single-source di `pages.yaml` (filtro categoria, colonne, sort). Gli hub Dataview `.md` restano come fallback. `bases` abilitato in `core-plugins.json`. | `bases_doc()` da `pages.yaml` |
| **Meta Bind** | `enableJs`, `inputFieldTemplates` (da `metabind_inputs`), `buttonTemplates` (un "Crea <X>" per template + le azioni). Le note usano `INPUT[...]`/`VIEW[...]`/`BUTTON[...]`. | `plugins.yaml`, template-entità |
| **Metadata Menu** | Un **fileClass** per categoria in `z.classi/` (campi tipizzati: Select per stato/tipo, File/MultiFile per i link, Number/Input per il resto) + `classFilesPath`. | `fileclass_fields()` dal modello |
| **Fantasy Statblocks** | Union per id dei layout in `obsidian-5e-statblocks/data.json` (NON cambia il default) + `diceRolling: true` (attacchi/danni cliccabili). Layout IT 5e/5.5e. I mostri SRD sono note con `statblock: inline`. | `Dev/Source/statblocks/*.json` |
| **Initiative Tracker** | Dichiarato; usato via blocco ` ```encounter ` (combattimento + iniziativa, legge il bestiario FS). Il pannello *difficoltà* (`renderEncounter`) stima il budget XP 2024 e suggerisce la lista creature per il blocco. | `encounter.md.j2`, `views.js` |
| **Dice Roller** | Macro `tiri()` (d20 Normale/Vantaggio/Svantaggio, ` `dice: …` ` inline) in scheda PG + incontro; più `diceRolling` negli statblock (vedi Fantasy Statblocks). | macro `tiri()`, `encounter.md.j2`, `pg.md.j2` |
| **Iconize** | Mappa percorso-cartella → emoji nel `data.json` (emojiStyle native). | `plugins.yaml:folder_icons` |
| **Callout Manager** | Aggiunge i callout GDR custom (`tavolo`/`gancio`/`segreto`: id/color/icon) in `callouts.custom`; degradano a standard se assenti. | `plugins.yaml:callouts` |
| **Bookmarks** (core) | Aggiunge (senza rimuovere) Home + le pagine-indice (`.md` + `.base`) + l'indice SRD. | `pages.yaml` |
| **community-plugins.json** | Union degli id dei plugin dichiarati. | `plugins.yaml:plugins` |

## Workspace chrome (non plugin)

- `snippets/gdr.css` (+ `appearance.json:enabledCssSnippets`) nasconde le cartelle
  di sistema `z.*` dall'esploratore (restano **indicizzate**: i plugin le vedono).
- `app.json:userIgnoreFilters` esclude le `z.*` da ricerca/grafo. L'albero `SRD/`
  resta navigabile e cercabile.

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
