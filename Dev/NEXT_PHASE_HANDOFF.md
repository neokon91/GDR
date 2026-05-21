---
cssclasses:
  - indice
categoria: risorsa
tipo: handoff sviluppo
stato: pronto
---

# Next Phase Handoff

Direzione prodotto: **living modular narrative world system**.

GDR deve creare mondi persistenti, interconnessi, giocabili, riutilizzabili e pubblicabili. Il worldbuilding resta centrale; il gioco e il modo in cui il mondo cambia; le conseguenze collegano sessione, canone, timeline e stato del mondo.

## Stato Attuale

M6 Continuity Engine e stato implementato nel commit `3761c55`.

Completato:

- azioni Meta Bind per applicare conseguenze e propagare entita con `propagazione_stato`, `propagato_da`, `aggiornamenti_richiesti`, `ultima_propagazione`, `applicata_a`, pressione e prossima mossa opzionale;
- funzioni DataviewJS riusabili in `z.engine/session_views.js`: `renderContinuityQueue`, `renderPropagationTargets`, `renderContinuityGaps`;
- Motore Mondo Vivo e Cosa Succede Fuori Scena come superfici M6 principali, senza nuova dashboard;
- Post Sessione Guidato e Durante il Gioco collegati al flusso scelta -> conseguenza -> bersagli -> prossima mossa;
- TemplateFactory aggiornato per generare schede con tabs logici e callout custom funzionali, contenenti Meta Bind, Dataview, DataviewJS, Bases ed Excalidraw dove utile.

Warning noti:

- `Mondi/Luoghi/Porto Di Brumafonda.md`: impatto senza bersagli M6;
- `Mondi/Missioni/Recuperare La Campana Sommersa.md`: impatto senza bersagli M6;
- `Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md`: impatto senza bersagli M6.

Questi warning sono voluti: indicano contenuti demo da completare con `entita_impattate`, `propaga_a` o `applicata_a`.

## Filtro Decisionale

Usare [[CODEX_AGENTS]] per ogni modifica:

- **Worldbuilder Senior**: mondo profondo, modulare, pubblicabile.
- **DM Senior**: materiale giocabile, prep rapida, sessioni, avventure e one-shot.
- **Continuity Architect**: canone, conseguenze, world state, propagazione e timeline.

Ogni modifica deve servire almeno uno di questi assi. Evitare dashboard decorative, micro utility isolate, refactor estetici e strumenti DM senza impatto sul mondo.

## Prossima Fase Consigliata

Fase stretta: **M7 Plugin-Native Sheet System**.

Scopo: portare le schede generate a uno standard Obsidian-native professionale, sfruttando i plugin gia installati invece di aggiungere nuove viste.

Priorita:

1. Raffinare TemplateFactory per famiglia nota: sessione, luogo, fazione, PNG, relazione, tracciato, evento/conseguenza.
2. Rendere ogni tab una sezione esplorabile reale, non una divisione estetica.
3. Rendere ogni callout custom una superficie funzionale: contenuto, Meta Bind, Dataview, DataviewJS, Bases, Canvas, Excalidraw, Maps o Tasks.
4. Aggiungere controlli smoke sui template generati: ogni scheda lunga deve avere tabs, callout non vuoti, almeno un blocco dinamico e fallback Markdown.
5. Migliorare CSS/snippet solo dove serve leggibilita, densita operativa e chiarezza, non decorazione.

## Vincoli Tecnici

- YAML dichiara profili, campi, contratti e integrazioni.
- Jinja/TemplateFactory genera template Markdown statici.
- JS del vault contiene runtime, wizard, azioni e viste.
- I wrapper Templater utente non devono dipendere da `require` relativo.
- D&D 5.5/SRD resta il profilo regolamentare principale.
- Le nuove funzioni devono produrre impatto sistemico sul mondo.

## Non Fare Nella Prossima Fase

- Non creare nuove dashboard se una vista esistente puo ospitare il risultato.
- Non rifattorizzare le cartelle `z.*` senza mappa completa dei riferimenti.
- Non aggiungere callout con solo titolo.
- Non usare tabs come cosmetica: ogni tab deve contenere una funzione distinta.
- Non trasformare il vault in project management generico.

## Debito Separato

Il consolidamento delle cartelle `z.*` resta sospeso.

Prima di toccarlo, mappare:

- TemplateFactory `output.folder` e `templater_entry`;
- Meta Bind `templateFile`;
- Templater script folder;
- DataviewJS e JS Engine;
- `release_clean.js`;
- README e guide utente.

Un eventuale consolidamento verso `z.runtime/` va fatto solo con compatibilita o migrazione atomica verificata da `npm run check` e smoke Obsidian.
