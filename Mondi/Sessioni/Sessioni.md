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
    templateFile: "z.modelli/dm/Sessione.md"
    folderPath: "Mondi/Sessioni"
    open: true
```

## Prossime

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE (stato = "preparazione" OR stato = "pronto") AND !startswith(file.name, "Prova -")
SORT data ASC
```

## Giocate

```dataview
TABLE data, data_mondo, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE stato = "giocata" AND !startswith(file.name, "Prova -")
SORT data DESC
```

## Archivio

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondi/Sessioni"
WHERE file.name != "Sessioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT data DESC
```
