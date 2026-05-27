---
cssclasses:
  - dashboard
  - gdr-worldbuilding-control
categoria: risorsa
tipo: controllo worldbuilding
stato: pronto
mondo_attivo: ""
---

# Controllo Worldbuilding

> [!timeline] Coerenza e Buchi operativi
> Questa vista sceglie cosa riparare prima: profondita mancante, connessioni deboli, canone incompleto, materiale non giocabile, rischio player-safe e schede pronte ma ferme.

## Filtro

> [!scena] Mondo
> `INPUT[mondo][:mondo_attivo]`

<!-- workflow:quick_actions:start controllo_worldbuilding -->
> [!regia] Azioni rapide
> Trovare schede di mondo superficiali, scollegate o non ancora giocabili.
>
> **Atlante** - devi vedere geografia, culture, storia e buchi spaziali
> `BUTTON[atlante-atlante-del-mondo-2]`
>
> **Worldbuilding profondo** - una scheda va resa piu viva invece di crearne una nuova
> `BUTTON[worldbuilding-profondo-risorse-worldbuilding-profondo-2]`
>
> **Bibbia del mondo** - devi consolidare tono, canone e principi del mondo
> `BUTTON[bibbia-del-mondo-bibbia-del-mondo]`
>
> **Economia e rotte** - mancano risorse, dipendenze, mercati o passaggi
> `BUTTON[economia-e-rotte-economia-e-rotte]`
>
> [!regia]- Riparazione guidata
> Convertire buchi strutturali in azioni concrete.
>
> **Nuova cultura** - mancano vita quotidiana, tabù o identità sociali
> `BUTTON[nuova-cultura-z-modelli-worldbuilding-cultura-md]`
>
> **Nuovo conflitto** - una tensione non ha ancora posta, cause o possibili paci
> `BUTTON[nuovo-conflitto-z-modelli-worldbuilding-conflitto-md]`
>
> **Nuova relazione** - due entita esistono ma non si influenzano
> `BUTTON[nuova-relazione-z-modelli-worldbuilding-relazione-md]`
>
> **Nuovo mistero** - manca una verita scopribile a livelli
> `BUTTON[nuovo-segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`
<!-- workflow:quick_actions:end controllo_worldbuilding -->

## Priorita

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderWorldbuildingControlNow(dv, dv.current().mondo_attivo);
```

## Audit

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderWorldbuildingControlReadiness(dv, dv.current().mondo_attivo);
```

## Code Di Riparazione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorldbuildingControlQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorldbuildingControlSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "controllo_worldbuilding", { mode: "simple" });
```
