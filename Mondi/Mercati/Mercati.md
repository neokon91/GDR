---
cssclasses:
  - indice
categoria: risorsa
tipo: indice mercati
stato: pronto
---

# Mercati

`BUTTON[nuovo-mercato-o-nodo-z-modelli-worldbuilding-mercato-o-nodo-commerciale-md]`

```dataview
TABLE luogo, fazioni_controllanti, risorse, rotte, pedaggi, rischi, pressione, prossima_mossa
FROM "Mondi/Mercati"
WHERE file.name != "Mercati" AND stato != "archiviata"
SORT pressione DESC, file.name ASC
```
