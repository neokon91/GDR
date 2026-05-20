---
cssclasses:
  - indice
categoria: risorsa
tipo: indice rotte
stato: pronto
---

# Rotte

```meta-bind-button
label: Nuova Rotta
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Rotta.md"
    folderPath: "Mondi/Rotte"
    open: true
```

```dataview
TABLE stato_rotta, partenza, arrivo, regioni, fazioni_controllanti, risorse_trasportate, pressione, prossima_mossa
FROM "Mondi/Rotte"
WHERE file.name != "Rotte" AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT stato_rotta ASC, pressione DESC, file.name ASC
```
