---
cssclasses:
  - indice
categoria: risorsa
tipo: video
stato: pronto
---

# Video

Usa campi semplici nelle note video quando servono: `uso`, `tono`, `campagna`, `scena`, `stato`, `timestamp`.

```dataview
TABLE uso, tono, campagna, scena, timestamp, stato
FROM "Risorse/Video"
WHERE file.name != "Video"
SORT uso ASC, tono ASC, file.name ASC
```
