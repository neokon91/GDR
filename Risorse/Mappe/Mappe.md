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

```meta-bind-button
label: Nuova Mappa Fronti
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/mappe/Mappa Excalidraw Fronti.excalidraw.md"
    folderPath: "Risorse/Mappe"
    open: true
```

![[Schema Relazioni GDR.excalidraw]]

![[Demo - Fronte Custodi.excalidraw]]

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

Apri [[Demo - Mappa Zoomabile]] come prova pronta con blocco `zoommap` e base SVG locale. La versione condivisibile e [[Demo - Mappa Zoomabile Giocatori]].

```meta-bind-button
label: Nuova Mappa Zoom
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/mappe/Mappa Zoom.md"
    folderPath: "Risorse/Mappe"
    open: true
```

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

![[Demo - Scena Ponte.excalidraw]]

Campi consigliati nelle note mappa:

- `uso: dungeon`
- `luogo`
- `incontri`
- `stato`

```dataview
TABLE luogo, incontri, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE (uso = "dungeon" OR uso = "scena") AND !startswith(file.name, "Prova -")
SORT luogo ASC, file.name ASC
```

tab: Fronti

## Fronti E Fazioni

> [!missione] Convenzione
> Usa una mappa di fronte quando devi vedere fazioni, PNG, obiettivi, segreti e pressioni in movimento.

![[Demo - Fronte Custodi.excalidraw]]

Apri anche [[Demo - Canvas Fronti.canvas]] quando vuoi una rete strutturale di note, gruppi e connessioni apribili.

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

tab: Canvas

## Canvas Di Regia

> [!luogo] Quando usarli
> Usa Canvas per mappe fatte di note vere: campagna, mondo, fazioni, PNG, luoghi, missioni, clock e incontri.

Apri [[Demo - Canvas Fronti.canvas]] come prova pronta del fronte dei Custodi.

Regola di prodotto:

- Canvas per reti strutturali e durevoli;
- Excalidraw per disegno libero, annotazioni, mappe di scena e indizi mobili;
- ogni nodo importante deve puntare a una nota canonica.

```dataview
TABLE file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE contains(file.name, "Canvas") AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
```

tab: Indizi

## Reti Di Indizi

> [!indizio] Convenzione
> Usa una mappa Excalidraw di indizi quando un mistero deve mostrare piste, fonti, verita nascoste e falsi collegamenti senza trasformarsi in una tabella.

![[Demo - Rete Indizi Reliquia.excalidraw]]

Campi consigliati nelle note mappa:

- `uso: indizi`
- `mondo`
- `luogo`
- `missioni`
- `stato`

```dataview
TABLE mondo, luogo, missioni, stato, file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE uso = "indizi" AND !startswith(file.name, "Prova -")
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
WHERE (mappa OR coordinate OR layer_mappa OR tipo_mappa) AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT layer_mappa ASC, tipo ASC, file.name ASC
LIMIT 40
```

### Politica

```dataview
TABLE tipo, governante, fazioni, confini, mappa, coordinate
FROM "Mondi/Luoghi"
WHERE (layer_mappa = "politica" OR tipo_mappa = "politica" OR governante OR confini) AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT mondo ASC, file.name ASC
LIMIT 20
```

### Commerciale

```dataview
TABLE tipo, stato_rotta, partenza, arrivo, luogo, risorse, fazioni_controllanti, mappa, coordinate
FROM "Mondi/Rotte" OR "Mondi/Risorse" OR "Mondi/Mercati"
WHERE !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT pressione DESC, file.name ASC
LIMIT 24
```

### Religiosa

```dataview
TABLE tipo, luoghi, luoghi_sacri, religioni, mappa, coordinate
FROM "Mondi/Religioni" OR "Mondi/Luoghi" OR "Mondi/Calendario Diegetico"
WHERE (religioni OR luoghi_sacri OR tipo = "ricorrenza" OR layer_mappa = "religiosa") AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT mondo ASC, file.name ASC
LIMIT 24
```

### Conflitti

```dataview
TABLE tipo, pressione, luoghi, fazioni, conflitti, mappa, coordinate
FROM "Mondi/Conflitti" OR "Mondi/Rotte" OR "Mondi/Missioni"
WHERE (pressione > 0 OR conflitti OR layer_mappa = "conflitti") AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT pressione DESC, file.name ASC
LIMIT 24
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
