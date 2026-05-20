---
cssclasses:
  - indice
---

# Timeline

```meta-bind-button
label: Nuovo Evento Storico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Evento Storico.md"
    folderPath: "Mondi/Timeline"
    open: true
```

## Eventi Canonici

```dataview
TABLE data_mondo, stato_canonico, mondo, luoghi, fazioni, sessioni
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico = "canonico" AND !startswith(file.name, "Prova -")
SORT data_mondo ASC, file.name ASC
```

## Rumor, Leggende E Segreti

```dataview
TABLE data_mondo, stato_canonico, mondo, luoghi, fazioni
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "canonico" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -")
SORT data_mondo ASC, file.name ASC
```

## Eventi Da Sessione

```dataview
TABLE stato, stato_canonico, sessioni, collegamenti, impatto
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
LIMIT 20
```
