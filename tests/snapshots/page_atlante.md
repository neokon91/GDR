# 🗺️ Atlante

*Tutti i luoghi del mondo, dal più caldo al più quieto.*

> [!example] Crea
> `BUTTON[crea-luogo]`

## Tutte le voci
```dataview
table without id file.link as Nome, tipo as "Tipo", regione as "Regione", pressione as "Pressione"
from ""
where categoria = "luogo" and stato != "archiviata"
sort pressione desc
```

## 🔥 Fronti caldi
```dataview
table without id file.link as Nome, pressione as Pressione, prossima_mossa as "Prossima mossa"
from ""
where categoria = "luogo" and pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 8
```

## Bozze da rifinire
```dataview
list
from ""
where categoria = "luogo" and stato = "bozza"
sort file.mtime desc
```
