---
cssclasses:
  - indice
---

# Fazioni

`BUTTON[nuova-fazione-z-modelli-fazione-router-md]`

## In Gioco

```dataview
TABLE tipo, stato, leader, luoghi, personaggi
FROM "Mondi/Fazioni"
WHERE file.name != "Fazioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
```

## Conflitti

```dataview
TABLE leader, personaggi, luoghi
FROM "Mondi/Fazioni"
WHERE length(personaggi) > 0 AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT nome ASC
```
