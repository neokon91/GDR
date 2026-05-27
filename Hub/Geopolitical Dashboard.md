---
cssclasses:
  - dashboard
  - gdr-geopolitical-dashboard
categoria: risorsa
tipo: dashboard geopolitica
stato: pronto
mondo_attivo: ""
---

# Geopolitical Dashboard

> [!luogo] Geopolitica operativa
> Decidi quale territorio, relazione o crisi deve muovere il mondo adesso. Confini, risorse e diplomazia devono produrre pressioni giocabili, non solo descrizione.

## Filtro

> [!scena]
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

## Priorita Politica

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderGeopoliticalNow(dv, dv.current().mondo_attivo);
```

## Stato Poteri

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderGeopoliticalReadiness(dv, dv.current().mondo_attivo);
```

## Territori E Relazioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderGeopoliticalQueues(dv, dv.current().mondo_attivo);
```

## Confini Risorse Crisi

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderGeopoliticalPressureQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderGeopoliticalSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start geopolitica -->
> [!regia] Azioni rapide
> Trasformare confini, poteri e crisi diplomatiche in pressione giocabile.
>
> **Nuovo territorio** - serve uno stato, dominio, marca o protettorato
> `BUTTON[nuovo-territorio-politico-z-modelli-luogo-router-md]`
>
> **Nuova relazione** - due poteri devono avere patto, rivalita o trattato
> `BUTTON[nuova-relazione-z-modelli-worldbuilding-relazione-md]`
>
> **Motore mondo vivo** - una crisi deve propagarsi su luoghi, fazioni o timeline
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
>
> **Economia e rotte** - confini, risorse o pedaggi stanno muovendo il conflitto
> `BUTTON[economia-e-rotte-economia-e-rotte-2]`
>
> [!regia]- Conseguenze politiche
> Convertire attriti diplomatici in conflitti, missioni o clock.
>
> **Nuovo conflitto** - una crisi diplomatica deve avere posta e schieramenti
> `BUTTON[nuovo-conflitto-z-modelli-worldbuilding-conflitto-md]`
>
> **Nuova missione** - un confine o trattato crea un obiettivo per i PG
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuovo clock** - guerra, embargo o successione devono avanzare nel tempo
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
<!-- workflow:quick_actions:end geopolitica -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "geopolitica", { mode: "simple" });
```
