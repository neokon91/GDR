---
cssclasses:
  - indice
---

# Incontri

`BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`

## Pronti

```dataview
TABLE stato, luogo, pericolo, creature, personaggi
FROM "Mondi/Incontri"
WHERE (stato = "pronto" OR stato = "in gioco")
SORT pericolo DESC, nome ASC
```

## Da Preparare

```dataview
TABLE luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE stato = "bozza"
SORT pericolo DESC, nome ASC
```

## Archivio

```dataview
TABLE stato, luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE file.name != "Incontri" AND stato != "archiviata"
SORT stato ASC, pericolo DESC
```
