---
cssclasses:
  - dashboard
  - gdr-map-import-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Importare Mappe

> [!mappa] Import controllato
> Risultato: provare una sorgente esterna in dry-run, creare bozze e smistare solo cio che diventa gioco.

<!-- workflow:quick_actions:start import_mappe -->
> [!regia] Azioni rapide
> Normalizzare mappe esterne senza far entrare contenuto grezzo nel canone.
>
> **Mappe** - devi controllare uso, agganci o versione giocatori
> `BUTTON[mappe-risorse-mappe-mappe]`
>
> **Atlante** - devi verificare coordinate, luoghi o marker
> `BUTTON[atlante-del-mondo-atlante-del-mondo]`
>
> **Smista bozze** - l'import ha creato note in Inbox/Generati
> `BUTTON[smista-generati-risorse-smistamento-bozze-generate]`
>
> **Controllo vault** - vuoi controllare buchi e note isolate dopo lo smistamento
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> [!regia]- Dopo import
> Aprire solo le superfici che trasformano output grezzi in materiale giocabile.
>
> **Vista giocatori** - una mappa o un luogo importato puo essere mostrato al party
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> **Preparazione sessione** - l'import serve la prossima giocata
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Worldbuilder** - mancano luoghi, fazioni o missioni da collegare
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
<!-- workflow:quick_actions:end import_mappe -->

## Import Prima

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapImportNow(dv);
```

## Stato Import

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapImportReadiness(dv);
```

## Sorgenti Supportate

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapImportSources(dv);
```

## Bozze E Output

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapImportQueues(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderMapImportSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "import_mappe", { mode: "simple" });
```
