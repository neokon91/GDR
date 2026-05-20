---
cssclasses:
  - indice
---

# Campagne

`BUTTON[nuova-campagna-z-modelli-dm-campagna-md]`

`BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`

## Campagne Attive

```dataview
TABLE stato, tono, livello_attuale, personaggi, luoghi
FROM "Campagne"
WHERE file.name != "Campagne" AND stato != "archiviata" AND stato != "conclusa"
SORT stato ASC, nome ASC
```

## Prossime Sessioni

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE (stato = "preparazione" OR stato = "pronto")
SORT data ASC
LIMIT 8
```

## Sessioni Giocate

```dataview
TABLE data, data_mondo, campagne
FROM "Mondi/Sessioni"
WHERE stato = "giocata"
SORT data DESC
LIMIT 10
```

## Archivio Campagne

```dataview
TABLE stato, tono, livello_attuale
FROM "Campagne"
WHERE file.name != "Campagne" AND stato != "archiviata"
SORT nome ASC
```
