---
cssclasses:
  - indice
categoria: risorsa
tipo: mappe
stato: pronto
---

# Mappe

## Scelta Rapida

| Bisogno | Plugin | Usa quando | Output minimo |
| --- | --- | --- | --- |
| Fronte, indizi, relazioni mobili | Excalidraw | Devi disegnare, annotare e spostare idee mentre prepari. | Mappa in `Risorse/Mappe` con link a note canoniche. |
| Rete stabile di note | Canvas / Advanced Canvas | Vuoi una mappa fatta di note, gruppi e connessioni durevoli. | Canvas con nodi che aprono luoghi, PNG, fazioni, missioni o clock. |
| Marker geografici editabili | Maps per Bases | Hai `coordinates`, `icon`, `color` e vuoi correggere dati in tabella. | [[z.bases/Atlante Mappe.base]] con vista mappa e fallback tabellare. |
| Mappa grande al tavolo | TTRPG Tools: Maps | Servono zoom, pin, layer, misure o una base immagine. | Nota mappa zoom con pin collegati e versione player-safe se pubblica. |
| Esplorazione a esagoni | Hex Cartographer | Distanze, regioni, viaggi e incontri dipendono dalla posizione. | Regione a esagoni collegata a luoghi, incontri, risorse e conseguenze. |

````tabs
tab: Relazioni

## Mappe Di Relazione

> [!luogo] Schema pronto
> Usa Excalidraw per relazioni tra mondo, luoghi, fazioni, PNG e missioni.

`BUTTON[nuova-mappa-fronti-z-modelli-mappe-mappa-excalidraw-fronti-excalidraw-md-2]`

![[Schema Relazioni GDR.excalidraw]]


```dataviewjs
const pages = dv.pages('"Risorse/Mappe"')
  .where(p => p.file.name !== "Mappe" && (p.uso === "relazioni" || p.uso === "fronte"));

if (pages.length) {
  dv.table(["Mappa", "Uso", "Mondo", "Aggiornato"], pages.map(p => [p.file.link, p.uso ?? "", p.mondo ?? "", p.file.mtime]));
}
```

tab: Regioni

## Regioni E Viaggi

> [!luogo] Convenzione
> Usa una mappa di regione quando serve scegliere percorsi, pericoli, confini, risorse o distanze approssimative.

Campi consigliati nelle note mappa:

- `uso: regione`
- `mondo`
- `luoghi`
- `stato`

```dataview
TABLE mondo, luoghi, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE uso = "regione"
SORT mondo ASC, file.name ASC
```

tab: Esagoni

## Esagoni E Viaggio

> [!luogo] Quando usarli
> Usa Hex Cartographer quando il viaggio, la distanza o l'esplorazione esagonale contano davvero.


Regola di prodotto:

- prima crea o importa i luoghi come note;
- poi usa la mappa esagonale come supporto visuale;
- non rendere la mappa l'unica fonte del canone.
- dopo ogni viaggio aggiorna conseguenze, missioni e luoghi visitati.

```dataview
TABLE mondo, luoghi, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE uso = "esagoni"
SORT mondo ASC, file.name ASC
```

tab: Zoom

## Mappe Zoomabili

> [!scena] Quando usarle
> Usa TTRPG Tools: Maps per mappe grandi, immagini con pin, mappe da mostrare al tavolo o riferimenti con livelli.


`BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md-2]`

Regola di prodotto:

- usa immagini o SVG come base;
- collega i pin a note reali;
- usa [[Vista Giocatori]] solo per mappe senza segreti.

```dataview
TABLE mondo, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE uso = "zoom"
SORT mondo ASC, file.name ASC
```

tab: Dungeon

## Dungeon E Scene

> [!incontro] Convenzione
> Usa una mappa di dungeon o scena quando aiuta a gestire entrate, ostacoli, linee di vista, aree pericolose e incontri.


Campi consigliati nelle note mappa:

- `uso: dungeon`
- `luogo`
- `incontri`
- `stato`

```dataview
TABLE luogo, incontri, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE (uso = "dungeon" OR uso = "scena")
SORT luogo ASC, file.name ASC
```

tab: Fronti

## Fronti E Fazioni

