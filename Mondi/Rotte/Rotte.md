---
cssclasses:
  - indice
categoria: risorsa
tipo: indice rotte
stato: pronto
---

# Rotte

`BUTTON[nuova-rotta-z-modelli-worldbuilding-rotta-md]`

```dataview
TABLE stato_rotta, partenza, arrivo, regioni, fazioni_controllanti, risorse_trasportate, pressione, prossima_mossa
FROM "Mondi/Rotte"
WHERE file.name != "Rotte" AND stato != "archiviata"
SORT stato_rotta ASC, pressione DESC, file.name ASC
```
