---
cssclasses:
  - indice
---

# Luoghi

`BUTTON[nuovo-luogo-z-modelli-luogo-router-md]`

## Luoghi Attivi

```dataview
TABLE tipo, stato, bioma, pericolo, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata"
SORT stato ASC, nome ASC
```

## Luoghi Pericolosi

```dataview
TABLE tipo, stato, pericolo, luogo_padre
FROM "Mondi/Luoghi"
WHERE pericolo >= 6 AND stato != "archiviata"
SORT pericolo DESC
```

## Gerarchia

```dataview
TABLE tipo, stato, luogo_padre
FROM "Mondi/Luoghi"
WHERE file.name != "Luoghi" AND stato != "archiviata"
SORT luogo_padre ASC, nome ASC
```

## Territori Politici

```dataview
TABLE tipo, stato, stabilita, pressione, capitale, governante, relazioni, risorse_strategiche
FROM "Mondi/Luoghi"
WHERE contains(list("regno", "impero", "repubblica", "oligarchia", "ducato", "contea", "baronia", "marca", "protettorato"), tipo) AND stato != "archiviata"
SORT pressione DESC, nome ASC
```
