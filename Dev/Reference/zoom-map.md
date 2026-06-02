# Reference: TTRPG Tools - Maps (`zoom-map`)

Versione vault: **v2.0.2** (Jareika). Plugin id: `zoom-map` · **nome reale nel manager: «TTRPG Tools - Maps»**.
Repo/doc ufficiale: https://github.com/Jareika/zoom-map

> **Stato: installato, uso USER-DRIVEN (non cablato dalla pipeline).** Mappe interattive
> **immagine + pin** del mondo (alternativa raster a Excalidraw). La sintassi qui sotto è
> **verificata sul README ufficiale**; le opzioni avanzate (overlay/layer) vanno provate in-app.

## Cos'è
Mappe fantasy interattive a partire da un'**immagine** (mappa mondo/regione): zoom/pan,
**marker/pin** collegati alle note, **righello** (misura distanze → tempi di viaggio),
**overlay** immagine commutabili, **layer** di marker e un **render Canvas** opzionale (mobile).

## Via rapida (consigliata): comando «Insert new map…»
Non serve scrivere il blocco a mano: *Tavolozza comandi → «Insert new map…»* apre un modale
che imposta immagine e opzioni e inserisce il blocco. *«Edit view…»* (tasto destro → Options)
riapre per modifica un blocco esistente.

## Blocco `zoommap` (sintassi ufficiale)
````
```zoommap
image: Media/Mappe/Valdombra.jpg                 # RICHIESTO: immagine base nel vault
markers: Media/Mappe/Valdombra.jpg.markers.json  # opz.: default <image>.markers.json
minZoom: 0.3
maxZoom: 8
height: 560px
width: 100%
resizable: true
resizeHandle: native     # left | right | both | native
render: dom              # dom (default) | canvas (mappe grandi / mobile)
responsive: false        # true → adatta sempre, disabilita pan/zoom
storage: json            # json (file accanto all'immagine) | note (inline, usa id)
id: map-1                # id stabile se storage: note
align: right             # left | center | right
wrap: true
```
````
- **Più immagini base** commutabili da menu contestuale: `imageBases:` (es. mondo → regione).
- **Overlay immagine** commutabili (terreno/politico/strade):
  ```
  imageOverlays:
    - { path: Media/Mappe/strade.png, name: Strade, visible: true }
  ```

## Importare mappe da Azgaar / Watabou
zoommap consuma un'**immagine** (PNG/WebP/JPG; l'SVG è gestito e il plugin lo esporta in WebP a
2k/4k/8k/12k). Quindi l'import dell'immagine è **diretto**; i **pin NON si importano** (si piazzano a mano).
- **Azgaar's Fantasy Map Generator** → *Export* **SVG** (mappa intera, consigliato per i mondi) o **PNG**
  (⚠️ solo la porzione visibile) o **tiles** (.zip di chunk PNG per immagini enormi). Drop in `Media/`,
  poi `image: Media/Mappe/mondo.svg` (o il WebP rasterizzato). `.map`/JSON/GeoJSON di Azgaar **non** sono letti.
- **Watabou** (città/villaggio/dungeon) → *Export* **PNG hi-res** o **SVG**. Stesso flusso.
- I marker si aggiungono a mano (Shift+clic) e si collegano ai `[[Luogo]]`. *(L'auto-pin dai dati Azgaar
  esiste solo via plugin Leaflet/GeoJSON — non scelto in questo vault.)* Un convertitore
  Azgaar-JSON→`<image>.markers.json` sarebbe scrivibile ma è tooling custom (schema marker di nicchia).

## Pin che linkano alle note (il cuore worldbuilding)
- Aggiungi un marker: **Shift+clic** sulla mappa, oppure **tasto destro → «Add marker here»**.
- Tasto destro su un marker → modifica/elimina.
- **Un marker con un link `[[Nota]]` mostra l'hover-preview nativo di Obsidian** → atlante
  navigabile: il pin sulla mappa ↔ la nota `luogo` collegata, coerente con le relazioni tipizzate.

## Righello: distanze → tempi di viaggio
Misura multi-segmento cliccando punti; **calibra la scala per ciascuna immagine base**; unità
metrico/imperiale (m/km/mi/ft) o **custom**; **preset di tempo di viaggio** (distanza → tempo).
Config in *Impostazioni → Ruler*.

## Storage dei marker
- `storage: json` (default): file `<image>.markers.json` **accanto all'immagine** (contiene
  bases, overlays, activeBase, layers, markers, measurement, pinSizeOverrides, draw/text layers).
- `storage: note` + `id:`: dati inline nel codeblock.

## Aggancio nel vault (oggi)
- Il campo **`mappa`** (luogo/mondo) embedda disegno/immagine/nota via `renderMap`. Per una mappa
  **interattiva con pin** si incolla un blocco `zoommap` (o si usa «Insert new map…»).
- Gli **asset immagine** vivono in **`Media/`** (cartella allegati); il `.markers.json` accanto.

## Aggancio futuro possibile (roadmap #4)
Generare uno **scheletro `zoommap`** nel tab Mappa di `mondo`/`luogo` da un'immagine caricata, e
derivare i pin dalle relazioni tipizzate (`luogo.regione`/`controllata_da`) → atlante coerente.
*Non* automatizzato finché non confermato in-app (schema marker di nicchia).

## ⚠️ Gotcha
- Dipende da un'**immagine sorgente** nel vault (asset binario) → tienila in `Media/`.
- Per **mappe grandi/SVG o su mobile** preferisci `render: canvas` (in DOM può scattare).
- Plugin di nicchia: lo schema avanzato (overlay/layer/collections) **non è garantito stabile** →
  verifica in-app prima di automatizzarlo. Senza il plugin il blocco non rende.
