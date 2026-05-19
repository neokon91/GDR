# Video

```dataview
LIST
FROM "Risorse/Video"
WHERE file.name != "Video" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```
