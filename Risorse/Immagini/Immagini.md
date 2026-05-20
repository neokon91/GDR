---
cssclasses:
  - indice
categoria: risorsa
tipo: immagini
stato: pronto
---

# Immagini

Usa campi semplici nelle note immagine quando servono: `uso`, `tono`, `campagna`, `luogo`, `stato`.

```dataview
TABLE uso, tono, campagna, luogo, stato
FROM "Risorse/Immagini"
WHERE file.name != "Immagini"
SORT uso ASC, tono ASC, file.name ASC
```
