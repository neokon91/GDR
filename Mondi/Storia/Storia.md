---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Storia

```dataview
TABLE mondo, tipo, data_mondo, causa, conseguenze, stato_canonico
FROM "Mondi/Storia"
WHERE file.name != "Storia"
SORT mondo ASC, data_mondo ASC, nome ASC
```
