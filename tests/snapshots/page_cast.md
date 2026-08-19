# 🎭 Cast

*PG e PNG, con affiliazione e base.*

> [!example] Crea
> `BUTTON[crea-pg]`
> `BUTTON[crea-png]`

## Tutte le voci
![[Cast.base]]

## 🔥 Fronti caldi
```dataview
table without id file.link as Nome, pressione as Pressione, prossima_mossa as "Prossima mossa"
from ""
where categoria = "personaggio" and pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 8
```

## Bozze da rifinire
```dataview
list
from ""
where categoria = "personaggio" and stato = "bozza"
sort file.mtime desc
```
