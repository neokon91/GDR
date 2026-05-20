---
cssclasses:
  - indice
---

# Personaggi

`BUTTON[nuovo-pg-z-modelli-personaggio-pg-md]`

`BUTTON[nuovo-png-z-modelli-personaggio-png-md]`

## PG

```dataview
TABLE giocatore, classe, livello, stato, luogo
FROM "Mondi/Personaggi"
WHERE tipo = "pg" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT nome ASC
```

## PNG In Gioco

```dataview
TABLE ruolo, luogo, atteggiamento, fazioni
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND stato = "in gioco" AND !startswith(file.name, "Prova -")
SORT nome ASC
```

## Tutti I PNG

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
```
