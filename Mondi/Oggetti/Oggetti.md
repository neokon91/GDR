---
cssclasses:
  - indice
---

# Oggetti

`BUTTON[nuovo-oggetto-z-modelli-oggetto-md]`

`BUTTON[nuovo-oggetto-magico-z-modelli-oggetto-magico-md]`

## Da Assegnare

```dataview
TABLE tipo, rarita, stato, luogo
FROM "Mondi/Oggetti"
WHERE !proprietario AND stato != "archiviata"
SORT rarita ASC, nome ASC
```

## Assegnati

```dataview
TABLE tipo, rarita, proprietario, luogo
FROM "Mondi/Oggetti"
WHERE proprietario AND stato != "archiviata"
SORT proprietario ASC, nome ASC
```

## Archivio

```dataview
TABLE tipo, rarita, stato, proprietario, luogo
FROM "Mondi/Oggetti"
WHERE file.name != "Oggetti" AND stato != "archiviata"
SORT nome ASC
```
