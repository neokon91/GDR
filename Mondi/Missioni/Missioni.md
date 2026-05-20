---
cssclasses:
  - indice
---

# Missioni

`BUTTON[nuova-missione-z-modelli-dm-missione-md]`

## Aperte

```dataview
TABLE stato, committente, luoghi, personaggi, ricompense
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso")
SORT stato ASC, nome ASC
```

## Concluse

```dataview
TABLE stato, committente, luoghi, ricompense
FROM "Mondi/Missioni"
WHERE (stato = "completata" OR stato = "fallita")
SORT nome ASC
```

## Archivio

```dataview
TABLE stato, committente, luoghi, ricompense
FROM "Mondi/Missioni"
WHERE file.name != "Missioni" AND stato != "archiviata"
SORT stato ASC, nome ASC
```
