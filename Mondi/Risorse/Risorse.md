---
cssclasses:
  - indice
categoria: risorsa
tipo: indice risorse
stato: pronto
---

# Risorse

```meta-bind-button
label: Nuova Risorsa
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Risorsa.md"
    folderPath: "Mondi/Risorse"
    open: true
```

```dataview
TABLE luoghi, fazioni_controllanti, uso_narrativo, scarsita, rotte, mercati, pressione, prossima_mossa
FROM "Mondi/Risorse"
WHERE file.name != "Risorse" AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT pressione DESC, file.name ASC
```
