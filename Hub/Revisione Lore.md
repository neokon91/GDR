---
cssclasses:
  - dashboard
  - gdr-lore-review
categoria: risorsa
tipo: lore review
stato: pronto
mondo_attivo: ""
---

# Revisione Lore

> [!scena] Revisione operativa
> Ripara appunti lore incompleti, isolati o non giocabili prima che diventino rumore permanente nel mondo.

## Filtro

> [!scena]
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

## Priorita Revisione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLoreReviewNow(dv, dv.current().mondo_attivo);
```

## Stato Revisione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderLoreReviewReadiness(dv, dv.current().mondo_attivo);
```

## Completa E Collega

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLoreReviewCompletionQueues(dv, dv.current().mondo_attivo);
```

## Misteri Storia Pressioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLoreReviewTableQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderLoreReviewSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start revisione_lore -->
> [!regia] Azioni rapide
> Ripulire appunti lore, segreti e pressioni prima che confondano canone e tavolo.
>
> **Cattura lore** - hai un segnale interessante ma non ancora stabile
> `BUTTON[lore-capture-z-modelli-lore-capture-md]`
>
> **Nuovo mistero** - una verita deve essere rivelata gradualmente
> `BUTTON[nuovo-segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`
>
> **Controllo canone** - devi decidere verita, rumor, segreto, falso o retcon
> `BUTTON[controllo-canone-controllo-canone]`
>
> **Lore hub** - vuoi leggere il materiale lore gia collegato
> `BUTTON[lore-hub-lore-hub]`
>
> [!regia]- Trasforma in gioco
> Convertire lore riparato in mondo vivo, appigli e scena.
>
> **Motore mondo vivo** - una verita produce conseguenze o reazioni
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
>
> **Controllo worldbuilding** - il buco nasce da schede mondo incomplete
> `BUTTON[controllo-worldbuilding-controllo-worldbuilding]`
>
> **Atlante** - manca un luogo, regione o mappa collegata
> `BUTTON[atlante-atlante-del-mondo]`
<!-- workflow:quick_actions:end revisione_lore -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "revisione_lore", { mode: "simple" });
```
