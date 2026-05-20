---
cssclasses:
  - indice
categoria: risorsa
tipo: compendium
stato: pronto
---

# Compendium

```meta-bind-button
label: Nuovo Elemento
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Compendium Del Mondo.md"
    folderPath: "Mondi/Compendium"
    open: true
```

```dataview
TABLE tipo, mondo, culture, regioni, risorse, fazioni, uso_narrativo, missioni
FROM "Mondi/Compendium"
WHERE file.name != "Compendium" AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT tipo ASC, file.name ASC
```
