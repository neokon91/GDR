---
cssclasses:
  - indice
---

# Missioni

```meta-bind-button
label: Nuova Missione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Missione.md"
    folderPath: "Mondi/Missioni"
    open: true
```

## Aperte

```dataview
TABLE stato, committente, luoghi, personaggi, ricompense
FROM "Mondi/Missioni"
WHERE stato = "proposta" OR stato = "accettata" OR stato = "in corso"
SORT stato ASC, nome ASC
```

## Concluse

```dataview
TABLE stato, committente, luoghi, ricompense
FROM "Mondi/Missioni"
WHERE stato = "completata" OR stato = "fallita"
SORT nome ASC
```

## Archivio

```dataview
TABLE stato, committente, luoghi, ricompense
FROM "Mondi/Missioni"
WHERE file.name != "Missioni"
SORT stato ASC, nome ASC
```
