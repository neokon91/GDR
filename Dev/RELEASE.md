# Release

Questa checklist serve a preparare una copia pubblicabile del vault. Si esegue dal repository sorgente: la cartella `Dev/` non entra nella release utente.

Il percorso consegnabile standard e `npm run release:final`.

## Prima Della Release

1. Aggiorna [[VERSION]].
2. Aggiorna [[Dev/CHANGELOG]].
3. Crea la release finale standard:

```bash
npm run release:final
```

`release:final` rigenera i sorgenti, verifica versione, runtime, JS e diff, poi crea `dist/vault-gdr-clean` e `dist/vault-gdr-clean.zip` validando direttamente quell'artefatto.

Prima di pubblicare per utenti non tecnici, apri il vault sorgente in Obsidian con i plugin community installati localmente: i bundle ignorati da Git vengono copiati nella ZIP, cosi l'utente deve solo accettarli all'apertura.

4. Esegui `npm run check` solo per audit completo prima di tag/GitHub Release o dopo modifiche strutturali a pipeline, plugin, runtime o importatori.
5. Se serve costruire solo la copia pulita senza i controlli mirati:

```bash
npm run release:clean
```

6. Apri lo ZIP in Obsidian e fai lo smoke manuale sulle pagine elencate sotto.
7. Screenshot e GIF sono utili per pubblicazione e store page, ma non sostituiscono i gate tecnici o lo smoke manuale.
8. Crea tag o GitHub Release solo dopo controlli puliti.

## ZIP Utente


Non contiene materiali di sviluppo repository, issue template GitHub, roadmap interne, script CLI di import/release o plugin non abilitati. Per sviluppo e manutenzione si lavora tramite Git.

Non promettere che lo ZIP sia una app standalone, un rules engine completo o una ripubblicazione del regolamento 5.5e. E un vault Obsidian con workflow, template, automazioni e materiale SRD separato.

## Cosa Non Rimuovere

- `.obsidian/plugins/*/data.json`: contiene configurazioni generate per i plugin; i bundle plugin terzi sono input locale ignorato da Git e possono entrare solo nella ZIP finale.
- `.obsidian/snippets/gdr-vault.css`: definisce dashboard, callout e vista tavolo.
- `z.modelli`: template usati dai pulsanti, materializzati da TemplateFactory.
- `z.automazioni`: script Templater e controlli tecnici.
- `SRD`: riferimento regolamentare separato dal contenuto canonico, rigenerato nella release.

## Cosa Controllare A Mano

- `dist/vault-gdr-clean.zip` si apre su [[Inizia Qui]] con configurazione Obsidian gia inclusa.
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
