---
cssclasses:
  - indice
categoria: risorsa
tipo: indice
stato: pronto
---

# Tracciati

Clock e progress track usati per fronti, missioni, rituali, minacce e viaggi. Sono note Markdown autonome: funzionano con Dataview e Meta Bind, senza Iron Vault.

`BUTTON[come-usare-i-clock-risorse-come-usare-i-clock]`

`BUTTON[nuovo-clock-o-tracciato-z-modelli-dm-tracciato-md]`

## Attivi

```dataview
TABLE tipo, progress_value, progress_max, pressione, innesco, prossima_mossa, missioni, fazioni
FROM "Mondi/Tracciati"
WHERE file.name != "Tracciati" AND stato != "archiviata" AND stato != "completato" AND stato != "fallito"
SORT pressione DESC, progress_value DESC, file.name ASC
```

## Vicini A Scattare

```dataview
TABLE tipo, progress_value, progress_max, posta, prossima_mossa
FROM "Mondi/Tracciati"
WHERE file.name != "Tracciati" AND stato = "attivo" AND progress_max > 0 AND progress_value >= progress_max - 2
SORT progress_value DESC, pressione DESC
```

## Archiviati

```dataview
TABLE tipo, stato, conseguenze, missioni, fazioni
FROM "Mondi/Tracciati"
WHERE file.name != "Tracciati" AND (stato = "archiviata" OR stato = "completato" OR stato = "fallito")
SORT file.mtime DESC
```
