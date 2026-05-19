---
cssclasses:
  - indice
---

# Incontri

```meta-bind-button
label: Nuovo Incontro
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Incontro.md"
    folderPath: "Mondo/Incontri"
    open: true
```

## Pronti

```dataview
TABLE stato, luogo, pericolo, creature, personaggi
FROM "Mondo/Incontri"
WHERE stato = "pronto" OR stato = "in gioco"
SORT pericolo DESC, nome ASC
```

## Da Preparare

```dataview
TABLE luogo, pericolo, creature
FROM "Mondo/Incontri"
WHERE stato = "bozza"
SORT pericolo DESC, nome ASC
```

## Archivio

```dataview
TABLE stato, luogo, pericolo, creature
FROM "Mondo/Incontri"
WHERE file.name != "Incontri"
SORT stato ASC, pericolo DESC
```
