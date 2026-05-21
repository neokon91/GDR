---
cssclasses:
  - indice
categoria: risorsa
tipo: handoff sviluppo
stato: pronto
---

# Next Phase Handoff

Direzione prodotto: **living modular narrative world system**.

GDR deve creare mondi persistenti, interconnessi, giocabili, riutilizzabili e pubblicabili. Il worldbuilding e il centro; il gameplay e il ciclo che modifica il mondo; le conseguenze sono il ponte tra sessione, canone, timeline e stato del mondo.

## Ruoli Di Valutazione

Usare [[CODEX_AGENTS]] come filtro per ogni modifica:

- **Worldbuilder Senior**: mondo profondo, modulare, pubblicabile.
- **DM Senior**: materiale giocabile, prep rapida, sessioni, avventure e one-shot.
- **Continuity Architect**: canone, conseguenze, world state, propagazione e timeline.

## Priorita Prossima Fase

1. Continuity engine.
2. Consequence propagation.
3. World state reattivo.
4. Relazioni e fazioni dinamiche.
5. Timeline causale persistente.
6. Modular content architecture.
7. Import/export e publication pipeline.

## Vincoli Architetturali

- YAML dichiara profili, campi, contratti e integrazioni.
- Jinja/TemplateFactory genera template Markdown statici.
- JS del vault contiene runtime, wizard, azioni e viste.
- D&D 5.5/SRD resta il profilo regolamentare principale.
- Le funzioni nuove devono generare impatto sistemico sul mondo, non solo utility DM.

## Blocker Gia Emerso

Errore Templater: `z.automazioni/avventura.js` falliva per `require("./adventure_shortcuts")` in runtime Obsidian. Correzione applicata: i wrapper Templater utente non devono dipendere da `require` relativo per moduli runtime caricati da Obsidian.

## Ordine Cartelle z.*

Problema: troppe cartelle `z.*` rendono sorgente e release meno leggibili.

Non fare un refactor cieco. Prima mappare tutti i riferimenti in:

- TemplateFactory `output.folder` e `templater_entry`.
- Meta Bind `templateFile`.
- Templater script folder.
- DataviewJS e JS Engine.
- release_clean.js.
- README e guide utente.

Direzione candidata: consolidare progressivamente in un solo namespace tecnico, per esempio `z.runtime/`, con sottocartelle per template, azioni, viste, basi, fileClass e bacheche. Il refactor va fatto solo con redirect/compatibilita o migrazione atomica verificata da `npm run check` e smoke Obsidian.

## Prima Azione Consigliata

Partire da una fase stretta: **Continuity Engine M6**.

Scopo: quando una sessione, evento o conseguenza cambia qualcosa, il vault deve proporre e tracciare quali note aggiornare: fazioni, regioni, PNG, missioni, relazioni, timeline, tracciati e campagne.

Non aggiungere dashboard nuove se una vista esistente puo mostrare il risultato.
