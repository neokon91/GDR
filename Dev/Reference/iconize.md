# Reference: Iconize (`obsidian-icon-folder`)

Versione vault: **v2.14.7**. Doc: https://github.com/FlorianWoelki/obsidian-icon-folder

> ⚠️ **Upstream DEPRECATO / end-of-maintenance** (avviso nel README ufficiale, 2.14.x):
> funziona ma non riceve più aggiornamenti. Per il nostro uso (emoji-cartella scritte in
> `data.json`) resta stabile; a medio termine valutare un successore (es. *Iconic*).

> Usato da: `render.py` (blocco "Iconize") inietta un'icona-emoji per cartella di
> categoria da `plugins.yaml → folder_icons` in `data.json`.

## Cos'è
Assegna **icone a cartelle, file e link**. Nel progetto serve solo per le **icone-emoji
delle cartelle di categoria** (es. 🌍 Mondi, 🐾 Bestiario), così l'esploratore file è
leggibile a colpo d'occhio.

## Config (`plugins.yaml → folder_icons`)
Mappa **chiave-di-`core.folders` → emoji**:
```yaml
folder_icons:
  mondo: "🌍"
  creatura: "🐾"
  luogo: "🗺️"
  # … una per categoria + inbox
```
`render.py` risolve la chiave nel **percorso reale** della cartella (`core.folders[key]`)
e scrive nel `data.json` le voci **top-level `percorso: emoji`** (stile `emojiStyle`
nativo), preservando il blocco `settings`.

## ⚠️ Gotcha
- **Chiave = path della cartella**, non l'id categoria: se rinomini una cartella in
  `core.folders` senza rigirare la build, l'icona resta orfana sul vecchio path.
- Le voci icona vivono **a livello top di `data.json`** accanto a `settings` — il merge
  non deve azzerare `settings`.
- Solo categorie presenti in `core.folders` ricevono l'icona (le altre sono ignorate
  silenziosamente).
- Emoji native: nessun download di icon-pack. **Correzione:** le **icone inline** Lucide
  funzionano già senza config extra (vedi sotto) — `data.json` ha `iconsInNotesEnabled`/
  `iconsInLinksEnabled` ON e `iconIdentifier: ":"`. Per le cartelle restiamo sulle emoji
  (portabilità ZIP).

## Feature native già attive ma non sfruttate (2.14.7)
- **Icone inline nelle note**: scrivi `:NomeIcona:` (es. `:LiSwords:`) — già abilitato
  (`iconsInNotesEnabled: true`, `iconIdentifier: ":"`). Le emoji restano la scelta per la
  portabilità; le inline Lucide sono un'opzione coerente col tema per heading/callout.
- **Icona da frontmatter** (richiede `iconInFrontmatterEnabled: true`, campo
  `iconInFrontmatterFieldName: "icon"`): un campo `icon:` per-nota assegna un'icona
  individuale. Candidato: dare alle **note-cartella** Folder Notes l'icona di categoria via
  frontmatter (invece della sola emoji nel titolo).
- **Custom rules** (`rules: []`, oggi vuoto): icona per **nome file/regex**; la regola con
  input `.` = icona di default per tutto.
- **`iconInTitleEnabled`** (oggi `false`): icona grande sopra il titolo (estetica infobox).
