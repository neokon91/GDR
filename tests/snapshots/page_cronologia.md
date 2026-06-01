# 📜 Cronologia

*Gli eventi del mondo in ordine di tempo.*

> [!example] Crea
> `BUTTON[crea-evento]`

## 🕰 Linea del tempo
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTimeline");
```

## Tutte le voci
```dataview
table without id file.link as Nome, quando as "Quando", mondo as "Mondo"
from ""
where categoria = "evento" and stato != "archiviata"
sort quando asc
```

## 🔥 Fronti caldi
```dataview
table without id file.link as Nome, pressione as Pressione, prossima_mossa as "Prossima mossa"
from ""
where categoria = "evento" and pressione >= 5 and stato != "archiviata"
sort pressione desc
limit 8
```

## Bozze da rifinire
```dataview
list
from ""
where categoria = "evento" and stato = "bozza"
sort file.mtime desc
```
