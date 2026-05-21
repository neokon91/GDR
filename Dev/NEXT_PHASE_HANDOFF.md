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
M7 Plugin-Native Sheet System e stato implementato nel commit `adae038`.
I warning demo M6 sono stati chiusi nel commit `243f196`.

Completato:

- azioni Meta Bind per applicare conseguenze e propagare entita con `propagazione_stato`, `propagato_da`, `aggiornamenti_richiesti`, `ultima_propagazione`, `applicata_a`, pressione e prossima mossa opzionale;
- funzioni DataviewJS riusabili in `z.engine/session_views.js`: `renderContinuityQueue`, `renderPropagationTargets`, `renderContinuityGaps`, `renderM7FamilyCards` e viste M7 sessione;
- Motore Mondo Vivo e Cosa Succede Fuori Scena come superfici M6 principali, senza nuova dashboard;
- Post Sessione Guidato e Durante il Gioco collegati al flusso scelta -> conseguenza -> bersagli -> prossima mossa;
- TemplateFactory aggiornata per sessione, luogo, fazione, PNG, relazione, tracciato ed evento/conseguenza con tabs logici, callout funzionali, Meta Bind, Dataview, DataviewJS, Bases, Tasks, Maps, Excalidraw e Canvas dove utile;
- check automatici M7 sui template generati: schede lunghe con tabs, callout non vuoti, blocchi dinamici e fallback Markdown;
- disciplina zero-warning: `npm run check` deve fallire se `check_vault.js` produce warning.

Warning noti: **nessuno**.

## Filtro Decisionale

Usare [[CODEX_AGENTS]] per ogni modifica:

- **Worldbuilder Senior**: mondo profondo, modulare, pubblicabile.
- **DM Senior**: materiale giocabile, prep rapida, sessioni, avventure e one-shot.
- **Continuity Architect**: canone, conseguenze, world state, propagazione e timeline.

Ogni modifica deve servire almeno uno di questi assi. Evitare dashboard decorative, micro utility isolate, refactor estetici e strumenti DM senza impatto sul mondo.

## Prossima Discussione Consigliata

Focus: [[Prossima Discussione - YAML Entita Fantasy]].

Scopo: concentrare la prossima sessione di lavoro sulla profondita delle entita fantasy governata da YAML: campi, profili frontmatter, prompt runtime, sezioni, tabs, callout, Meta Bind, Dataview, Bases, mappe e fallback devono essere contratti leggibili prima di diventare template o runtime.

Prima famiglia consigliata: **luogo + fazione + missione + tracciato**, per collegare worldbuilding, gioco al tavolo e continuita.

Regola: niente nuove dashboard; migliorare prima il layer dichiarativo e poi materializzare.

## Prossima Fase Consigliata

Fase stretta: **M8 Release Evidence And Zero-Warning Discipline**.

Scopo: rendere la 1.0 verificabile come prodotto consegnabile, non solo come repo che passa test statici.

Priorita:

1. Rendere ogni warning un blocker, senza eccezioni silenziose.
2. Aggiornare [[Dev/Smoke Demo Finale]] con evidenze reali dei flussi: Inizia Qui, crea mondo, prepara sessione, gioca live, post-sessione, vista giocatori, mappe.
3. Aggiungere controlli automatici contro handoff o changelog obsoleti quando una milestone viene chiusa.
4. Collegare le evidenze visuali a una release pulita verificabile con `npm run release:clean`.
5. Tenere M8 fuori da nuove dashboard: deve rafforzare affidabilita, consegna e regressioni.

## Vincoli Tecnici

- YAML dichiara profili, campi, contratti e integrazioni.
- Jinja/TemplateFactory genera template Markdown statici.
- JS del vault contiene runtime, wizard, azioni e viste.
- I wrapper Templater utente non devono dipendere da `require` relativo.
- D&D 5.5/SRD resta il profilo regolamentare principale.
- Le nuove funzioni devono produrre impatto sistemico sul mondo.
- `npm run check` deve restare senza warning.

## Non Fare Nella Prossima Fase

- Non creare nuove dashboard se una vista esistente puo ospitare il risultato.
- Non rifattorizzare le cartelle `z.*` senza mappa completa dei riferimenti.
- Non aggiungere callout con solo titolo.
- Non usare tabs come cosmetica: ogni tab deve contenere una funzione distinta.
- Non trasformare il vault in project management generico.
- Non degradare warning a rumore accettato.

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
