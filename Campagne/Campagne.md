---
cssclasses:
  - indice
---

# Campagne

```meta-bind-button
label: Nuova Campagna
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Campagna.md"
    folderPath: "Campagne"
    open: true
```

```meta-bind-button
label: Nuova Sessione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Sessione.md"
    folderPath: "Mondi/Sessioni"
    open: true
```

## Campagne Attive

```dataview
TABLE stato, tono, livello_attuale, personaggi, luoghi
FROM "Campagne"
WHERE file.name != "Campagne" AND stato != "archiviata" AND stato != "conclusa" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
```

## Prossime Sessioni

```dataview
TABLE data, data_mondo, stato, campagne, luoghi
FROM "Mondi/Sessioni"
WHERE (stato = "preparazione" OR stato = "pronto") AND !startswith(file.name, "Prova -")
SORT data ASC
LIMIT 8
```

## Sessioni Giocate

```dataview
TABLE data, data_mondo, campagne
FROM "Mondi/Sessioni"
WHERE stato = "giocata" AND !startswith(file.name, "Prova -")
SORT data DESC
LIMIT 10
```

## Archivio Campagne

```dataview
TABLE stato, tono, livello_attuale
FROM "Campagne"
WHERE file.name != "Campagne" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT nome ASC
```
