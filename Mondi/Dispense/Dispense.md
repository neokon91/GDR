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
WHERE stato = "pronto" AND !startswith(file.name, "Prova -")
SORT nome ASC
```

## Consegnate

```dataview
TABLE tipo, luogo, personaggi, sessioni
FROM "Mondi/Dispense"
WHERE stato = "consegnato" AND !startswith(file.name, "Prova -")
SORT nome ASC
```

## Archivio

```dataview
TABLE tipo, stato, luogo, personaggi
FROM "Mondi/Dispense"
WHERE file.name != "Dispense" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
```
