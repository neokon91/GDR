---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Tracciati

Clock e progress track usati per fronti, missioni, rituali, minacce e viaggi. Sono note Markdown autonome: funzionano con Dataview e Meta Bind, senza Iron Vault.

```meta-bind-button
label: Nuovo Clock O Tracciato
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Tracciato.md"
    folderPath: "Mondi/Tracciati"
    open: true
```

## Attivi

```dataview
TABLE tipo, progress_value, progress_max, pressione, innesco, prossima_mossa, missioni, fazioni
FROM "Mondi/Tracciati"
WHERE file.name != "Tracciati" AND stato != "archiviata" AND stato != "completato" AND stato != "fallito" AND !startswith(file.name, "Prova -")
SORT pressione DESC, progress_value DESC, file.name ASC
```

## Vicini A Scattare

```dataview
TABLE tipo, progress_value, progress_max, posta, prossima_mossa
FROM "Mondi/Tracciati"
WHERE file.name != "Tracciati" AND stato = "attivo" AND progress_max > 0 AND progress_value >= progress_max - 2 AND !startswith(file.name, "Prova -")
SORT progress_value DESC, pressione DESC
```

## Archiviati

```dataview
TABLE tipo, stato, conseguenze, missioni, fazioni
FROM "Mondi/Tracciati"
WHERE file.name != "Tracciati" AND (stato = "archiviata" OR stato = "completato" OR stato = "fallito") AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
```
