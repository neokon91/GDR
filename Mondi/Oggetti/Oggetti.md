---
cssclasses:
  - indice
---

# Oggetti

```meta-bind-button
label: Nuovo Oggetto
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Oggetto.md"
    folderPath: "Mondi/Oggetti"
    open: true
```

```meta-bind-button
label: Nuovo Oggetto Magico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Oggetto Magico.md"
    folderPath: "Mondi/Oggetti"
    open: true
```

## Da Assegnare

```dataview
TABLE tipo, rarita, stato, luogo
FROM "Mondi/Oggetti"
WHERE !proprietario AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT rarita ASC, nome ASC
```

## Assegnati

```dataview
TABLE tipo, rarita, proprietario, luogo
FROM "Mondi/Oggetti"
WHERE proprietario AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT proprietario ASC, nome ASC
```

## Archivio

```dataview
TABLE tipo, rarita, stato, proprietario, luogo
FROM "Mondi/Oggetti"
WHERE file.name != "Oggetti" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT nome ASC
```
