---
cssclasses:
  - indice
categoria: risorsa
tipo: compendium
stato: pronto
---

# Compendium

`BUTTON[nuovo-elemento-z-modelli-worldbuilding-compendium-del-mondo-md]`

```dataview
TABLE tipo, mondo, culture, regioni, risorse, fazioni, uso_narrativo, missioni
FROM "Mondi/Compendium"
WHERE file.name != "Compendium" AND stato != "archiviata"
SORT tipo ASC, file.name ASC
```
