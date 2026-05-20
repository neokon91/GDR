---
cssclasses:
  - dashboard
  - gdr-start-here
categoria: risorsa
tipo: onboarding
stato: pronto
---
# Inizia Qui

Scegli una cosa sola. Il vault serve prima a creare un mondo homebrew giocabile, poi a trasformarlo in campagne, avventure, sessioni live e conseguenze persistenti.

## Flusso Principale

> [!luogo] 1. Crea Il Mondo
> Output: un Codex homebrew con identità, luoghi, poteri, culture, misteri, mappe e connessioni vive.
>
> `BUTTON[nuovo-mondo-homebrew]`
>
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> `BUTTON[bibbia-del-mondo-bibbia-del-mondo-2]`

> [!scena] 2. Trasforma In Gioco
> Output: campagna, avventura o sessione radicata in almeno tre ancore del mondo.
>
> `BUTTON[campagna-da-ambientazione-campagna-da-ambientazione]`
>
> `BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
>
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`

> [!incontro] 3. Gioca Live
> Output: appunti live, clock aggiornati, handout consegnati e decisioni prese al tavolo.
>
> `BUTTON[gioca-hub-durante-il-gioco-durante-il-gioco]`

> [!timer] 4. Aggiorna Il Mondo
> Output: conseguenze canonizzate, missioni aggiornate, prossime mosse, Codex aggiornato e prossima sessione.
>
> `BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

## Prossima Azione

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderActiveSessionBanner(dv);
gdr.renderActions(dv);
```

## Primo Avvio Minimo

```dataviewjs
const checks = [
  ["Plugin base", app.plugins.enabledPlugins.has("dataview") && app.plugins.enabledPlugins.has("obsidian-meta-bind-plugin") && app.plugins.enabledPlugins.has("templater-obsidian"), "Se non e pronto, apri Setup Guidato."],
  ["Aspetto", app.vault.getAbstractFileByPath(".obsidian/snippets/gdr-vault.css"), "Attiva lo snippet `gdr-vault` nelle impostazioni Aspetto."],
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
> `BUTTON[quality-report-risorse-quality-report]`
>
> `BUTTON[risorse-risorse-risorse]`
>
> `BUTTON[aiuto-risorse-faq]`

## Se Parti Da Zero

Apri [[Risorse/Setup Guidato]] solo per controllare che gli strumenti funzionino. Poi torna qui e usa **Crea Il Mondo**.
