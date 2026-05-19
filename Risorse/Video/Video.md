---
cssclasses:
  - indice
categoria: risorsa
tipo: video
stato: pronto
---

# Video

Usa campi semplici nelle note video quando servono: `uso`, `tono`, `campagna`, `stato`, `timestamp`.

```dataview
TABLE uso, tono, campagna, timestamp, stato
FROM "Risorse/Video"
WHERE file.name != "Video" AND !startswith(file.name, "Prova -")
SORT uso ASC, tono ASC, file.name ASC
```
