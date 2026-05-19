---
cssclasses:
  - indice
---

# Personaggi

```meta-bind-button
label: Nuovo PG
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/personaggio/PG.md"
    folderPath: "Mondi/Personaggi"
    open: true
```

```meta-bind-button
label: Nuovo PNG
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/personaggio/PNG.md"
    folderPath: "Mondi/Personaggi"
    open: true
```

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
