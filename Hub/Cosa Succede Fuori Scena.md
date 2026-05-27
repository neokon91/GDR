---
cssclasses:
  - dashboard
  - gdr-offscreen-dashboard
categoria: risorsa
tipo: dashboard fuori scena
stato: pronto
mondo_attivo: ""
campagne_attive: []
---

# Cosa Succede Fuori Scena

> [!timer] Motore Fuori Scena
> Questa vista sceglie chi reagisce tra una sessione e l'altra, quale conseguenza va applicata e cosa deve arrivare al prossimo tavolo.

## Filtro

> [!scena]
> Mondo: `INPUT[mondo][:mondo_attivo]`
>
> Campagne: `INPUT[campagne][:campagne_attive]`

## Reazione Immediata

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderOffscreenNow(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Stato Fuori Scena

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderOffscreenReadiness(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Code Reazioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderOffscreenReactionQueues(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Ponte Al Tavolo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderOffscreenTableBridge(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderOffscreenSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start fuori_scena -->
> [!regia] Azioni rapide
> Scegliere cosa reagisce tra una sessione e l'altra senza perdere conseguenze aperte.
>
> **Post sessione guidato** - devi chiudere appunti, recap e output della sessione
> `BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`
>
> **Motore mondo vivo** - vuoi leggere pressioni e prossime mosse aggregate
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
>
> **Stato campagna** - devi vedere conseguenze, missioni e tracciati aperti
> `BUTTON[stato-campagna-mondi-stato-del-mondo]`
>
> **Nuovo clock** - una pressione fuori scena deve diventare tracciabile
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
>
> **Applica conseguenza** - una conseguenza ha bersagli gia identificati
> `BUTTON[applica-conseguenza]`
>
> **Propaga a entita** - piu note devono ricevere aggiornamenti coerenti
> `BUTTON[propaga-a-entita]`
>
> [!regia]- Continuita
> Trasformare eventi e scelte in stato leggibile prima della prossima preparazione.
>
> **Registra scelta mondo** - una decisione del party deve diventare pressione o stato
> `BUTTON[registra-scelta-mondo]`
>
> **Conseguenza guidata** - sai che qualcosa cambia ma non hai ancora i campi corretti
> `BUTTON[wizard-conseguenza]`
>
> **Evento storico** - la conseguenza deve entrare nella timeline
> `BUTTON[evento-storico-z-modelli-evento-storico-md]`
>
> **Prepara recap pubblico** - devi separare materiale mostrabile dai segreti DM
> `BUTTON[prepara-recap-pubblico]`
>
> [!regia]- Ponte verso la prossima sessione
> Convertire reazioni fuori scena in materiale da giocare.
>
> **Preparazione sessione** - hai scelto una pressione da portare al tavolo
> `BUTTON[prossima-sessione-risorse-preparazione-sessione]`
>
> **Nuova missione** - una reazione diventa obiettivo concreto
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuova fazione** - manca l'attore che produce la pressione
> `BUTTON[nuova-fazione-z-modelli-fazione-router-md]`
>
> **Nuovo PNG** - serve un volto per mostrare la reazione
> `BUTTON[nuovo-png-z-modelli-personaggio-png-md]`
<!-- workflow:quick_actions:end fuori_scena -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "fuori_scena", { mode: "simple" });
```
