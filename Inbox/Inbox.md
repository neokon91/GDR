---
cssclasses:
  - indice
---

# Inbox

Usa questa cartella per idee grezze, appunti presi al volo e materiale non ancora deciso. Quando un'idea diventa utile al tavolo, trasformala in una nota del mondo.

`BUTTON[smistamento-bozze-generate-risorse-smistamento-bozze-generate-2]`

`BUTTON[nuova-nota-rapida-z-modelli-nota-rapida-md]`

`BUTTON[nuovo-evento-lore-z-modelli-lore-capture-md]`

## Inbox Live

`BUTTON[evento-live-z-modelli-live-evento-md]`

`BUTTON[png-improvvisato-z-modelli-live-png-md]`

`BUTTON[luogo-improvvisato-z-modelli-live-luogo-md]`

`BUTTON[nota-grezza-z-modelli-live-nota-grezza-md]`

`BUTTON[conseguenza-z-modelli-live-conseguenza-md]`

## Da Smistare

```dataview
TABLE tipo, stato, stato_canonico, data_mondo, sessioni, collegamenti
FROM "Inbox"
WHERE file.name != "Inbox" AND stato != "smistata" AND stato != "archiviata" AND stato != "ignorata"
SORT file.ctime DESC
```

## Bozze Generate

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza"
SORT creato ASC, file.ctime ASC
```

## Lore Capture

```dataview
TABLE tipo, stato, stato_canonico, sessioni, collegamenti, impatto
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata"
SORT file.mtime DESC
```

## Smistate

```dataview
TABLE tipo, stato_canonico, collegamenti
FROM "Inbox"
WHERE (stato = "smistata" OR stato = "collegata" OR stato = "canonica")
SORT file.mtime DESC
```
