# ⚔️ Fazioni

*Chi muove i fili — sede, alleanze, pressione.*

> [!example] Crea
> `BUTTON[crea-fazione]`

## Tutte le voci
```dataview
table without id file.link as Nome, tipo as "Tipo", sede as "Sede", pressione as "Pressione"
from ""
where categoria = "fazione" and stato != "archiviata"
sort pressione desc
```

## 🔥 Fronti caldi
```dataview
table without id file.link as Nome, pressione as Pressione, prossima_mossa as "Prossima mossa"
from ""
where categoria = "fazione" and pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 8
```

## Bozze da rifinire
```dataview
list
from ""
where categoria = "fazione" and stato = "bozza"
sort file.mtime desc
```
