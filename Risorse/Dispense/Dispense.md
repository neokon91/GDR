# Dispense

```dataview
LIST
FROM "Risorse/Dispense"
WHERE file.name != "Dispense" AND !startswith(file.name, "Prova -")
SORT file.name ASC
```
