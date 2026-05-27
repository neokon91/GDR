---
cssclasses:
  - dashboard
  - gdr-compendium-dashboard
categoria: risorsa
tipo: compendium mondo
stato: pronto
mondo_attivo: ""
---

# Compendium Del Mondo

> [!scena] Originale, non-SRD
> Risultato: ogni elemento originale del mondo ha tipo, luogo culturale, uso narrativo e legami con risorse, storia o gioco.

## Filtro

> [!scena]
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

## Priorita Compendium

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCompendiumNow(dv, dv.current().mondo_attivo);
```

## Stato Compendium

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCompendiumReadiness(dv, dv.current().mondo_attivo);
```

## Tipi Originali

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCompendiumTypeMix(dv, dv.current().mondo_attivo);
```

## Code Operative

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCompendiumOperationalQueues(dv, dv.current().mondo_attivo);
```

## Storia E Pressioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCompendiumHistoryQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCompendiumSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start compendium_mondo -->
> [!regia] Azioni rapide
> Creare elementi originali del mondo e collegarli a culture, risorse, missioni o storia.
>
> **Nuovo elemento** - vuoi creare materiale originale non-SRD con uso narrativo
> `BUTTON[nuovo-elemento-z-modelli-worldbuilding-compendium-del-mondo-md]`
>
> **Lore hub** - devi collegare l'elemento a segnali, misteri o canone
> `BUTTON[lore-hub-lore-hub]`
>
> [!regia]- Collega al gioco
> Evitare elementi decorativi senza impatto.
>
> **Nuova risorsa** - l'elemento e merce, dipendenza o leva economica
> `BUTTON[nuova-risorsa-z-modelli-worldbuilding-risorsa-md]`
>
> **Nuova cultura** - l'elemento definisce pratiche, tabu o identita
> `BUTTON[nuova-cultura-z-modelli-worldbuilding-cultura-md]`
>
> **Nuovo mistero** - l'elemento deve essere scoperto gradualmente
> `BUTTON[nuovo-segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`
>
> **Nuova missione** - l'elemento genera obiettivo, rischio o ricompensa
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
<!-- workflow:quick_actions:end compendium_mondo -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "compendium_mondo", { mode: "simple" });
```
