---
cssclasses:
  - indice
---

# Sessioni

`BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`

## Prossime

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE (stato = "preparazione" OR stato = "pronto")
SORT data ASC
```

## Giocate

```dataview
TABLE data, data_mondo, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE stato = "giocata"
SORT data DESC
```

## Archivio

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondi/Sessioni"
WHERE file.name != "Sessioni" AND stato != "archiviata"
SORT data DESC
```
