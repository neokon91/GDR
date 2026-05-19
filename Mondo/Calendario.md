---
cssclasses:
  - indice
---

# Calendario

Usa questa nota con Calendarium per tenere insieme calendario reale, date del mondo, feste, scadenze narrative e continuità tra sessioni.

## Prossime Sessioni

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondo/Sessioni"
WHERE stato = "preparazione" OR stato = "pronto"
SORT data ASC
LIMIT 10
```

## Timeline Sessioni

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondo/Sessioni"
WHERE file.name != "Sessioni"
SORT data DESC
LIMIT 20
```

## Missioni Con Pressione

```dataview
TABLE stato, committente, luoghi, personaggi
FROM "Mondo/Missioni"
WHERE stato = "proposta" OR stato = "accettata" OR stato = "in corso"
SORT stato ASC, nome ASC
```

## Eventi Del Mondo

> [!timer] Scadenze e pressioni
> - [ ] 
> - [ ] 
> - [ ] 

> [!scena] Feste, ricorrenze e date note
> - 

## Cronologia Canonica

> [!indizio] Eventi confermati
> - 
