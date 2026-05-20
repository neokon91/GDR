---
cssclasses:
  - dashboard
categoria: risorsa
tipo: onboarding
stato: pronto
---
# Inizia Qui

Apri, scegli, gioca. Questa e la home dell'app: mostra lo stato reale del vault e la prossima azione sensata.

## Stato App

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderHome(dv);
```

## Cosa Vuoi Fare?

`BUTTON[prepara-hub-1-dm-dashboard-1-dm-dashboard]`

`BUTTON[crea-campagna-hub-campagna-da-ambientazione-campagna-da-ambientazione]`

`BUTTON[prima-sessione-risorse-prima-sessione-in-15-minuti]`

`BUTTON[gioca-hub-durante-il-gioco-durante-il-gioco]`

`BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`

`BUTTON[party-control-hub-party-control]`

`BUTTON[costruisci-mondo-hub-atlante-del-mondo-atlante-del-mondo]`

`BUTTON[quality-report-risorse-quality-report]`

`BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

`BUTTON[aiuto-risorse-faq]`

`BUTTON[risorse-risorse-risorse]`

`BUTTON[setup-guidato-risorse-setup-guidato]`

`BUTTON[creazione-entita-risorse-creazione-guidata-entita]`

`BUTTON[worldbuilding-profondo-risorse-worldbuilding-profondo]`

## Primo Avvio

```dataviewjs
const checks = [
  ["Fiducia vault", true, "Conferma gli strumenti inclusi solo se hai scaricato il vault da una fonte affidabile."],
  ["Snippet CSS", app.vault.getAbstractFileByPath(".obsidian/snippets/gdr-vault.css") && document.body.className.includes("gdr-"), "Attiva `gdr-vault` in Impostazioni > Aspetto > Snippet CSS."],
  ["Plugin pronti", app.plugins.enabledPlugins.has("dataview") && app.plugins.enabledPlugins.has("obsidian-meta-bind-plugin") && app.plugins.enabledPlugins.has("templater-obsidian"), "Apri Setup Guidato se pulsanti o tabelle non rispondono."],
  ["Demo disponibile", !!app.vault.getAbstractFileByPath("Campagne/Demo - La Reliquia Spezzata.md"), "Apri la demo clonabile per vedere il flusso completo."],
  ["Portale giocatori", !!app.vault.getAbstractFileByPath("Hub/Vista Giocatori.md"), "Controlla cosa e condivisibile prima di esportare o mostrare lo schermo."],
  ["Quality report", !!app.vault.getAbstractFileByPath("Risorse/Quality Report.md"), "Usalo per trovare buchi, note incomplete e materiale screenshot-ready."]
];

dv.table(["Step", "Stato", "Prossima azione"], checks.map(([label, ok, text]) => [label, ok ? "Pronto" : "Da fare", text]));
```

1. Apri [[Risorse/Setup Guidato]] per vedere se pulsanti, tabelle, creature, tiri e calendario sono pronti.
2. Apri [[Risorse/Prima Sessione In 15 Minuti]] se vuoi un percorso pratico senza leggere tutta la documentazione.
3. Apri [[Demo - La Reliquia Spezzata]] come campagna dimostrativa gia collegata.
4. Apri [[Hub/1. DM Dashboard|1. DM Dashboard]] per creare campagne, sessioni, missioni, clock e incontri.
5. Apri [[Hub/Party Control]] per tenere il party sotto mano.
6. Apri [[Hub/Vista Giocatori]] per controllare materiale pubblico e handout.
7. Apri [[Risorse/Quality Report]] prima di pubblicare screenshot, demo o release.

## Se Vedi Questo, Sei Pronto

- I pulsanti qui sopra aprono altre pagine.
- Le tabelle nelle dashboard mostrano righe o messaggi leggibili.
- Le pagine `Prova -` compaiono solo nelle aree di test e non nelle viste operative.
- [[Risorse/Controllo Vault]] non segnala problemi importanti.

## Vuoi Vedere Un Esempio?

Apri [[Demo - La Reliquia Spezzata]]. E una mini-campagna gia collegata a mondo, sessioni, PNG, luoghi, fazione, missione, tracciati, incontro, oggetto e dispensa. Segui la sezione "Tutorial Operativo" dentro la demo per vedere il flusso completo.

## Cosa Ignorare All'Inizio

- Cartelle `z.*`: sono il motore interno del vault. Ignorale.
- `SRD`: riferimento regolamentare, non contenuto canonico della tua campagna.
- Note `Prova -`: esempi e controlli, non materiale da giocare.
