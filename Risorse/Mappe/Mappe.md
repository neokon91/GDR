---
cssclasses:
  - dashboard
  - gdr-maps-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo: ""
---

# Mappe

> [!luogo] Supporti spaziali
> Risultato: scegliere quale mappa usare, correggere o rendere player-safe senza leggere un archivio lungo.

<!-- workflow:quick_actions:start mappe_operativo -->
> [!regia] Azioni rapide
> Scegliere o correggere il supporto spaziale giusto per sessione, viaggio, fronte o versione giocatori.
>
> **Nuova mappa zoom** - una scena, un dungeon o un luogo deve essere navigabile
> `BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`
>
> **Nuova mappa fronti** - pressioni, fazioni, indizi o relazioni vanno viste insieme
> `BUTTON[nuova-mappa-fronti-z-modelli-mappe-mappa-excalidraw-fronti-excalidraw-md]`
>
> **Atlante** - devi correggere coordinate, luoghi, rotte o layer
> `BUTTON[atlante-del-mondo-atlante-del-mondo]`
>
> **Vista giocatori** - vuoi mostrare una mappa senza rivelare segreti DM
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> [!regia]- Contesto mappa
> Aprire la superficie dove la mappa diventa gioco, non archivio.
>
> **Preparazione sessione** - la mappa serve il prossimo tavolo
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Durante il gioco** - devi aprire la mappa mentre la scena e attiva
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> **Worldbuilder** - mancano luoghi, fazioni o missioni da collegare
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> **Report qualita** - vuoi controllare player-safe, buchi e materiale mostrabile
> `BUTTON[quality-report-risorse-quality-report]`
<!-- workflow:quick_actions:end mappe_operativo -->

## Filtro

> [!scena] Mondo
> `INPUT[mondo][:mondo_attivo]`

## Prossima Azione Mappa

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderMapsNow(dv, dv.current().mondo_attivo);
```

## Stato Mappe

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderMapsReadiness(dv, dv.current().mondo_attivo);
```

## Code Mappe

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapsUseQueues(dv, dv.current().mondo_attivo);
```

## Layer Integrati

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapsIntegratedLayers(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapsSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "mappe_operativo", { mode: "simple" });
```
