---
cssclasses:
  - dashboard
  - gdr-table-materials
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Materiali Al Tavolo

> [!scena] Kit di sessione
> Risultato: scegliere cosa aprire, consegnare o correggere, inclusi handout, mappe, audio e video, prima che la sessione entri in scena.

## Pronto Ora

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderTableMaterialsNow(dv);
```

## Stato Materiali

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderTableMaterialsReadiness(dv);
```

## Sessione E Consegne

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderTableMaterialsSessionQueues(dv);
```

## Incontri Mappe Media

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderTableMaterialsAssetQueues(dv);
```

## Prontezza DnD

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderTableMaterialsDndPipeline(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderTableMaterialsSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "prepara_sessione", { mode: "simple" });
```
