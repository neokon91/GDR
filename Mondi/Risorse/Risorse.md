---
cssclasses:
  - indice
categoria: risorsa
tipo: indice risorse
stato: pronto
---

# Risorse

`BUTTON[nuova-risorsa-z-modelli-worldbuilding-risorsa-md]`

```dataview
TABLE luoghi, fazioni_controllanti, uso_narrativo, scarsita, rotte, mercati, pressione, prossima_mossa
FROM "Mondi/Risorse"
WHERE file.name != "Risorse" AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT pressione DESC, file.name ASC
```
