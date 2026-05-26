---
cssclasses:
  - dashboard
  - gdr-start-here
categoria: risorsa
tipo: onboarding
stato: pronto
---
# Inizia Qui

Questa e la pagina da usare quando non sai cosa aprire. Il vault distribuito e gia configurato: segui il percorso dall'alto verso il basso, crea o scegli un mondo, prepara una sessione, gioca, poi Aggiorna Il Mondo.

## Primo Passo

> [!scena] Percorso guidato
> Crea Il Mondo, poi Trasforma In Gioco. Se Obsidian chiede di abilitare gli strumenti inclusi nel vault, conferma solo se hai scaricato questa copia dalla release ufficiale.

<!-- workflow:quick_actions:start onboarding_utente -->
> [!regia] Azioni rapide
> Partire da zero con il vault gia configurato, senza scegliere tra troppe dashboard.
>
> Plugin coinvolti: `Meta Bind`, `Dataview`, `Templater`.
>
> **Crea mondo** - non hai ancora un mondo giocabile
> `BUTTON[nuovo-mondo-homebrew]`
>
> **Prepara sessione** - hai un mondo o almeno un'idea pronta da giocare
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Gioca** - sei al tavolo o vuoi vedere il cockpit live
> `BUTTON[gioca-hub-durante-il-gioco-durante-il-gioco]`
>
> **Chiudi e aggiorna** - la sessione e finita e devi decidere conseguenze
> `BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`
>
> [!regia]- Se ti perdi
> Aprire solo le viste di supporto, non nuove strade parallele.
>
> **Recupero strumenti** - pulsanti, tabelle o pagina iniziale non rispondono
> `BUTTON[setup-guidato-risorse-setup-guidato]`
>
> **Prima sessione in 15 minuti** - vuoi giocare subito senza completare tutto
> `BUTTON[prima-sessione-in-15-minuti-risorse-prima-sessione-in-15-minuti]`
>
> **Worldbuilder** - vuoi espandere il mondo dopo il primo giro
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> **Bibbia del mondo** - vuoi consolidare tono e canone
> `BUTTON[bibbia-del-mondo-bibbia-del-mondo-2]`
>
> **Vista giocatori** - devi mostrare materiale senza segreti DM
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`
>
> **Report qualita** - vuoi capire cosa manca nel vault
> `BUTTON[quality-report-risorse-quality-report]`
>
> **Aiuto** - non capisci cosa fare o una vista non risponde
> `BUTTON[aiuto-risorse-faq]`
<!-- workflow:quick_actions:end onboarding_utente -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "onboarding_utente");
```

## Cosa Fare Adesso

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderActiveSessionBanner(dv);
gdr.renderActions(dv);
```

## Vault Pronto

```dataviewjs
const enabled = id => app.plugins.enabledPlugins.has(id);
const exists = path => !!app.vault.getAbstractFileByPath(path);
const ready = enabled("obsidian-meta-bind-plugin") && enabled("templater-obsidian") && enabled("dataview") && exists(".obsidian/snippets/gdr-vault.css");
const checks = [
  ["Stato", ready, ready ? "Puoi iniziare da Crea mondo o Prepara sessione." : "Apri Setup Guidato solo per recuperare strumenti disabilitati."],
  ["Percorso rapido", exists("Risorse/Prima Sessione In 15 Minuti.md"), "Disponibile se vuoi giocare subito."]
];

dv.table(["Area", "Stato", "Prossimo passo"], checks.map(([label, ok, text]) => [label, ok ? "Pronto" : "Da controllare", text]));
```

## Se I Pulsanti Non Funzionano

| Cosa vuoi fare | Apri |
| --- | --- |
| Controllare gli strumenti | [[Risorse/Setup Guidato]] |
| Giocare con il minimo | [[Risorse/Prima Sessione In 15 Minuti]] |
| Preparare la sessione | [[Risorse/Preparazione Sessione]] |
| Giocare al tavolo | [[Hub/Durante il Gioco]] |
| Chiudere la sessione | [[Risorse/Post Sessione Guidato]] |
| Vedere cosa reagisce | [[Hub/Cosa Succede Fuori Scena]] |

Ignora cartelle `z.*`, file tecnici e impostazioni interne finche questa pagina ti dice cosa fare dopo.
