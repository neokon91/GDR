---
cssclasses:
  - dashboard
  - gdr-media-scene-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Media Scene

> [!scena] Cue di scena
> Risultato: aprire solo audio, video o immagini che hanno scena, uso e punto di ingresso chiari.

<!-- workflow:quick_actions:start media_scene -->
> [!regia] Azioni rapide
> Preparare cue media senza trasformarli in archivio parallelo.
>
> **Durante il gioco** - la sessione e attiva e devi aprire cue al tavolo
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> **Materiali al tavolo** - vuoi vedere media insieme a mappe, dispense e incontri
> `BUTTON[materiali-al-tavolo-risorse-materiali-al-tavolo]`
>
> **Preparazione sessione** - il cue non ha ancora scena o obiettivo chiaro
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Vista giocatori** - una immagine o un video puo essere mostrato al party
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> [!regia]- Se non e pronto
> Tornare alla superficie che decide se il cue serve davvero.
>
> **Controllo vault** - il media e scollegato o sembra rumore
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> **Report qualita** - devi controllare sicurezza e materiale mostrabile
> `BUTTON[quality-report-risorse-quality-report]`
<!-- workflow:quick_actions:end media_scene -->

## Media Per La Sessione Attiva

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderMediaSceneNow(dv);
```

## Stato Cue

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderMediaSceneReadiness(dv);
```

## Cue Sessione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMediaSceneSessionCues(dv);
```

## Archivio Cue

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMediaSceneCueQueues(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMediaSceneSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "media_scene", { mode: "simple" });
```
