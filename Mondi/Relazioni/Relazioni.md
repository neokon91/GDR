---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Relazioni

`BUTTON[nuova-relazione-z-modelli-worldbuilding-relazione-md]`

## Relazioni Vive

```dataview
TABLE tipo, stato, mondo, soggetti, intensita, pressione, prossima_mossa
FROM "Mondi/Relazioni"
WHERE file.name != "Relazioni" AND stato != "archiviata"
SORT pressione DESC, intensita DESC, nome ASC
```

## Relazioni Senza Conseguenze

```dataview
TABLE tipo, stato, soggetti, prossima_mossa, conseguenze
FROM "Mondi/Relazioni"
WHERE file.name != "Relazioni" AND stato != "archiviata" AND (!conseguenze OR length(conseguenze) = 0)
SORT file.mtime DESC
```
