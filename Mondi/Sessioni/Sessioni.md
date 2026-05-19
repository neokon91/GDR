---
cssclasses:
  - indice
---

# Sessioni

```meta-bind-button
label: Nuova Sessione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Sessione.md"
    folderPath: "Mondo/Sessioni"
    open: true
```

## Prossime

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondo/Sessioni"
WHERE stato = "preparazione" OR stato = "pronto"
SORT data ASC
```

## Giocate

```dataview
TABLE data, data_mondo, campagne, luoghi
FROM "Mondo/Sessioni"
WHERE stato = "giocata"
SORT data DESC
```

## Archivio

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondo/Sessioni"
WHERE file.name != "Sessioni"
SORT data DESC
```
