---
cssclasses:
  - indice
---

# Fazioni

```meta-bind-button
label: Nuova Fazione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Fazione Router.md"
    folderPath: "Mondi/Fazioni"
    open: true
```

## In Gioco

```dataview
TABLE tipo, stato, leader, luoghi, alleati, nemici
FROM "Mondi/Fazioni"
WHERE file.name != "Fazioni" AND stato != "archiviata"
SORT stato ASC, nome ASC
```

## Conflitti

```dataview
TABLE leader, alleati, nemici
FROM "Mondi/Fazioni"
WHERE length(nemici) > 0
SORT nome ASC
```
