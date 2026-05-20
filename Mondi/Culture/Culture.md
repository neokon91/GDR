---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Culture

```dataview
TABLE mondo, luoghi, lingue, religioni, fazioni, stato
FROM "Mondi/Culture"
WHERE file.name != "Culture"
SORT mondo ASC, nome ASC
```
