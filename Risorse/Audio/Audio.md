---
cssclasses:
  - indice
categoria: risorsa
tipo: audio
stato: pronto
---

# Audio

Usa campi semplici nelle note audio quando servono: `uso`, `tono`, `campagna`, `scena`, `timestamp`, `stato`.

```dataview
TABLE uso, tono, campagna, scena, timestamp, stato
FROM "Risorse/Audio"
WHERE file.name != "Audio"
SORT uso ASC, tono ASC, file.name ASC
```
