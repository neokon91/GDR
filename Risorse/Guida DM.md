---
cssclasses:
  - dashboard
  - gdr-dm-guide-dashboard
categoria: risorsa
tipo: guida
stato: pronto
---

# Guida DM

> [!regia] Bussola DM
> Risultato: scegliere cosa aprire adesso senza rileggere manuali o duplicare le dashboard.

<!-- workflow:quick_actions:start guida_dm -->
> [!regia] Azioni rapide
> Scegliere cosa aprire adesso senza leggere guide lunghe.
>
> **DM Dashboard** - vuoi vedere lo stato complessivo del tavolo
> `BUTTON[dm-dashboard-1-dm-dashboard]`
>
> **Prepara** - devi scegliere o rifinire la prossima sessione
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Gioca** - una sessione deve andare al tavolo
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> **Chiudi** - il tavolo e finito e devi smistare conseguenze
> `BUTTON[post-sessione-guidato-risorse-post-sessione-guidato]`
>
> [!regia]- Mondo
> Aprire solo superfici che cambiano materiale giocabile.
>
> **Worldbuilder** - una sessione richiede nuovi luoghi, poteri o pressioni
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> **Mondo vivo** - una conseguenza deve cambiare note o clock
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
>
> [!regia]- Pulizia
> Risolvere rumore e condivisione prima di creare altro.
>
> **Controllo Vault** - ci sono bozze, note isolate o problemi di stato
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> **Vista giocatori** - devi condividere recap, mappa o dispensa senza segreti
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
<!-- workflow:quick_actions:end guida_dm -->

## Cosa Fare Ora

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderDmGuideNow(dv);
```

## Ciclo DM

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderDmGuideLoop(dv);
```

## Regole Di Taglio

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderDmGuideRules(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderDmGuideSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "guida_dm", { mode: "simple" });
```
