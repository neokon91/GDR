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
    templateFile: "z.modelli/Religione.md"
    folderPath: "Mondo/Religioni"
    open: true
```

## Culti e Divinità

```dataview
TABLE tipo, sottotipo, stato, templi, fazioni
FROM "Mondo/Religioni"
WHERE file.name != "Religioni"
SORT sottotipo ASC, nome ASC
```

## Templi Collegati

```dataview
TABLE tipo, stato, luogo_padre
FROM "Mondo/Luoghi"
WHERE tipo = "tempio"
SORT nome ASC
```
