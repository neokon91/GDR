---
cssclasses:
  - indice
---

# Inbox

Usa questa cartella per idee grezze, appunti presi al volo e materiale non ancora deciso. Quando un'idea diventa utile al tavolo, trasformala in una nota del mondo.

```meta-bind-button
label: Nuova Nota Rapida
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Nota Rapida.md"
    folderPath: "Inbox"
    open: true
```

## Da Smistare

```dataview
TABLE tipo, stato, collegamenti
FROM "Inbox"
WHERE file.name != "Inbox" AND stato != "smistata" AND stato != "archiviata"
SORT file.ctime DESC
```

## Smistate

```dataview
TABLE tipo, collegamenti
FROM "Inbox"
WHERE stato = "smistata"
SORT file.mtime DESC
```
