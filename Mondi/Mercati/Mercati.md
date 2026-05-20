---
cssclasses:
  - indice
categoria: risorsa
tipo: indice mercati
stato: pronto
---

# Mercati

```meta-bind-button
label: Nuovo Mercato O Nodo
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Mercato o Nodo Commerciale.md"
    folderPath: "Mondi/Mercati"
    open: true
```

```dataview
TABLE luogo, fazioni_controllanti, risorse, rotte, pedaggi, rischi, pressione, prossima_mossa
FROM "Mondi/Mercati"
WHERE file.name != "Mercati" AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT pressione DESC, file.name ASC
```
