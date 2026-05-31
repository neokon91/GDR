# Reference: Excalidraw (`obsidian-excalidraw-plugin`)

Versione vault: **v2.23.7** (Zsolt Viczian). Doc: https://excalidraw-obsidian.online
Repo/wiki: https://github.com/zsviczian/obsidian-excalidraw-plugin/wiki

> **Stato: installato, NON ancora cablato.** Candidato per **mappe/diagrammi** disegnati
> a mano (roadmap Worldbuilder #4) — alternativa "freeform" a Zoom Map.

## Cos'è
Editor di disegni vettoriali dentro Obsidian. Ogni disegno è una nota `*.excalidraw.md`
(scena JSON + testo). Utile per **mappe regionali, dungeon, schemi di relazioni** schizzati.

## Uso (a mano, per ora)
- Comando *"Create new drawing"* → genera la nota `*.excalidraw.md`.
- **Embed in una nota lore**: `![[Mappa Regno.excalidraw]]` (rende l'immagine).
- Supporta **link cliccabili** dentro il disegno verso altre note (`[[Luogo]]`) → mappa
  navigabile.

## Aggancio previsto (roadmap #4)
Una mappa per `luogo`/`mondo`: la trinità potrebbe predisporre un embed placeholder
(`![[<Titolo> mappa.excalidraw]]`) nella scheda, da disegnare a mano. **Non** si genera la
scena (è disegno manuale); la pipeline al più crea lo scheletro nota.

## ⚠️ Gotcha
- Le note `*.excalidraw.md` sono **pesanti** (JSON inline) → tenerle fuori dalle query
  Bases/Dataview di categoria (potrebbero comparire come note spurie). Filtrare per
  `categoria`/cartella, non per nome file.
- L'embed mostra l'immagine; per editarla apri la nota disegno.
- Render dipende dal plugin: senza, `![[…excalidraw]]` resta un link rotto.
