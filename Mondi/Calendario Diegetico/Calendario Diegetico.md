---
cssclasses:
  - indice
categoria: risorsa
tipo: calendario diegetico
stato: pronto
---

# Calendario Diegetico

```meta-bind-button
label: Nuova Ricorrenza
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Ricorrenza Calendario.md"
    folderPath: "Mondi/Calendario Diegetico"
    open: true
```

```dataview
TABLE data_mondo, mese, stagione, festa, culture, religioni, luoghi, pressione, prossima_mossa
FROM "Mondi/Calendario Diegetico"
WHERE file.name != "Calendario Diegetico" AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT mese ASC, data_mondo ASC, file.name ASC
```
