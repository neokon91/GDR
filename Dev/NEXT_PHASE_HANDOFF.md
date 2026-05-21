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
- M8/M9 hanno chiuso release evidence, sicurezza player-facing, percorso minimo di [[Inizia Qui]], proprietà collassate su dashboard/indici e gate anti-segreti globale.
- M10 ha consolidato il contratto architetturale in [[Dev/README]], reso [[Dev/README]] indice canonico di sviluppo, dichiarato `continuity_rules` in `workflows.yaml` e separato recap pubblico da pubblicazione della sessione.
- M11 ha portato il contratto dichiarativo oltre missione/tracciato/fazione/luogo: `entity_depth.yaml`, `frontmatter_profiles.yaml`, `runtime_profiles.yaml`, `sections.yaml`, `tabs.yaml`, `metabind_inputs.yaml`, `dataview_blocks.yaml` e `workflows.yaml` coprono anche incontro, creatura e oggetto come materiale D&D 5.5 collegato al mondo.
- `z.fileclass/incontro.md` e `z.bases/Incontri.base` espongono i campi M11 necessari a gancio, uso al tavolo, ricompense, sessioni, prossima mossa, `entita_impattate` e `propaga_a`.
- `z.engine/session_views.js` legge la pipeline D&D 5.5 tramite `renderDnd55MaterialPipeline` e `renderCombatReadiness`; la fixture M11 resta prova tecnica, non demo finale.
- Taglio runtime avviato: mappe in `z.engine/session_maps.js`, pipeline D&D in `z.engine/session_dnd.js`, player view in `z.engine/session_player.js`, bridge pubblico ancora in `z.engine/session_views.js`.
- Valore plugin reso operativo: [[Risorse/Mappe/Mappe]] mostra la prossima azione mappa per la sessione, [[Risorse/Task DM]] separa preparazione e post-sessione dalle bacheche Kanban.
- Calendarium, Media Extended e Fantasy Content Generator hanno viste operative: [[Mondi/Calendario]] mostra la prossima scadenza narrativa, [[Risorse/Media Scene]] mostra media per sessione attiva, [[Risorse/Smistamento Bozze Generate]] mostra la prossima bozza da decidere.

Warning noti: **nessuno**.

## Filtro Decisionale

Usare [[CODEX_AGENTS]] per ogni modifica:

- **Worldbuilder Senior**: mondo profondo, modulare, pubblicabile.
- **DM Senior**: materiale giocabile, prep rapida, sessioni, avventure e one-shot.
- **Continuity Architect**: canone, conseguenze, world state, propagazione e timeline.

Ogni modifica deve servire almeno uno di questi assi. Evitare dashboard decorative, micro utility isolate, refactor estetici e strumenti DM senza impatto sul mondo.

## Prossima Discussione Consigliata

Focus: [[Prossima Discussione - YAML Entita Fantasy]].

Scopo: entrare nella prossima sessione con interventi concreti, non micro-polish. La discussione deve scegliere come implementare M11: entita vive end-to-end, pipeline homebrew D&D 5.5 collegata al mondo e simulazione narrativa leggera.

Prima catena consigliata: **missione + tracciato + fazione + luogo**, usando fixture o demo generata da script, non note demo mantenute a mano.

Regola: niente nuove dashboard; migliorare prima il layer dichiarativo e poi materializzare.

## Prossima Fase Consigliata

Fase stretta: **M11 Pipeline Homebrew D&D 5.5 E Continuita Di Mondo**.

Scopo: rendere verificabile la catena scelta dei giocatori -> evento -> conseguenza -> propagazione -> dashboard -> prossima sessione, senza cambiare architettura e senza sistemi fuori Obsidian.

Priorita:

1. Validare M11 su fixture tecnica generata in `dist/`, senza anticipare la demo finale.
2. Aggiornare `Stato del Mondo`, `Cosa Succede Fuori Scena`, `Preparazione Sessione`, `Durante il Gioco` e `Post Sessione Guidato` solo dove il contratto M11 non e ancora visibile.
3. Trasformare il riesame plugin in interventi mirati solo dove accelera Crea -> Prepara -> Gioca -> Aggiorna.
4. Verificare visualmente il primo utilizzo su [[Inizia Qui]] e [[Risorse/Setup Guidato]] senza generare demo finale.
5. Proseguire il taglio di `z.engine/session_views.js` su sessione e continuita prima di aggiungere nuove viste.

## Vincoli Tecnici

- YAML dichiara profili, campi, contratti e integrazioni.
- Jinja/TemplateFactory genera template Markdown statici.
- JS del vault contiene runtime, wizard, azioni e viste.
- I wrapper Templater utente non devono dipendere da `require` relativo.
- D&D 5.5/SRD resta il profilo regolamentare principale.
- Le nuove funzioni devono produrre impatto sistemico sul mondo.
- `npm run check` deve restare senza warning.
- La demo finale e lo smoke visuale su release generata restano l'ultimo passaggio pre-release.

## Non Fare Nella Prossima Fase

- Non creare nuove dashboard se una vista esistente puo ospitare il risultato.
- Non rifattorizzare le cartelle `z.*` senza mappa completa dei riferimenti.
- Non aggiungere callout con solo titolo.
- Non usare tabs come cosmetica: ogni tab deve contenere una funzione distinta.
- Non trasformare il vault in project management generico.
- Non degradare warning a rumore accettato.
- Non trattare homebrew D&D 5.5 come compendio scollegato dal mondo.
- Non introdurre mini linguaggi custom in YAML.

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
