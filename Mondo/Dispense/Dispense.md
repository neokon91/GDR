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
    folderPath: "Mondo/Dispense"
    open: true
```

## Pronte

```dataview
TABLE tipo, stato, luogo, personaggi, sessioni
FROM "Mondo/Dispense"
WHERE stato = "pronto"
SORT nome ASC
```

## Consegnate

```dataview
TABLE tipo, luogo, personaggi, sessioni
FROM "Mondo/Dispense"
WHERE stato = "consegnato"
SORT nome ASC
```

## Archivio

```dataview
TABLE tipo, stato, luogo, personaggi
FROM "Mondo/Dispense"
WHERE file.name != "Dispense"
SORT stato ASC, nome ASC
```
