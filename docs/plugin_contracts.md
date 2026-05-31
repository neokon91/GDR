# Contratti con i plugin

`render.build()` inietta la config nei plugin **in modo non distruttivo**: tocca
solo le chiavi che la pipeline possiede, e **solo se il plugin è già installato**
(`merge_plugin_config` salta se la cartella del plugin non esiste — non crea
plugin fittizi). Le impostazioni e i contenuti dell'utente sono preservati.

| Plugin | Cosa scrive la pipeline | Sorgente |
|---|---|---|
| **Templater** | `templates_folder: z.modelli`, `user_scripts_folder: z.automazioni`. Gli script JS sono copiati 1:1 in `z.automazioni/` e richiamati come `tp.user.<nome>`. | `Dev/Source/JS/` |
| **Dataview** | `enableDataviewJs: true`. Le viste (`views.js`) sono caricate dai template via `dv.io.load`. | macro `vista()` |
| **Meta Bind** | `enableJs`, `inputFieldTemplates` (da `metabind_inputs`), `buttonTemplates` (un "Crea <X>" per template + le azioni). Le note usano `INPUT[...]`/`VIEW[...]`/`BUTTON[...]`. | `plugins.yaml`, template-entità |
| **Metadata Menu** | Un **fileClass** per categoria in `z.classi/` (campi tipizzati: Select per stato/tipo, File/MultiFile per i link, Number/Input per il resto) + `classFilesPath`. | `fileclass_fields()` dal modello |
| **Fantasy Statblocks** | Union per id dei layout in `obsidian-5e-statblocks/data.json` (NON cambia il default). Layout IT 5e/5.5e. I mostri SRD sono note con `statblock: inline`. | `Dev/Source/statblocks/*.json` |
| **Iconize** | Mappa percorso-cartella → emoji nel `data.json` (emojiStyle native). | `plugins.yaml:folder_icons` |
| **Callout Manager** | Aggiunge i callout GDR custom (`tavolo`/`gancio`/`segreto`: id/color/icon) in `callouts.custom`; degradano a standard se assenti. | `plugins.yaml:callouts` |
| **Bookmarks** (core) | Aggiunge (senza rimuovere) Home + le pagine-indice + l'indice SRD. | `pages.yaml` |
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

## Verifica in-app necessaria

La generazione è validata da `npm test`/`check`, ma il **rendering reale dei
plugin** (Meta Bind, tabelle, statblock, wizard Templater) va confermato aprendo
`dist/GDR-vault` in Obsidian dopo un build: l'agente non pilota Obsidian desktop.
