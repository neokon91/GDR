# 📦 Risorse

*Cosa muove il mondo. Vedi la dashboard [[Economia|💰 Economia & rotte]] per produzione, dipendenze e rotte.*

> [!example] Crea
> `BUTTON[crea-risorsa]`

## Tutte le voci
```dataview
table without id file.link as Nome, tipo as "Tipo", scarsita as "Scarsità", controllata_da as "Controllata da", pressione as "Pressione"
from ""
where categoria = "risorsa" and stato != "archiviata"
sort pressione desc
```

## 🔥 Fronti caldi
```dataview
table without id file.link as Nome, pressione as Pressione, prossima_mossa as "Prossima mossa"
from ""
where categoria = "risorsa" and pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 8
```

## Bozze da rifinire
```dataview
list
from ""
where categoria = "risorsa" and stato = "bozza"
sort file.mtime desc
```
