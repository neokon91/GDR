---
cssclasses:
  - indice
categoria: risorsa
tipo: indice segreti
stato: pronto
---

# Segreti

```meta-bind-button
label: Nuovo Segreto O Mistero
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/worldbuilding/Segreto o Mistero.md"
    folderPath: "Mondi/Segreti"
    open: true
```

```dataview
TABLE mondo, tipo, stato, verita_profonda, indizi_deboli, indizi_forti, prove_decisive
FROM "Mondi/Segreti"
WHERE file.name != "Segreti" AND !startswith(file.name, "Prova -") AND stato != "archiviata"
SORT file.mtime DESC
```
