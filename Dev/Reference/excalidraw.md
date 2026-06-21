# Reference: Excalidraw (`obsidian-excalidraw-plugin`)

Versione vault: **v2.24.2** (Zsolt Viczian). Doc: https://excalidraw-obsidian.online
Repo/wiki: https://github.com/zsviczian/obsidian-excalidraw-plugin/wiki

> **Stato: installato, uso USER-DRIVEN (non cablato).** Mappe/diagrammi disegnati a mano
> (alternativa "freeform" a Zoom Map). La sintassi qui sotto è **verificata sul README ufficiale**.

## Cos'è
Editor di disegni vettoriali dentro Obsidian. Ogni disegno è una nota `*.excalidraw.md`
(frontmatter + scena JSON). Dalla v1.2 i disegni sono **note Markdown** (compaiono nel grafo).
Utile per **mappe regionali, dungeon, schemi di relazioni**.

## Creare ed embeddare (con dimensione)
- *«Create new drawing»* (ribbon o CTRL/CMD-clic nell'esploratore) → nota `*.excalidraw.md`.
- Embed in una nota lore: `![[Mappa Regno.excalidraw]]`. **Con dimensione/allineamento**:
  - `![[Mappa.excalidraw|800]]` (larghezza) · `![[Mappa.excalidraw|800x500]]` (larghezza×altezza)
  - `![[Mappa.excalidraw|left]]` · `![[Mappa.excalidraw|right-wrap]]` (testo a capo attorno)

## Ritaglio di una regione (zoom su una parte della mappa)
Da **un solo** disegno-mappa puoi embeddare ritagli diversi (continente → regione → città):
- `![[Mappa.excalidraw#area=Valdombra]]` — ritaglia attorno a un **elemento-testo** che contiene
  `# Valdombra`. ⚠️ richiede export **SVG** (in PNG il selettore `area=` non funziona).
- `![[Mappa.excalidraw#^group=<elementID>]]` — embedda l'intero **gruppo** di quell'elemento.

## Link cliccabili e annotazione (uso mappa)
- Dentro il disegno, un elemento-testo `[[Luogo|Alias]]` è un **link cliccabile**: compare nei
  **backlink** della nota di destinazione e mostra l'**hover-preview** (CTRL/CMD+hover). I link si
  aggiornano se la nota viene rinominata → **mappa navigabile**.
- **Annotare un'immagine reale**: incolla/trascina un'immagine nel disegno e **disegna sopra**
  (confini, regioni, etichette, pin-link). È la via "raster annotato", complementare a Zoom Map.
- **Embeddare una nota Markdown come elemento** del disegno: comando *«Insert markdown file from
  vault»* (o SHIFT-drop dal file explorer). Utile per appiccicare legenda/lore sulla mappa.

## Export per handout (frontmatter del disegno)
Per condividere una mappa come immagine o tenerla sincronizzata:
- `excalidraw-export-dark: true|false` (variante scura/chiara) · `excalidraw-export-transparent`
- `excalidraw-export-pngscale: 0.5–5` (risoluzione PNG) · `excalidraw-export-padding`
- `excalidraw-autoexport: png|svg|both|none` (tiene un PNG/SVG aggiornato accanto al disegno)

## Aggancio nel vault (oggi)
Il campo **`mappa`** (luogo/mondo) embedda `![[…excalidraw]]` via `renderMap`. Dove agganciare:
mappa di continente sul **Mondo**; mappa locale sul **Luogo** *regione/insediamento*; pianta sul
**Luogo** *dungeon/struttura*. Asset/immagini in **`Media/`**.

## Aggancio futuro possibile (roadmap #4)
La trinità potrebbe predisporre un **embed placeholder** (`![[<Titolo> mappa.excalidraw]]`) nel tab
Mappa, da disegnare a mano. **Non** si genera la scena (è disegno manuale); la pipeline al più crea
lo scheletro nota.

## ⚠️ Gotcha
- Le note `*.excalidraw.md` sono **pesanti** (JSON inline) → tienile **fuori** dalle query
  Bases/Dataview di categoria (filtra per `categoria`/cartella, non per nome file).
- `#area=` richiede export **SVG**; in PNG non ritaglia.
- L'embed mostra l'immagine; per editarla apri la nota disegno.
- Render dipende dal plugin: senza, `![[…excalidraw]]` resta un link rotto.
