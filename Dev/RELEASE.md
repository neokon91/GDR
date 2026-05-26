# Release

Questa checklist serve a preparare una copia pubblicabile del vault. Si esegue dal repository sorgente: la cartella `Dev/` non entra nella release utente.

## Prima Della Release

1. Apri [[Inizia Qui]] e verifica che i pulsanti portino alle pagine giuste.
2. Apri [[1. DM Dashboard]], [[Durante il Gioco]], [[Hub/Party Control]], [[Atlante del Mondo]], [[Geopolitical Dashboard]], [[Motore Mondo Vivo]], [[Campagna da Ambientazione]] e [[Vista Giocatori]].
3. Apri [[Risorse/Controllo Vault]] e [[Risorse/Quality Report]] e risolvi problemi operativi importanti.
4. Esegui [[Dev/Smoke Demo Finale]] dal repository sorgente se stai preparando la release 1.0 con demo inclusa. La demo utente e generata nello ZIP pulito da `npm run generate:demo-world`.
5. Acquisisci almeno cinque screenshot: `Inizia Qui`, `Vista Giocatori`, `Atlante del Mondo`, `Party Control`, `Quality Report`.
6. Registra una GIF breve del flusso `Inizia Qui` -> `Durante il Gioco` -> `Vista Giocatori`.
7. Esegui:

```bash
npm run check
```

8. Se la release include la demo, genera la demo dopo `npm run release:clean` e verifica che `npm run check:demo-contract` e `npm run check:smoke` siano verdi.
9. Aggiorna [[VERSION]].
10. Aggiorna [[Dev/CHANGELOG]].
11. Crea la release utente:

```bash
npm run release:clean
```

Per creare direttamente una release con demo utente inclusa nello ZIP:

```bash
npm run release:demo
```

12. Crea tag o GitHub Release solo dopo controlli puliti.

## ZIP Utente


Non contiene materiali di sviluppo repository, issue template GitHub, roadmap interne, script CLI di import/release o plugin non abilitati. Per sviluppo e manutenzione si lavora tramite Git.

## Cosa Non Rimuovere

- `.obsidian/plugins`: contiene plugin e configurazioni necessarie al comportamento custom del vault.
- `.obsidian/snippets/gdr-vault.css`: definisce dashboard, callout e vista tavolo.
- `z.modelli`: template usati dai pulsanti.
- `z.automazioni`: script Templater e controlli tecnici.
- `SRD`: riferimento regolamentare separato dal contenuto canonico.

## Cosa Controllare A Mano

- `dist/vault-gdr-clean.zip` si apre su [[Inizia Qui]] con configurazione Obsidian gia inclusa.
- Se generata, `Demo Regno Di Prova.md` esiste nella release pulita e collega mondo, campagna, sessione e materiale player-safe.
- Le dashboard non mostrano errori Dataview.
- I pulsanti Meta Bind aprono o creano note.
- La vista `Durante il Gioco` mostra una sessione attiva se esiste una sessione con `attiva`, `in corso`, `pronto` o `preparazione`.
- [[Hub/Party Control]] mostra PG, HP, missioni, ricompense e flags senza errori Dataview.
- [[Vista Giocatori]] mostra solo materiale pubblico, emerso o consegnato e il controllo sicurezza non segnala segreti esposti.
- [[Risorse/Quality Report]] mostra copertura, buchi operativi e materiale screenshot-ready.
- [[Mondi/Stato del Mondo]] mostra conseguenze, PNG cambiati, luoghi in crisi, fazioni in movimento, relazioni, propagazione e missioni influenzate senza errori Dataview.
- [[Mondi/Timeline/Timeline]] mostra eventi canonici e lore da sessione.
- [[Geopolitical Dashboard]] mostra territori politici, relazioni diplomatiche, risorse strategiche e buchi geopolitici senza errori Dataview.
- [[Motore Mondo Vivo]] mostra event propagation, faction dynamics, relationship graph e continuita aperte senza errori Dataview.
- Il README resta leggibile per utenti non tecnici.

## Dopo La Release

- Aggiorna il changelog con eventuali fix.
- Tieni le modifiche tecniche documentate in [[Dev/Sviluppo Vault]].
- Pubblica lo ZIP generato da `dist/vault-gdr-clean.zip`.
- Per sviluppo e manutenzione usa il repository Git, non uno ZIP.
