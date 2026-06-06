# 🗺️ Atlante

*Tutti i luoghi del mondo, dal più caldo al più quieto.*

> [!example] Crea
> `BUTTON[crea-luogo]`

## 🗺 Mappa del mondo
> [!tip] La mappa qui sotto è **navigabile** (zoom/pan, righello distanze→tempi). Piazza i segnaposto a mano e linkali alle note. La mappa si imposta dal campo **Mappa** di un **Mondo** (o continente/regione) — importala da **Azgaar/Watabou**.
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderWorldMap");
```

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
