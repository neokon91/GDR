# Reference: Folder Notes (`folder-notes`)

Versione vault: **v1.8.26** (Lost Paul). Doc: https://lostpaul.github.io/obsidian-folder-notes/

> **Stato: cablato.** Ogni cartella di categoria ha una **nota-cartella auto-indice**
> generata dalla pipeline; cliccare la cartella apre l'indice di quella categoria.

## Cos'è
Associa a una cartella una nota "di copertina": cliccando il nome della cartella
nell'esploratore si apre quella nota invece di limitarsi a espanderla.

## Convenzione (allineata in `data.json`)
- `storageLocation: insideFolder` + `folderNoteName: {{folder_name}}` → la nota-cartella è
  `Mondi/<X>/<X>.md` (omonima della cartella, dentro la cartella).
- `folderNoteType: .md`, `hideFolderNote: true` (la nota non appare fra i figli della cartella).

## Aggancio pipeline
- `folder_index_pages(core, plugins)` (render.py) sintetizza un `page` minimale per ogni
  categoria con sottocartella sotto `Mondi/` (esclusi `mondo`=radice e `nota`=Inbox).
- `render_notes` lo rende con **`index.md.j2`** (stesso template degli hub `Indici/`):
  titolo+icona, bottone *Crea*, tabella Dataview della categoria, fronti caldi.
- `clean()` rimuove le note-cartella (derivate dal modello, non hard-coded).
- `write_folder_notes()` allinea le 4 chiavi-chiave del `data.json` (merge non distruttivo).
- Snapshot: `tests/snapshots/folder_<categoria>.md` (uno per categoria).

## Feature native non cablate (1.8.x)
- **`folder-overview` code block** — indice di cartella nativo/auto-aggiornante. Opzioni:
  `folderPath`, `depth`, `includeTypes` (`["folder","markdown"]`), `style` (`list`/`explorer`/`grid`),
  `sortBy`+`sortByAsc`, `showFolderNotes`, **`useActualLinks: true`** (i link compaiono nel grafo).
  Alternativa/complemento al Dataview in `index.md.j2`; vantaggio = grafo + niente dipendenza Dataview.
- **`excludeFolders`** (array, oggi vuoto): escludi `z.*`/`Media`/`SRD` dal meccanismo per evitare
  folder-note fantasma al click. Cablabile via `write_folder_notes` — candidato concreto.
- **`templatePath`**: template Templater per folder-note create a mano dall'utente.

## ⚠️ Gotcha
- La nota-cartella **non** ha `categoria` nel frontmatter → non compare nella propria tabella.
- Se rinomini una cartella a mano, `syncFolderName: true` rinomina anche la nota; comunque
  un rebuild la rigenera al nome corretto.
