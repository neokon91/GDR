---
cssclasses:
  - dashboard
  - gdr-economia-rotte
categoria: risorsa
tipo: dashboard economia
stato: pronto
mondo_attivo: ""
---

# Economia E Rotte

> [!luogo] Sistema commerciale
> Decidi quale rotta, risorsa o mercato deve muovere il gioco adesso: blocco, dipendenza, controllore, conseguenza o buco da chiudere.

## Filtro

> [!scena]
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

## Priorita Economica

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderEconomyNow(dv, dv.current().mondo_attivo);
```

## Stato Rete

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderEconomyReadiness(dv, dv.current().mondo_attivo);
```

## Rotte Risorse Mercati

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderEconomyQueues(dv, dv.current().mondo_attivo);
```

## Dipendenze E Buchi

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderEconomyDependencyQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderEconomySurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start economia_rotte -->
> [!regia] Azioni rapide
> Rendere viaggi, risorse e mercati capaci di generare pressione di gioco.
>
> **Nuova rotta** - un passaggio deve creare opportunita, costo o rischio
> `BUTTON[nuova-rotta-z-modelli-worldbuilding-rotta-md]`
>
> **Nuova risorsa** - una merce, dipendenza o scarsita muove fazioni
> `BUTTON[nuova-risorsa-z-modelli-worldbuilding-risorsa-md]`
>
> **Nuovo mercato** - serve un nodo commerciale, pedaggio o strozzatura
> `BUTTON[nuovo-mercato-z-modelli-worldbuilding-mercato-o-nodo-commerciale-md]`
>
> **Geopolitica** - economia e confini stanno producendo conflitto
> `BUTTON[geopolitica-geopolitical-dashboard]`
>
> **Lore hub** - vuoi collegare risorse a storia, culture e segnali
> `BUTTON[lore-hub-lore-hub]`
>
> [!regia]- Conseguenze economiche
> Trasformare blocchi, merci e rotte in materiale da sessione.
>
> **Nuovo conflitto** - una risorsa o rotta contesa deve diventare crisi
> `BUTTON[nuovo-conflitto-z-modelli-worldbuilding-conflitto-md]`
>
> **Nuova missione** - una dipendenza economica diventa obiettivo per i PG
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuovo clock** - scarsita, embargo o blocco devono avanzare nel tempo
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
<!-- workflow:quick_actions:end economia_rotte -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "economia_rotte", { mode: "simple" });
```
