---
cssclasses:
  - dashboard
  - gdr-living-world-engine
categoria: risorsa
tipo: motore mondo vivo
stato: pronto
mondo_attivo: ""
campagne_attive: []
---

# Motore Mondo Vivo

> [!timeline] Campaign + Living World Engine
> Questa vista decide cosa deve cambiare nel mondo prima della prossima sessione: conseguenze, bersagli, pressioni, economia e canone pubblicabile.

## Filtro

> [!scena]
> Mondo: `INPUT[mondo][:mondo_attivo]`
>
> Campagne: `INPUT[campagne][:campagne_attive]`

## Priorita

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLivingWorldNow(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Stato Mondo Vivo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLivingWorldReadiness(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Code Di Propagazione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLivingWorldQueues(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Pressioni E Bersagli

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLivingWorldPressureQueues(dv, dv.current().mondo_attivo, dv.current().campagne_attive);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLivingWorldSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start motore_mondo_vivo -->
> [!regia] Azioni rapide
> Decidere cosa cambia nel mondo prima della prossima sessione.
>
> **Stato campagna** - devi leggere missioni, pressioni e conseguenze aperte
> `BUTTON[stato-campagna-mondi-stato-del-mondo]`
>
> **Fuori scena** - devi scegliere chi reagisce tra una sessione e l'altra
> `BUTTON[cosa-succede-fuori-scena-cosa-succede-fuori-scena]`
>
> **Worldbuilder** - una reazione richiede luogo, fazione, mistero o pressione
> `BUTTON[worldbuilder-worldbuilder-dashboard]`
>
> **Timeline** - un cambiamento deve diventare storia canonica
> `BUTTON[timeline-mondi-timeline-timeline]`
>
> **Controllo canone** - devi distinguere verita, rumor, retcon e contraddizioni
> `BUTTON[controllo-canone-controllo-canone]`
>
> **Economia e rotte** - una pressione riguarda risorse, mercati o passaggi
> `BUTTON[economia-e-rotte-economia-e-rotte-2]`
>
> [!regia]- Continuita operativa
> Trasformare conseguenze aperte in mosse del mondo verificabili.
>
> **Registra scelta mondo** - una decisione del party deve diventare stato persistente
> `BUTTON[registra-scelta-mondo]`
>
> **Applica conseguenza** - una conseguenza ha bersagli chiari
> `BUTTON[applica-conseguenza]`
>
> **Propaga a entita** - piu note devono ricevere aggiornamenti coerenti
> `BUTTON[propaga-a-entita]`
>
> **Nuovo clock** - una pressione deve avanzare in modo visibile
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
<!-- workflow:quick_actions:end motore_mondo_vivo -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "motore_mondo_vivo", { mode: "simple" });
```