> [!missione] Convenzione
> Usa una mappa di fronte quando devi vedere fazioni, PNG, obiettivi, segreti e pressioni in movimento.



Campi consigliati nelle note mappa:

- `uso: fronte`
- `mondo`
- `fazioni`
- `personaggi`
- `missioni`
- `stato`

```dataview
TABLE mondo, fazioni, personaggi, missioni, stato
FROM "Risorse/Mappe"
WHERE uso = "fronte"
SORT mondo ASC, file.name ASC
```

tab: Canvas

## Canvas Di Regia

> [!luogo] Quando usarli
> Usa Canvas per mappe fatte di note vere: campagna, mondo, fazioni, PNG, luoghi, missioni, clock e incontri.


Regola di prodotto:

- Canvas per reti strutturali e durevoli;
- Excalidraw per disegno libero, annotazioni, mappe di scena e indizi mobili;
- ogni nodo importante deve puntare a una nota canonica.

```dataview
TABLE file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE contains(file.name, "Canvas")
SORT file.mtime DESC
```

tab: Indizi

## Reti Di Indizi

> [!indizio] Convenzione
> Usa una mappa Excalidraw di indizi quando un mistero deve mostrare piste, fonti, verita nascoste e falsi collegamenti senza trasformarsi in una tabella.


Campi consigliati nelle note mappa:

- `uso: indizi`
- `mondo`
- `luogo`
- `missioni`
- `stato`

```dataview
TABLE mondo, luogo, missioni, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE uso = "indizi"
SORT mondo ASC, file.name ASC
```

tab: Integrate

## Viste Integrate

> [!luogo] Layer consigliati
> Usa `layer_mappa` per distinguere viste politica, commerciale, religiosa e conflitti. I campi restano Markdown leggibili e possono essere riusati da Excalidraw, Hex Cartographer, Zoom Map o da un eventuale Leaflet.

Apri [[z.bases/Atlante Mappe.base]] per la vista Bases pronta. Il plugin community `maps` e installato: la prima vista e una mappa interattiva, la seconda resta tabellare per controllo dati.

```dataview
TABLE tipo, mappa, coordinate, layer_mappa, tipo_mappa, mondo
FROM "Mondi/Luoghi" OR "Mondi/Rotte" OR "Mondi/Risorse" OR "Mondi/Mercati" OR "Mondi/Compendium"
WHERE (mappa OR coordinate OR layer_mappa OR tipo_mappa) AND stato != "archiviata"
SORT layer_mappa ASC, tipo ASC, file.name ASC
LIMIT 40
```

### Politica

```dataview
TABLE tipo, governante, fazioni, confini, mappa, coordinate
FROM "Mondi/Luoghi"
WHERE (layer_mappa = "politica" OR tipo_mappa = "politica" OR governante OR confini) AND stato != "archiviata"
SORT mondo ASC, file.name ASC
LIMIT 20
```

### Commerciale

```dataview
TABLE tipo, stato_rotta, partenza, arrivo, luogo, risorse, fazioni_controllanti, mappa, coordinate
FROM "Mondi/Rotte" OR "Mondi/Risorse" OR "Mondi/Mercati"
WHERE stato != "archiviata"
SORT pressione DESC, file.name ASC
LIMIT 24
```

### Religiosa

```dataview
TABLE tipo, luoghi, luoghi_sacri, religioni, mappa, coordinate
FROM "Mondi/Religioni" OR "Mondi/Luoghi" OR "Mondi/Calendario Diegetico"
WHERE (religioni OR luoghi_sacri OR tipo = "ricorrenza" OR layer_mappa = "religiosa") AND stato != "archiviata"
SORT mondo ASC, file.name ASC
LIMIT 24
```

### Conflitti

```dataview
TABLE tipo, pressione, luoghi, fazioni, conflitti, mappa, coordinate
FROM "Mondi/Conflitti" OR "Mondi/Rotte" OR "Mondi/Missioni"
WHERE (pressione > 0 OR conflitti OR layer_mappa = "conflitti") AND stato != "archiviata"
SORT pressione DESC, file.name ASC
LIMIT 24
```

tab: Archivio

## Archivio

```dataview
TABLE uso, mondo, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe"
SORT uso ASC, mondo ASC, file.name ASC
```
````
