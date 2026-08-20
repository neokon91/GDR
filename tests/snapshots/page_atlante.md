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
![[Atlante.base]]
