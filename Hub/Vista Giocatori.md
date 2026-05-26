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

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
dv.header(2, "Stato Portale");
gdr.renderPlayerPortalStatus(dv);
dv.header(2, "Recap");
gdr.renderPlayerRecap(dv);
dv.header(2, "Mappa");
gdr.renderPlayerMap(dv);
dv.header(2, "Mondo Conosciuto");
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

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
dv.header(2, "Controllo Sicurezza");
gdr.renderPublicSafety(dv);
```
