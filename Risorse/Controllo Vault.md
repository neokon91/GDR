---
cssclasses:
  - dashboard
  - gdr-vault-control
categoria: risorsa
tipo: controllo
stato: pronto
---

# Controllo Vault

> [!regia] Controllo operativo
> Questa vista indica cosa blocca un vault pulito e pronto al tavolo: code, stati incoerenti, date, materiale pronto ma incompleto.

## Priorita

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderVaultControlNow(dv);
```

## Stato Vault

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderVaultControlReadiness(dv);
```

## Code Operative

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderVaultControlQueues(dv);
```

## Coerenza

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderVaultControlCoherence(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderVaultControlSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start manutenzione -->
> [!regia] Azioni rapide
> Tenere il vault pulito e rilasciabile.
>
> Plugin coinvolti: `Meta Bind`, `Dataview`, `Linter`, `BRAT`, `Style Settings`, `Tasks`, `Bases`.
>
> **Quality report** - vuoi una vista piu ampia dei problemi del vault
> `BUTTON[quality-report-risorse-quality-report]`
>
> **Vista giocatori** - devi verificare cosa e sicuro mostrare
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> **Smista bozze generate** - ci sono bozze da trasformare in materiale utile o archivio
> `BUTTON[smistamento-bozze-generate-risorse-smistamento-bozze-generate-2]`
>
> **Bacheca preparazione** - sessioni e task preparatori vanno riordinati
> `BUTTON[preparazione-sessioni-z-bacheche-preparazione-sessioni]`
>
> **Task DM** - vuoi vedere lavoro aperto e manutenzione operativa
> `BUTTON[task-dm-risorse-task-dm]`
>
> [!regia]- Ripristino operativo
> Aprire le superfici che indicano cosa manca quando automazioni o viste non bastano.
>
> **Aiuto** - pulsanti, Dataview o template non rispondono
> `BUTTON[aiuto-risorse-se-qualcosa-non-funziona]`
>
> **Controllo vault** - devi tornare a questa pagina dopo una correzione
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> **Inbox** - devi smistare appunti grezzi
> `BUTTON[inbox-inbox-inbox]`
>
> **Worldbuilder** - il problema e materiale di mondo scollegato
> `BUTTON[worldbuilder-worldbuilder-dashboard]`
<!-- workflow:quick_actions:end manutenzione -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "manutenzione", { mode: "simple" });
```
