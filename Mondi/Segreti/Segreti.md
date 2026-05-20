---
cssclasses:
  - indice
categoria: risorsa
tipo: indice segreti
stato: pronto
---

# Segreti

`BUTTON[nuovo-segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`

```dataview
TABLE mondo, tipo, stato, verita_profonda, indizi_deboli, indizi_forti, prove_decisive
FROM "Mondi/Segreti"
WHERE file.name != "Segreti" AND stato != "archiviata"
SORT file.mtime DESC
```
