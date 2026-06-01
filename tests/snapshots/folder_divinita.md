# ☀️ Divinita

*Tutte le voci di questa categoria. Clicca la cartella per tornare qui.*

> [!example] Crea
> `BUTTON[crea-divinita]`

## Tutte le voci
```dataview
table without id file.link as Nome, tipo as "Tipo", mondo as "Mondo"
from ""
where categoria = "divinita" and stato != "archiviata"
sort file.name asc
```

## 🔥 Fronti caldi
```dataview
table without id file.link as Nome, pressione as Pressione, prossima_mossa as "Prossima mossa"
from ""
where categoria = "divinita" and pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 8
```

## Bozze da rifinire
```dataview
list
from ""
where categoria = "divinita" and stato = "bozza"
sort file.mtime desc
```
