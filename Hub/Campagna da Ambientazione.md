---
cssclasses:
  - dashboard
  - gdr-campaign-builder
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo: ""
---

# Campagna Da Ambientazione

> [!luogo] Opportunità di campagna
> Trasforma regioni, conflitti o culture in campagne, archi narrativi, missioni e prime sessioni. Parti solo da materiale che puo generare scelta al tavolo.

## Filtro

> [!scena]
> Mondo:
> `INPUT[mondo][:mondo_attivo]`

## Prossima Campagna

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCampaignBuilderNow(dv, dv.current().mondo_attivo);
```

## Stato Ponte

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCampaignBuilderReadiness(dv, dv.current().mondo_attivo);
```

## Opportunita Da Giocare

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCampaignBuilderOpportunityQueues(dv, dv.current().mondo_attivo);
```

## Fronti E Campagne

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCampaignBuilderCampaignQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCampaignBuilderSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start campagna_ambientazione -->
> [!regia] Azioni rapide
> Trasformare una regione, un conflitto o una cultura in campagna giocabile.
>
> **Campagna da regione** - hai una zona interessante e vuoi darle struttura di campagna
> `BUTTON[campagna-da-regione-z-modelli-dm-campagna-da-regione-md]`
>
> **Arco da conflitto** - una tensione del mondo deve diventare avanzamento giocabile
> `BUTTON[arco-da-conflitto-z-modelli-dm-arco-da-conflitto-md]`
>
> **Opportunita di avventura** - vuoi scegliere ganci gia pronti invece di creare altro lore
> `BUTTON[opportunita-risorse-opportunita-di-avventura]`
>
> **Fronti di campagna** - devi vedere quali pressioni stanno muovendo il mondo
> `BUTTON[fronti-risorse-fronti-di-campagna]`
>
> **Atlante del mondo** - ti manca una regione, cultura o crisi da cui partire
> `BUTTON[atlante-atlante-del-mondo]`
>
> [!regia]- Materializza il gioco
> Convertire ambientazione in cose che il tavolo puo usare subito.
>
> **Nuova campagna** - hai gia scelto promessa, luogo iniziale e tensione centrale
> `BUTTON[nuova-campagna-z-modelli-dm-campagna-md]`
>
> **Nuova missione** - una pressione deve diventare obiettivo concreto per i personaggi
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuova sessione** - vuoi preparare la prima giocata partendo dalla campagna
> `BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
>
> **Nuovo clock** - un fronte deve avanzare anche se il party lo ignora
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
>
> [!regia]- Approfondisci solo se serve
> Aggiungere profondita senza perdere il ponte verso la sessione.
>
> **Worldbuilding profondo** - una scheda continua a tornare in scena e merita piu livelli
> `BUTTON[worldbuilding-profondo-risorse-worldbuilding-profondo]`
>
> **Creazione guidata entita** - non sai quali campi compilare per renderla giocabile
> `BUTTON[creazione-guidata-entita-risorse-creazione-guidata-entita]`
>
> **Motore mondo vivo** - vuoi capire quali fazioni o pressioni reagiscono adesso
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
>
> **Preparazione sessione** - hai abbastanza materiale e devi portarlo al tavolo
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
<!-- workflow:quick_actions:end campagna_ambientazione -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "campagna_ambientazione", { mode: "simple" });
```
