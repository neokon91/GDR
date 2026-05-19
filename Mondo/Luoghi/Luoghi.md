---
cssclasses:
  - indice
---

# Luoghi

```meta-bind-button
label: Nuovo Luogo
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Luogo Router.md"
    folderPath: "Mondo/Luoghi"
    open: true
```

## Luoghi Attivi

```dataview
TABLE tipo, stato, bioma, pericolo, luogo_padre
FROM "Mondo/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata"
SORT stato ASC, nome ASC
```

## Luoghi Pericolosi

```dataview
TABLE tipo, stato, pericolo, luogo_padre
FROM "Mondo/Luoghi"
WHERE pericolo >= 6
SORT pericolo DESC
```

## Gerarchia

```dataview
TABLE tipo, stato, luogo_padre
FROM "Mondo/Luoghi"
WHERE file.name != "Luoghi"
SORT luogo_padre ASC, nome ASC
```
