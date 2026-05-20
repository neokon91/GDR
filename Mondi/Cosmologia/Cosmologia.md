---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Cosmologia

```dataview
TABLE mondo, tipo, regola, pericolo, divinita, creature, stato
FROM "Mondi/Cosmologia"
WHERE file.name != "Cosmologia" AND !startswith(file.name, "Prova -")
SORT mondo ASC, tipo ASC, nome ASC
```
