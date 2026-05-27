---
cssclasses:
  - dashboard
  - gdr-prep-flow
categoria: risorsa
tipo: preparazione
stato: pronto
---

# Preparazione Sessione

> [!missione] Sessione giocabile
> Trasforma una sessione candidata in tavolo pronto: una sola sessione target, almeno tre ancore mondo, cinque blocchi compilati e materiale minimo verificato.

## Sessione Da Preparare

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPreparationNow(dv);
```

## Stato Preparazione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPreparationReadiness(dv);
```

## Ancore E Blocchi

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderPreparationAnchorQueues(dv);
```

## Materiali Pronti

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderPreparationMaterialQueues(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderPreparationSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start prepara_sessione -->
> [!regia] Azioni rapide
> Preparare una sessione radicata nel mondo.
>
> **Nuova sessione** - non esiste ancora una nota sessione per il prossimo tavolo
> `BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
>
> **Rendi sessione attiva** - hai scelto quale sessione userai al tavolo
> `BUTTON[rendi-sessione-attiva]`
>
> **Nuova entita viva** - manca un'ancora mondo giocabile
> `BUTTON[wizard-nuova-entita-viva]`
>
> **Collega sessione attiva** - una nota utile non e ancora collegata alla sessione
> `BUTTON[collega-sessione-attiva]`
>
> **Nuova mappa** - serve materiale spaziale pronto al tavolo
> `BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`
>
> **Apri tavolo** - la sessione e pronta o in corso
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> [!regia]- Ancore mondo
> Collegare materiale vivo prima di compilare i cinque blocchi della sessione.
>
> **Worldbuilder** - mancano mondo, luogo, fazione o pressione
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> **Nuova missione** - serve un obiettivo giocabile
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuovo clock** - manca una pressione visibile
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
>
> **Nuova fazione** - serve un potere che reagisce
> `BUTTON[nuova-fazione-z-modelli-fazione-router-md]`
>
> [!regia]- Materiale pronto
> Preparare solo cio che puo arrivare davvero al tavolo.
>
> **Nuovo incontro** - serve una scena meccanica o un combattimento
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md]`
>
> **Nuova dispensa** - serve materiale da consegnare o leggere
> `BUTTON[nuova-dispensa-z-modelli-dispensa-md]`
>
> **Nuova mappa fronti** - vuoi visualizzare relazioni, pressioni o fronti
> `BUTTON[nuova-mappa-fronti-z-modelli-mappe-mappa-excalidraw-fronti-excalidraw-md-2]`
>
> **Nuovo PNG** - serve una persona pronta in scena
> `BUTTON[nuovo-png-z-modelli-personaggio-png-md]`
<!-- workflow:quick_actions:end prepara_sessione -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "prepara_sessione", { mode: "simple" });
```
