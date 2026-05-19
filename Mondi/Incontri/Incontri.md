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
    templateFile: "z.modelli/dm/Incontro.md"
    folderPath: "Mondi/Incontri"
    open: true
```

## Pronti

```dataview
TABLE stato, luogo, pericolo, creature, personaggi
FROM "Mondi/Incontri"
WHERE (stato = "pronto" OR stato = "in gioco") AND !startswith(file.name, "Prova -")
SORT pericolo DESC, nome ASC
```

## Da Preparare

```dataview
TABLE luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE stato = "bozza" AND !startswith(file.name, "Prova -")
SORT pericolo DESC, nome ASC
```

## Archivio

```dataview
TABLE stato, luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE file.name != "Incontri" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, pericolo DESC
```
