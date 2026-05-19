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
    templateFile: "z.modelli/Fazione.md"
    folderPath: "Mondo/Fazioni"
    open: true
```

## In Gioco

```dataview
TABLE tipo, stato, leader, luoghi, alleati, nemici
FROM "Mondo/Fazioni"
WHERE file.name != "Fazioni" AND stato != "archiviata"
SORT stato ASC, nome ASC
```

## Conflitti

```dataview
TABLE leader, alleati, nemici
FROM "Mondo/Fazioni"
WHERE length(nemici) > 0
SORT nome ASC
```
