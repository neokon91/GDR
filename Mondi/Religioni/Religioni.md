---
cssclasses:
  - indice
---

# Religioni

```meta-bind-button
label: Nuova Religione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/fazione/Culto.md"
    folderPath: "Mondi/Religioni"
    open: true
```

## Culti e Divinità

```dataview
TABLE tipo, sottotipo, stato, templi, fazioni
FROM "Mondi/Religioni"
WHERE file.name != "Religioni" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT sottotipo ASC, nome ASC
```

## Templi Collegati

```dataview
TABLE tipo, stato, luogo_padre
FROM "Mondi/Luoghi"
WHERE tipo = "tempio" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT nome ASC
```
