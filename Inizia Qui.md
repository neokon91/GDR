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

`BUTTON[costruisci-mondo-hub-atlante-del-mondo-atlante-del-mondo]`

`BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`

`BUTTON[aiuto-risorse-faq]`

`BUTTON[risorse-risorse-risorse]`

`BUTTON[setup-guidato-risorse-setup-guidato]`

`BUTTON[creazione-entita-risorse-creazione-guidata-entita]`

`BUTTON[worldbuilding-profondo-risorse-worldbuilding-profondo]`

## Primo Avvio

1. Se Obsidian chiede se fidarsi degli strumenti inclusi nel vault, conferma solo se hai scaricato il vault da una fonte affidabile.
2. Vai in **Impostazioni > Aspetto > Snippet CSS** e attiva `gdr-vault`; se non compare, ricarica gli snippet.
3. Apri [[Risorse/Setup Guidato]] per vedere se pulsanti, tabelle, creature, tiri e calendario sono pronti.
4. Apri [[Risorse/Primo Avvio Strumenti]] solo se qualcosa non funziona.
5. Apri [[Risorse/Prima Sessione In 15 Minuti]] se vuoi un percorso pratico senza leggere tutta la documentazione.
6. Apri [[Hub/1. DM Dashboard|1. DM Dashboard]] per creare campagne, sessioni, missioni, clock e incontri.
7. Apri una sessione e usa il toggle `attiva` per indicare quale e al tavolo.
8. Apri [[Hub/Durante il Gioco|Durante il Gioco]] quando sei al tavolo.
9. Apri [[Risorse/Post Sessione Guidato]] dopo la partita.
10. Apri [[Cosa Succede Fuori Scena]] per decidere chi reagisce, quali clock avanzano e cosa entra nella prossima sessione.
11. Apri [[Hub/Worldbuilder Dashboard|Worldbuilder Dashboard]] quando vuoi creare mondi, luoghi, PNG, fazioni, creature e oggetti.
12. Apri [[Motore Mondo Vivo]] quando una scelta, una guerra, una religione, una fazione o un evento storico deve propagarsi nel mondo e pesare sulle prossime sessioni.
13. Apri [[Geopolitical Dashboard]] quando il conflitto riguarda stati, confini, risorse strategiche, trattati o legittimita politica.
14. Apri [[Risorse/Risorse]] quando cerchi guide, mappe, immagini, audio, video, tabelle o aiuto.

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
