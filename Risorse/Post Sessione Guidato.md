---
cssclasses:
  - dashboard
  - gdr-post-session-flow
categoria: risorsa
tipo: post-sessione
stato: pronto
---

# Post Sessione Guidato

> [!missione] Chiusura operativa
> Trasforma la sessione appena giocata in mondo aggiornato: decisioni, conseguenze, recap sicuro e prossima apertura. Non preparare altro finche appunti e propagazioni non hanno una direzione.

## Sessione Da Chiudere

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPostSessionNow(dv);
```

## Stato Chiusura

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPostSessionReadiness(dv);
```

## Canone E Recap

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderPostSessionClosureQueues(dv);
```

## Conseguenze E Prossime Mosse

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderPostSessionPropagationQueues(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderPostSessionSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start post_sessione -->
> [!regia] Azioni rapide
> Trasformare appunti e conseguenze in mondo aggiornato.
>
> **Fine sessione guidata** - devi convertire appunti in output, recap e prossima apertura
> `BUTTON[wizard-fine-sessione]`
>
> **Prossima sessione da output** - hai chiuso la sessione e vuoi preparare la prossima partendo dall'output
> `BUTTON[wizard-sessione-da-output]`
>
> **Applica conseguenza** - una nota ha conseguenze o impatti ancora aperti
> `BUTTON[applica-conseguenza]`
>
> **Propaga a entita** - bersagli collegati devono ricevere aggiornamenti
> `BUTTON[propaga-a-entita]`
>
> **Prepara recap pubblico** - devi produrre materiale mostrabile ai giocatori
> `BUTTON[prepara-recap-pubblico]`
>
> **Fuori scena** - devi scegliere chi reagisce prima della prossima sessione
> `BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`
>
> [!regia]- Continuita e propagazione
> Applicare le conseguenze alle note bersaglio prima che restino appunti isolati.
>
> **Registra scelta mondo** - una decisione deve diventare stato tracciabile
> `BUTTON[registra-scelta-mondo]`
>
> **Applica conseguenza** - una conseguenza ha bersagli concreti
> `BUTTON[applica-conseguenza]`
>
> **Propaga a entita** - piu note devono ricevere aggiornamenti
> `BUTTON[propaga-a-entita]`
>
> **Prepara recap pubblico** - devi chiudere con materiale player-safe
> `BUTTON[prepara-recap-pubblico]`
>
> **Evento storico** - l'esito della sessione deve entrare nella timeline
> `BUTTON[nuovo-evento-storico-z-modelli-evento-storico-md]`
>
> **Nuovo clock** - una conseguenza deve diventare pressione tracciabile
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
<!-- workflow:quick_actions:end post_sessione -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "post_sessione", { mode: "simple" });
```
