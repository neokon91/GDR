---
cssclasses:
  - indice
---

# Dispense

```meta-bind-button
label: Nuova Dispensa
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Dispensa.md"
    folderPath: "Mondi/Dispense"
    open: true
```

## Pronte

```dataview
TABLE tipo, stato, luogo, personaggi, sessioni
FROM "Mondi/Dispense"
WHERE stato = "pronto"
SORT nome ASC
```

## Consegnate

```dataview
TABLE tipo, luogo, personaggi, sessioni
FROM "Mondi/Dispense"
WHERE stato = "consegnato"
SORT nome ASC
```

## Archivio

```dataview
TABLE tipo, stato, luogo, personaggi
FROM "Mondi/Dispense"
WHERE file.name != "Dispense"
SORT stato ASC, nome ASC
```
