---
cssclasses:
  - dashboard
  - gdr-quality-report
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Quality Report

> [!regia] Report qualita
> Risultato: vedere cosa blocca giocabilita, condivisione e screenshot senza leggere liste lunghe.

## Priorita

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderQualityReportNow(dv);
```

## Copertura

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderQualityReportCoverage(dv);
```

## Buchi Operativi

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderQualityReportOperationalGaps(dv);
```

## Pubblicazione Giocatori

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderQualityReportPublicSafety(dv);
```

## Screenshot Ready

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderQualityReportShowcase(dv);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderQualityReportSurfaceLinks(dv);
```

## Azioni

<!-- workflow:quick_actions:start quality_report -->
> [!regia] Azioni rapide
> Capire quali buchi rendono il vault meno giocabile, condivisibile o player-safe.
>
> **Controllo vault** - vuoi passare dal report visuale alla coda operativa
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> **Vista giocatori** - devi verificare materiale mostrabile senza segreti DM
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> **Atlante del mondo** - vuoi controllare copertura di luoghi, mappe e coordinate
> `BUTTON[atlante-del-mondo-atlante-del-mondo]`
>
> [!regia]- Correzione rapida
> Aprire le superfici dove i buchi del report diventano lavoro concreto.
>
> **Worldbuilder** - mancano collegamenti o fondamenta di mondo
> `BUTTON[worldbuilder-worldbuilder-dashboard]`
>
> **Stato campagna** - il problema riguarda pressioni, missioni o conseguenze
> `BUTTON[stato-campagna-mondi-stato-del-mondo]`
>
> **Smista bozze** - il problema deriva da materiale generato non deciso
> `BUTTON[smistamento-bozze-generate-risorse-smistamento-bozze-generate-2]`
<!-- workflow:quick_actions:end quality_report -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "quality_report", { mode: "simple" });
```
