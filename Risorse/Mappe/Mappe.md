---
cssclasses:
  - indice
---

# Mappe

## Mappe Di Relazione

> [!luogo] Schema pronto
> Usa Excalidraw per relazioni tra mondo, luoghi, fazioni, PNG e missioni.

![[Schema Relazioni GDR.excalidraw]]

```dataviewjs
const pages = dv.pages('"Risorse/Mappe"')
  .where(p => p.file.name !== "Mappe" && String(p.file.name).includes("Schema"));

if (pages.length) {
  dv.table(["Schema", "Aggiornato"], pages.map(p => [p.file.link, p.file.mtime]));
}
```

## Archivio

```dataview
TABLE file.mtime AS aggiornato
FROM "Risorse/Mappe"
WHERE file.name != "Mappe" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```
