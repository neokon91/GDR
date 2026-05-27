---
cssclasses:
  - dashboard
  - gdr-generated-drafts
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Smistamento Bozze Generate

> [!regia] Fantasy Content Generator
> Risultato: ogni bozza generata viene collegata, smistata, canonizzata solo se confermata, oppure archiviata.

## Prossima Bozza Da Decidere

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderGeneratedDraftsNow(dv);
```

## Stato Bozze

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderGeneratedDraftsReadiness(dv);
```

## Code Di Smistamento

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderGeneratedDraftsQueues(dv);
```

## Destinazioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderGeneratedDraftsDestinations(dv);
```

## Smistate E Canonizzate

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderGeneratedDraftsResolved(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderGeneratedDraftsSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start smistamento_bozze -->
> [!regia] Azioni rapide
> Trasformare bozze generate in note utili, canoniche o archiviate.
>
> **Generatore fantasy** - vuoi creare una nuova bozza da valutare
> `BUTTON[generatore-fantasy-fantasy-content-generator-open-generator-2]`
>
> **Controllo vault** - vuoi verificare se restano bozze o problemi
> `BUTTON[controllo-vault-risorse-controllo-vault-2]`
>
> **Inbox** - devi tornare alla coda completa degli appunti
> `BUTTON[inbox-inbox-inbox-2]`
>
> **Smista bozza** - la bozza ha un aggancio a mondo, luogo, campagna o sessione
> `BUTTON[smista-bozza-generata]`
>
> **Canonizza bozza** - la bozza e stata confermata in gioco o nel canone
> `BUTTON[canonizza-bozza-generata]`
<!-- workflow:quick_actions:end smistamento_bozze -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "smistamento_bozze", { mode: "simple" });
```
