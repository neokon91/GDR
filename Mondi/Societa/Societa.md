---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Societa

Strutture sociali del Codex: ceti, casate, istituzioni, leggi, scuole, burocrazie, movimenti e organizzazioni non economiche.

`BUTTON[wizard-nuova-entita-viva]`

## Da Collegare

```dataview
TABLE tipo, stato, mondo, gancio, connessioni
FROM "Mondi/Societa"
WHERE file.name != "Societa" AND stato != "archiviata"
SORT mondo ASC, file.name ASC
```

## Buchi Utili

```dataview
TABLE tipo, mondo, gancio, uso_al_tavolo
FROM "Mondi/Societa"
WHERE file.name != "Societa" AND stato != "archiviata" AND (!connessioni OR length(connessioni) < 2)
SORT file.name ASC
```
