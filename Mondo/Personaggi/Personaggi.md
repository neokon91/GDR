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
    templateFile: "z.modelli/PG.md"
    folderPath: "Mondo/Personaggi"
    open: true
```

```meta-bind-button
label: Nuovo PNG
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/PNG.md"
    folderPath: "Mondo/Personaggi"
    open: true
```

## PG

```dataview
TABLE giocatore, classe, livello, stato, luogo
FROM "Mondo/Personaggi"
WHERE tipo = "pg"
SORT nome ASC
```

## PNG In Gioco

```dataview
TABLE ruolo, luogo, atteggiamento, fazioni
FROM "Mondo/Personaggi"
WHERE tipo = "png" AND stato = "in gioco"
SORT nome ASC
```

## Tutti I PNG

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondo/Personaggi"
WHERE tipo = "png"
SORT stato ASC, nome ASC
```
