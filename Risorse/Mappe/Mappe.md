---
cssclasses:
  - indice
categoria: risorsa
tipo: mappe
stato: pronto
---

# Mappe

````tabs
tab: Relazioni

## Mappe Di Relazione

> [!luogo] Schema pronto
> Usa Excalidraw per relazioni tra mondo, luoghi, fazioni, PNG e missioni.

![[Schema Relazioni GDR.excalidraw]]

```dataviewjs
const pages = dv.pages('"Risorse/Mappe"')
  .where(p => p.file.name !== "Mappe" && String(p.file.name).includes("Schema"));

if (pages.length) {
  dv.table(["Schema", "Aggiornato"], pages.map(p => [p.file.link, p.file.mtime]));
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
WHERE uso = "regione" AND !startswith(file.name, "Prova -")
SORT mondo ASC, file.name ASC
```

tab: Esagoni

## Esagoni E Viaggio

> [!luogo] Quando usarli
> Usa Hex Cartographer quando il viaggio, la distanza o l'esplorazione esagonale contano davvero.

Apri [[Demo - Brumafonda.hexcartographer]] come prova pronta. Il file si apre nell'editor Hex Cartographer e contiene gia colori, fiume, strada, confine di pericolo e link alle note luogo.

Regola di prodotto:

- prima crea o importa i luoghi come note;
- poi usa la mappa esagonale come supporto visuale;
- non rendere la mappa l'unica fonte del canone.
- dopo ogni viaggio aggiorna conseguenze, missioni e luoghi visitati.

```dataview
TABLE mondo, luoghi, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE uso = "esagoni" AND !startswith(file.name, "Prova -")
SORT mondo ASC, file.name ASC
```

tab: Zoom

## Mappe Zoomabili

> [!scena] Quando usarle
> Usa TTRPG Tools: Maps per mappe grandi, immagini con pin, mappe da mostrare al tavolo o riferimenti con livelli.

Apri [[Demo - Mappa Zoomabile]] come prova pronta con blocco `zoommap` e base SVG locale.

Regola di prodotto:

- usa immagini o SVG come base;
- collega i pin a note reali;
- usa [[Vista Giocatori]] solo per mappe senza segreti.

```dataview
TABLE mondo, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE uso = "zoom" AND !startswith(file.name, "Prova -")
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
WHERE uso = "dungeon" AND !startswith(file.name, "Prova -")
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
WHERE uso = "fronte" AND !startswith(file.name, "Prova -")
SORT mondo ASC, file.name ASC
```

tab: Archivio

## Archivio

```dataview
TABLE uso, mondo, luogo, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -")
SORT uso ASC, mondo ASC, file.name ASC
```
````
