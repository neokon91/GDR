---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Lingue

```dataview
TABLE mondo, culture, luoghi, origine, stato
FROM "Mondi/Lingue"
WHERE file.name != "Lingue" AND !startswith(file.name, "Prova -")
SORT mondo ASC, nome ASC
```
