---
cssclasses:
  - indice
---

# Religioni

`BUTTON[nuova-religione-z-modelli-fazione-culto-md]`

## Culti e Divinità

```dataview
TABLE tipo, sottotipo, stato, templi, fazioni
FROM "Mondi/Religioni"
WHERE file.name != "Religioni" AND stato != "archiviata"
SORT sottotipo ASC, nome ASC
```

## Templi Collegati

```dataview
TABLE tipo, stato, luogo_padre
FROM "Mondi/Luoghi"
WHERE tipo = "tempio" AND stato != "archiviata"
SORT nome ASC
```
