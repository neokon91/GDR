---
cssclasses:
  - dashboard
  - gdr-start-here
categoria: risorsa
tipo: onboarding
stato: pronto
---
# Inizia Qui

Scegli una cosa sola. Il vault deve farti produrre una sessione, giocarla o aggiornare il mondo dopo il tavolo.

## Flusso Principale

> [!scena] 1. Prepara
> Output: una sessione con obiettivo, prima scena, scelta, pressione e materiale pronto.
>
> `BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
>
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`

> [!incontro] 2. Gioca
> Output: appunti live, clock aggiornati, handout consegnati e decisioni prese al tavolo.
>
> `BUTTON[gioca-hub-durante-il-gioco-durante-il-gioco]`

> [!timer] 3. Aggiorna Il Mondo
> Output: conseguenze canonizzate, missioni aggiornate, prossime mosse e prossima sessione.
>
> `BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

## Prossima Azione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderActions(dv);
```

## Primo Avvio Minimo

```dataviewjs
const checks = [
  ["Plugin base", app.plugins.enabledPlugins.has("dataview") && app.plugins.enabledPlugins.has("obsidian-meta-bind-plugin") && app.plugins.enabledPlugins.has("templater-obsidian"), "Se non e pronto, apri Setup Guidato."],
  ["Aspetto", app.vault.getAbstractFileByPath(".obsidian/snippets/gdr-vault.css"), "Attiva lo snippet `gdr-vault` nelle impostazioni Aspetto."],
  ["Demo", !!app.vault.getAbstractFileByPath("Campagne/Demo - La Reliquia Spezzata.md"), "Apri la demo solo se vuoi vedere un esempio gia compilato."]
];

dv.table(["Controllo", "Stato", "Azione"], checks.map(([label, ok, text]) => [label, ok ? "Pronto" : "Da fare", text]));
```

## Strumenti Avanzati

> [!regia]- Apri solo quando servono
> `BUTTON[setup-guidato-risorse-setup-guidato]`
>
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> `BUTTON[party-control-hub-party-control]`
>
> `BUTTON[costruisci-mondo-hub-atlante-del-mondo-atlante-del-mondo]`
>
> `BUTTON[quality-report-risorse-quality-report]`
>
> `BUTTON[risorse-risorse-risorse]`
>
> `BUTTON[aiuto-risorse-faq]`

## Se Parti Da Zero

Apri [[Risorse/Setup Guidato]] solo per controllare che gli strumenti funzionino. Poi torna qui e usa **Prepara**.

La demo [[Demo - La Reliquia Spezzata]] serve a capire il risultato finale, non a navigare il vault ogni volta.
