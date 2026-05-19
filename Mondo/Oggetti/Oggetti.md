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
    folderPath: "Mondo/Oggetti"
    open: true
```

```meta-bind-button
label: Nuovo Oggetto Magico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Oggetto Magico.md"
    folderPath: "Mondo/Oggetti"
    open: true
```

## Da Assegnare

```dataview
TABLE tipo, rarita, stato, luogo
FROM "Mondo/Oggetti"
WHERE !proprietario AND stato != "archiviata"
SORT rarita ASC, nome ASC
```

## Assegnati

```dataview
TABLE tipo, rarita, proprietario, luogo
FROM "Mondo/Oggetti"
WHERE proprietario
SORT proprietario ASC, nome ASC
```

## Archivio

```dataview
TABLE tipo, rarita, stato, proprietario, luogo
FROM "Mondo/Oggetti"
WHERE file.name != "Oggetti"
SORT nome ASC
```
