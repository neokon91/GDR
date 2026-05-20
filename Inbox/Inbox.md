---
cssclasses:
  - indice
---

# Inbox

Usa questa cartella per idee grezze, appunti presi al volo e materiale non ancora deciso. Quando un'idea diventa utile al tavolo, trasformala in una nota del mondo.

```meta-bind-button
label: Smistamento Bozze Generate
style: primary
actions:
  - type: open
    link: "[[Risorse/Smistamento Bozze Generate]]"
```

```meta-bind-button
label: Nuova Nota Rapida
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Nota Rapida.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Nuovo Evento / Lore
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Lore Capture.md"
    folderPath: "Inbox"
    open: true
```

## Inbox Live

```meta-bind-button
label: Evento Live
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Evento.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: PNG Improvvisato
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live PNG.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Luogo Improvvisato
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Luogo.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Nota Grezza
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Nota Grezza.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Conseguenza
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Conseguenza.md"
    folderPath: "Inbox"
    open: true
```

## Da Smistare

```dataview
TABLE tipo, stato, stato_canonico, data_mondo, sessioni, collegamenti
FROM "Inbox"
WHERE file.name != "Inbox" AND stato != "smistata" AND stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -")
SORT file.ctime DESC
```

## Bozze Generate

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza" AND !startswith(file.name, "Prova -")
SORT creato ASC, file.ctime ASC
```

## Lore Capture

```dataview
TABLE tipo, stato, stato_canonico, sessioni, collegamenti, impatto
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
```

## Smistate

```dataview
TABLE tipo, stato_canonico, collegamenti
FROM "Inbox"
WHERE (stato = "smistata" OR stato = "collegata" OR stato = "canonica") AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
```
