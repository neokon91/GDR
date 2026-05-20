---
cssclasses:
  - indice
categoria: risorsa
tipo: indice connettore gpt
stato: pronto
is_code_search_indexed: true
---

# Indice Connettore GPT

Questa nota orienta un connettore GPT o un indice code search sul vault. Non e una guida utente: serve a far trovare rapidamente struttura, entry point e convenzioni operative.

## Entry Point Utente

- [[Inizia Qui]]
- [[README]]
- [[1. DM Dashboard]]
- [[Durante il Gioco]]
- [[Worldbuilder Dashboard]]
- [[Inbox/Inbox]]
- [[Mondi/Stato del Mondo]]
- [[z.bacheche/Post Sessione]]

## Entry Point Sviluppo

- [[Risorse/Sviluppo Vault]]
- [[Risorse/Controllo Vault]]
- [[Risorse/Plugin Attivi]]
- [[Risorse/Integrazioni Plugin]]
- [[CHANGELOG]]
- [[VERSION]]
- [[RELEASE]]

## Runtime E Automazioni

- `z.automazioni/session_context.js`: helper DataviewJS per sessione attiva, fallback, link, escape HTML e pagine collegate.
- `z.automazioni/helpers.js`: helper Templater, selettori, spostamento note, contesto sessione attiva.
- `z.automazioni/check_vault.js`: controllo qualita locale del vault, inclusi indice GPT, template, campi minimi, sessioni attive e note live.
- `z.automazioni/import_srd.js`: rigenerazione SRD; i mostri mantengono frontmatter `statblock: true` parsabile da Fantasy Statblocks.
- `z.automazioni/lore_capture.js`: creazione lore post-sessione e appunti live strutturati.
- `z.automazioni/live_evento.js`
- `z.automazioni/live_conseguenza.js`
- `z.automazioni/live_png.js`
- `z.automazioni/live_luogo.js`
- `z.automazioni/live_nota.js`

## Template Principali

- [[z.modelli/dm/Sessione]]
- [[z.modelli/Lore Capture]]
- [[z.modelli/Live Evento]]
- [[z.modelli/Live Conseguenza]]
- [[z.modelli/Live PNG]]
- [[z.modelli/Live Luogo]]
- [[z.modelli/Live Nota Grezza]]
- [[z.modelli/Evento Storico]]
- [[z.modelli/Personaggio Router]]
- [[z.modelli/Luogo Router]]
- [[z.modelli/Fazione Router]]

## Convenzioni Critiche

- Una sola sessione dovrebbe avere `attiva: true`.
- Se nessuna sessione e attiva, il runtime usa come fallback l'ultima sessione `pronto` o `preparazione`.
- `data_mondo` e il campo unico per date leggibili al tavolo in sessioni, lore capture ed eventi storici.
- Le note `Prova -` sono collaudi tecnici e non devono guidare il gioco.
- `Inbox` contiene appunti non canonici, lore da smistare e note live.
- `Mondi/Timeline` contiene eventi storicizzati.
- `SRD` e riferimento regolamentare generato, non contenuto canonico del mondo.

## Worldbuilding Engine

- [[Worldbuilder Dashboard]]: Atlante del Mondo, Poteri in Movimento, Relazioni PNG, Timeline Causale e Buchi Di Mondo.
- [[Mondi/Stato del Mondo]]: vista operativa filtrabile per mondo/campagna su eventi canonici, conseguenze aperte e problemi pratici.
- [[Mondi/Mondo]]: indice generale del contenuto canonico.
- [[Mondi/Luoghi/Luoghi]]: archivio luoghi.
- [[Mondi/Fazioni/Fazioni]] e [[Mondi/Religioni/Religioni]]: poteri politici, sociali e religiosi.
- [[Mondi/Personaggi/Personaggi]]: PNG, PG e relazioni.
- [[Mondi/Timeline/Timeline]]: eventi storicizzati e conseguenze.

## Cartelle Operative

- `Campagne`: campagne e avanzamento al tavolo.
- `Mondi`: contenuto canonico e worldbuilding.
- `Mondi/Sessioni`: preparazione, runtime e resoconti.
- `Mondi/Missioni`: obiettivi, trame e pressioni.
- `Mondi/Personaggi`: PG e PNG.
- `Mondi/Luoghi`: luoghi, regioni, insediamenti, dungeon.
- `Mondi/Fazioni` e `Mondi/Religioni`: poteri e fronti.
- `Mondi/Timeline`: eventi canonici, rumor, leggende e conseguenze.
- `Inbox`: appunti grezzi e cattura live.
- `Risorse`: guide, mappe, media, tabelle e documentazione.
- `z.modelli`: template Obsidian/Templater.
- `z.automazioni`: script Templater e script CLI.
- `z.bacheche`: kanban operative.
- `SRD`: riferimento D&D 5.2.1 generato.

## Controlli

Prima di considerare affidabile una modifica:

```bash
node z.automazioni/check_vault.js
```

Esito atteso:

```text
Vault OK
```
