---
cssclasses:
  - dashboard
  - gdr-player-view
categoria: risorsa
tipo: portale giocatori
stato: pronto
pubblico: true
---

# Vista Giocatori

> [!lettura] Portale condivisibile
> Mostra solo materiale emerso al tavolo o marcato `pubblico: true`. I link diretti compaiono solo quando la nota non contiene campi DM evidenti.

## Recap

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPlayerRecap(dv);
```

## Mappa

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPlayerMap(dv);
```

## Mondo Conosciuto

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPlayerView(dv);
```

## Diario Pubblico

```dataview
TABLE data, data_mondo, luoghi, missioni
FROM "Mondi/Sessioni"
WHERE (pubblico = true OR stato = "giocata")
SORT data DESC
LIMIT 8
```

## Controllo Sicurezza

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPublicSafety(dv);
```
