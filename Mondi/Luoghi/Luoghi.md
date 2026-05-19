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
    folderPath: "Mondi/Luoghi"
    open: true
```

## Luoghi Attivi

```dataview
TABLE tipo, stato, bioma, pericolo, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
```

## Luoghi Pericolosi

```dataview
TABLE tipo, stato, pericolo, luogo_padre
FROM "Mondi/Luoghi"
WHERE pericolo >= 6 AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT pericolo DESC
```

## Gerarchia

```dataview
TABLE tipo, stato, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT luogo_padre ASC, nome ASC
```
