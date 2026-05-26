---
categoria: sviluppo
tipo: smoke release
stato: pronto
---

# First Run Acceptance

Contratto di accettazione per dire che la release e provabile da un utente nuovo, non solo corretta come repository.

## Gate Automatico

Eseguire:

```bash
npm run check:first-run
```

Il gate rigenera `dist/vault-gdr-clean` con demo e verifica:

- zip valida;
- workspace aperto su `Inizia Qui.md` in preview;
- plugin community inclusi e configurati;
- Templater puntato solo a `z.automazioni/templater`;
- wrapper Templater esportati come funzioni;
- DataviewJS abilitato;
- Meta Bind con pulsanti e target first-run esistenti;
- Calendarium neutro;
- bookmark non tecnici e non rotti;
- pagine principali senza Templater visibile o link mancanti;
- script tecnici esclusi dalla release.

## Smoke Manuale Obsidian

Aprire `dist/vault-gdr-clean.zip` come nuovo vault pulito e seguire questo percorso:

1. Confermare plugin inclusi solo se la release arriva da fonte fidata.
2. Verificare apertura automatica su `Inizia Qui.md`.
3. Aprire `Demo Regno Di Prova.md`.
4. Aprire `Risorse/Prima Sessione In 15 Minuti.md`.
5. Premere un pulsante di navigazione verso `Risorse/Preparazione Sessione.md`.
6. Creare una nuova sessione da pulsante.
7. Aprire `Hub/Durante il Gioco.md`.
8. Registrare un appunto live o una scelta.
9. Aprire `Risorse/Post Sessione Guidato.md`.
10. Aprire `Hub/Cosa Succede Fuori Scena.md`.
11. Aprire `Hub/Vista Giocatori.md`.

## Errori Bloccanti

La release non e accettabile se compare anche uno solo di questi segnali nel percorso sopra:

- errore Templater;
- errore Meta Bind;
- errore Dataview o DataviewJS;
- blocco `BUTTON[...]` non renderizzato nelle pagine principali;
- blocco `INPUT[...]` non renderizzato dove serve modificare campi;
- codice Templater `<% ... %>` visibile;
- pagina iniziale in edit/source invece che preview;
- bookmark verso file mancante;
- cartella tecnica proposta come primo percorso utente;
- creazione nota che lascia template grezzo.

## Esito Atteso

Un utente nuovo deve riuscire a:

- capire da dove iniziare;
- aprire la demo;
- creare o preparare una sessione;
- passare alla vista live;
- chiudere la sessione;
- vedere conseguenze e materiale player-safe;
- ignorare completamente cartelle `z.*`, YAML tecnico e documentazione sviluppo.
