---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Conflitti

```dataview
TABLE mondo, pressione, posta, prossima_mossa, fazioni, luoghi, stato
FROM "Mondi/Conflitti"
WHERE file.name != "Conflitti"
SORT pressione DESC, mondo ASC, nome ASC
```
