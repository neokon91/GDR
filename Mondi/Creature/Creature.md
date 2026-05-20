---
cssclasses:
  - indice
---

# Creature

`BUTTON[nuova-creatura-z-modelli-creatura-md]`

## Pronte

```dataview
TABLE tipo, stato, size AS taglia, cr, luoghi
FROM "Mondi/Creature"
WHERE file.name != "Creature" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT cr ASC, nome ASC
```

## Per Luogo

```dataview
TABLE tipo, cr, luoghi
FROM "Mondi/Creature"
WHERE file.name != "Creature" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT luoghi ASC, cr ASC
```
