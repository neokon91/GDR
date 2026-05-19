---
cssclasses:
  - indice
---

# Creature

```meta-bind-button
label: Nuova Creatura
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Creatura.md"
    folderPath: "Mondo/Creature"
    open: true
```

## Pronte

```dataview
TABLE tipo, stato, size AS taglia, cr, luoghi
FROM "Mondo/Creature"
WHERE file.name != "Creature" AND stato != "archiviata"
SORT cr ASC, nome ASC
```

## Per Luogo

```dataview
TABLE tipo, cr, luoghi
FROM "Mondo/Creature"
WHERE file.name != "Creature"
SORT luoghi ASC, cr ASC
```
