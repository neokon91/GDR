# 🐾 Bestiario

*Le creature del mondo. Apri una scheda per lo statblock 5e.*

> [!example] Crea
> `BUTTON[crea-creatura]`

## Tutte le voci
```dataview
table without id file.link as Nome, tipo as "Tipo", mondo as "Mondo", pressione as "Pressione"
from ""
where categoria = "creatura" and stato != "archiviata"
sort tipo asc
```

## 🔥 Fronti caldi
```dataview
table without id file.link as Nome, pressione as Pressione, prossima_mossa as "Prossima mossa"
from ""
where categoria = "creatura" and pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 8
```

## Bozze da rifinire
```dataview
list
from ""
where categoria = "creatura" and stato = "bozza"
sort file.mtime desc
```
