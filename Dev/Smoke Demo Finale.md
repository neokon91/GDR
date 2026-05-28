---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: sospeso
---

# Smoke Demo Finale

La demo finale non vive più come note sorgente mantenute a mano.

Regola attiva: la demo finale non vive nel sorgente. Va generata da script dentro `dist/` dopo la creazione della release pulita. Il contratto dichiarativo vive in `Dev/TemplateFactory/modules/demo_contract.yaml` ed e verificato da `npm run check:demo-contract`.

La fixture di continuita generata da `npm run generate:demo-fixture` resta prova tecnica: scelta -> conseguenza -> propagazione -> materiale D&D collegato al mondo. La demo utente "Regno di Prova" si genera con `npm run generate:demo-world` dentro `dist/vault-gdr-clean`, non si mantiene in `Mondi/`.

## Stato

- [x] Demo sorgente rimossa dal vault.
- [x] Gate statico convertito su onboarding, vista giocatori, live e post-sessione.
- [x] Le note demo manuali storiche sono vietate dal controllo vault.
- [x] Script di fixture continuita tecnica disponibile: `Dev/TemplateFactory/tools/generate_demo_fixture.js`.
- [x] Gate continuita tecnico disponibile: `npm run check:continuity`.
- [x] Contratto demo dichiarativo disponibile: `demo_contract.yaml`, con generatori `generate:demo-fixture` e `generate:demo-world`.
- [x] Script demo utente disponibile: `Dev/TemplateFactory/tools/generate_demo_world.js`.
- [x] `npm run check:demo-contract` verifica che la demo generata copra scenario minimo, campi di flusso e materiale player-safe.
- [ ] Generare scenario demo nella release pulita prima dello smoke visuale finale.
- [ ] Eseguire smoke visuale sulla release generata come ultimo passaggio pre-release.

## Regola Per La Fase Finale

La demo finale deve essere generata da script e poi verificata, non corretta nota per nota.

`npm run generate:demo-world -- --out dist/vault-gdr-clean --force` produce almeno:

- mondo;
- campagna;
- luogo;
- fazione;
- missione;
- sessione;
- tracciato;
- incontro;
- creatura o minaccia;
- oggetto o ricompensa;
- mappa/dispensa player-safe;
- conseguenza propagabile.

Il check `npm run check:demo-contract` genera la demo in una cartella temporanea e fallisce se manca una categoria minima, un campo di flusso o una sessione attiva.

## Regola Continuita Prima Della Demo

Prima della demo finale e ammessa solo una fixture tecnica generata in `dist/` e ignorata da Git.

La fixture deve dimostrare:

- catena scelta -> conseguenza -> `entita_impattate` -> `propagazione_stato`;
- almeno un incontro con `encounter_creatures`;
- almeno una creatura con habitat o luogo e aggancio a missione/fazione/sessione;
- almeno un oggetto o ricompensa con uso narrativo e bersagli di propagazione.

Non va trasformata in contenuto sorgente del vault.

## Smoke Senza Demo

`npm run check:smoke` controlla senza dipendere da note demo sorgente:

- `Inizia Qui`;
- `Vista Giocatori`;
- `Durante il Gioco`;
- `Post Sessione Guidato`;
- catena di continuita live;
- pulsante `registra-scelta-mondo`.
