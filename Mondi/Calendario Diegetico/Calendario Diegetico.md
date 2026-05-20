---
cssclasses:
  - indice
categoria: risorsa
tipo: calendario diegetico
stato: pronto
---

# Calendario Diegetico

`BUTTON[nuova-ricorrenza-z-modelli-worldbuilding-ricorrenza-calendario-md]`

```dataview
TABLE data_mondo, mese, stagione, festa, culture, religioni, luoghi, pressione, prossima_mossa
FROM "Mondi/Calendario Diegetico"
WHERE file.name != "Calendario Diegetico" AND stato != "archiviata"
SORT mese ASC, data_mondo ASC, file.name ASC
```
