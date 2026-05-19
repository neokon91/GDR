# Immagini

```dataview
LIST
FROM "Risorse/Immagini"
WHERE file.name != "Immagini" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```
