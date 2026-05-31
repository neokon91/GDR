# Reference: Iconize (`obsidian-icon-folder`)

Versione vault: **v2.14.7**. Doc: https://github.com/FlorianWoelki/obsidian-icon-folder

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
- Emoji native: nessun download di icon-pack. Per icone Lucide/altre servirebbe altra
  config (non usata qui).
