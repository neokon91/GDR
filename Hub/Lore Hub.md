---
cssclasses:
  - dashboard
  - gdr-lore-hub
categoria: risorsa
tipo: lore hub
stato: pronto
mondo_attivo: ""
---

# Lore Hub

> [!timeline] Hub visuale
> Questa pagina usa card operative per decidere quale segnale lore diventa gioco, canone, mistero o materiale al tavolo. L'Atlante resta la vista enciclopedica.

## Filtro

> [!scena]
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

## Priorita Lore

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLoreNow(dv, dv.current().mondo_attivo);
```

## Stato Lore

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLoreReadiness(dv, dv.current().mondo_attivo);
```

## Segnali E Canone

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLoreSignalQueues(dv, dv.current().mondo_attivo);
```

## Materiali Del Mondo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLoreWorldQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLoreSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start lore_hub -->
> [!regia] Azioni rapide
> Navigare il lore vivo senza perdere cosa produce segnali, segreti o gioco.
>
> **Atlante** - devi tornare a luoghi, culture e geografia
> `BUTTON[atlante-atlante-del-mondo-2]`
>
> **Economia e rotte** - il lore riguarda risorse, viaggi o dipendenze
> `BUTTON[economia-e-rotte-economia-e-rotte-2]`
>
> **Calendario** - feste, stagioni o date devono diventare pressione
> `BUTTON[calendario-mondi-calendario]`
>
> **Compendium** - vuoi raccogliere elementi ricorrenti e materiali del mondo
> `BUTTON[compendium-hub-compendium-del-mondo-compendium-del-mondo]`
>
> [!regia]- Cattura e canone
> Decidere se un segnale resta appunto, diventa mistero o entra nel canone.
>
> **Cattura lore** - hai un segnale interessante ma non ancora canonico
> `BUTTON[lore-capture-z-modelli-lore-capture-md]`
>
> **Nuovo mistero** - una verita deve essere rivelata gradualmente
> `BUTTON[nuovo-segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`
>
> **Revisione lore** - devi ripulire o canonizzare materiale disperso
> `BUTTON[revisione-lore-revisione-lore]`
>
> **Controllo canone** - temi contraddizioni, duplicati o segreti esposti
> `BUTTON[controllo-canone-controllo-canone]`
<!-- workflow:quick_actions:end lore_hub -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "lore_hub", { mode: "simple" });
```
