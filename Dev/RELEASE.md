# Release

Questa checklist serve a preparare una copia pubblicabile del vault. Si esegue dal repository sorgente: la cartella `Dev/` non entra nella release utente.

## Prima Della Release

1. Se hai modificato YAML, Jinja o generatori, esegui `npm run sync:sources`.
2. Esegui:

```bash
npm run check
```

3. Aggiorna [[VERSION]].
4. Aggiorna [[Dev/CHANGELOG]].
5. Crea la release utente senza demo:

```bash
npm run release:clean
```

Oppure crea direttamente la release con demo utente inclusa:

```bash
npm run release:demo
```

6. Se la release include la demo, esegui [[Dev/Smoke Demo Finale]] sulla release generata. Il percorso consegnabile e `npm run release:demo`; `npm run generate:demo-world` e solo uno strumento interno di manutenzione.
7. Apri lo ZIP in Obsidian e fai lo smoke manuale sulle pagine elencate sotto.
8. Screenshot e GIF sono utili per pubblicazione e store page, ma non sostituiscono i gate tecnici o lo smoke manuale.
9. Crea tag o GitHub Release solo dopo controlli puliti.

## ZIP Utente


Non contiene materiali di sviluppo repository, issue template GitHub, roadmap interne, script CLI di import/release o plugin non abilitati. Per sviluppo e manutenzione si lavora tramite Git.

Non promettere che lo ZIP sia una app standalone, un rules engine completo o una ripubblicazione del regolamento 5.5e. E un vault Obsidian con workflow, template, automazioni e materiale SRD separato.

## Cosa Non Rimuovere

- `.obsidian/plugins`: contiene plugin e configurazioni necessarie al comportamento custom del vault.
- `.obsidian/snippets/gdr-vault.css`: definisce dashboard, callout e vista tavolo.
- `z.modelli`: template usati dai pulsanti, materializzati da TemplateFactory.
- `z.automazioni`: script Templater e controlli tecnici.
- `SRD`: riferimento regolamentare separato dal contenuto canonico, rigenerato nella release.

## Cosa Controllare A Mano

- `dist/vault-gdr-clean.zip` si apre su [[Inizia Qui]] con configurazione Obsidian gia inclusa.
- Se generata, `Demo Regno Di Prova.md` esiste nella release pulita e collega mondo, regione giocabile, campagna, sessione e materiale player-safe.
- Le dashboard non mostrano errori Dataview.
- I pulsanti Meta Bind aprono o creano note.
- [[Risorse/Regione Giocabile]] mostra azioni comprensibili, non sintassi tecnica, e porta verso luogo, fazione, conflitto, missione, sessione e materiali player-safe.
- La vista `Durante il Gioco` mostra una sessione attiva se esiste una sessione con `attiva`, `in corso`, `pronto` o `preparazione`.
- [[Hub/Party Control]] mostra PG, HP, missioni, ricompense e flags senza errori Dataview.
- [[Vista Giocatori]] mostra solo materiale pubblico, emerso o consegnato e il controllo sicurezza non segnala segreti esposti.
- [[Risorse/Quality Report]] mostra copertura, buchi operativi e materiale pronto da condividere.
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
