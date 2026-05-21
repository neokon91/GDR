---
cssclasses:
  - dashboard
  - gdr-start-here
categoria: risorsa
tipo: onboarding
stato: pronto
---
# Inizia Qui

Scegli una sola azione e parti da lì. Il vault serve prima a creare un mondo homebrew giocabile; poi lo trasforma in campagne, sessioni al tavolo e conseguenze che restano nel mondo.

## Percorso Minimo

> [!scena] Se non sai da dove partire
> 1. Crea o apri un mondo.
> 2. Prepara una sessione collegata a quel mondo.
> 3. Gioca dal cockpit del tavolo.
> 4. Chiudi la sessione aggiornando conseguenze e recap.

## Flusso Principale

> [!luogo] Passo 1 - Crea Il Mondo
> Risultato: un Codex homebrew con identità, luoghi, poteri, culture, misteri, mappe e connessioni vive.
>
> `BUTTON[nuovo-mondo-homebrew]`
>
> Dashboard mondo:
>
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> `BUTTON[bibbia-del-mondo-bibbia-del-mondo-2]`

> [!scena] Passo 2 - Trasforma In Gioco
> Risultato: una campagna, un'avventura o una sessione collegata ad almeno tre ancore del mondo.
>
> `BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
>
> Preparazione:
>
> `BUTTON[campagna-da-ambientazione-campagna-da-ambientazione]`
>
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`

> [!incontro] Passo 3 - Gioca Al Tavolo
> Risultato: appunti di sessione, clock aggiornati, dispense consegnate e decisioni registrate.
>
> `BUTTON[gioca-hub-durante-il-gioco-durante-il-gioco]`

> [!timer] Passo 4 - Aggiorna Il Mondo
> Risultato: conseguenze canonizzate, missioni aggiornate, prossime mosse e apertura della sessione successiva.
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
  ["Strumenti base", app.plugins.enabledPlugins.has("dataview") && app.plugins.enabledPlugins.has("obsidian-meta-bind-plugin") && app.plugins.enabledPlugins.has("templater-obsidian"), "Se non è pronto, apri Setup Guidato."],
  ["Aspetto", app.vault.getAbstractFileByPath(".obsidian/snippets/gdr-vault.css"), "Attiva lo snippet `gdr-vault` nelle impostazioni Aspetto."],
];

dv.table(["Controllo", "Stato", "Azione"], checks.map(([label, ok, text]) => [label, ok ? "Pronto" : "Da fare", text]));
```

## Strumenti Avanzati

> [!regia]- Apri solo quando servono
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

`BUTTON[setup-guidato-risorse-setup-guidato]`
