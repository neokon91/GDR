---
cssclasses:
  - dashboard
  - gdr-world-bible
categoria: risorsa
tipo: codex mondo
stato: pronto
mondo_attivo: ""
---

# Codex Del Mondo

> [!scena] World Anvil locale
> Risultato: il mondo scelto ha identita leggibile, articoli mostrabili e materiale pronto da giocare.

## Filtro

> [!scena]
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

## Priorita Codex

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderWorldBibleNow(dv, dv.current().mondo_attivo);
```

## Stato Codex

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderWorldBibleReadiness(dv, dv.current().mondo_attivo);
```

## Identita

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderWorldBibleIdentity(dv, dv.current().mondo_attivo);
```

## Articoli Pronti

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderWorldBibleArticles(dv, dv.current().mondo_attivo);
```

## Buchi Del Codex

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorldBibleGaps(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorldBibleSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start bibbia_mondo -->
> [!regia] Azioni rapide
> Consolidare il mondo come prodotto leggibile prima di espanderlo ancora.
>
> **Nuovo mondo guidato** - non esiste ancora un mondo base da consolidare
> `BUTTON[nuovo-mondo-homebrew]`
>
> **Atlante** - devi vedere luoghi, culture, storia e geografia
> `BUTTON[atlante-del-mondo-atlante-del-mondo]`
>
> [!regia]- Consolidamento
> Passare dal codex alla verifica e al gioco.
>
> **Worldbuilder** - mancano identita, poteri o misteri giocabili
> `BUTTON[worldbuilder-worldbuilder-dashboard]`
>
> **Controllo worldbuilding** - vuoi vedere buchi strutturali del mondo
> `BUTTON[controllo-worldbuilding-controllo-worldbuilding]`
>
> **Campagna da ambientazione** - il mondo deve diventare campagna o prima sessione
> `BUTTON[campagna-da-ambientazione-campagna-da-ambientazione]`
>
> **Vista giocatori** - vuoi controllare cosa e mostrabile senza segreti
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
<!-- workflow:quick_actions:end bibbia_mondo -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "bibbia_mondo", { mode: "simple" });
```
