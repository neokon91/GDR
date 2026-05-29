---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: sospeso
---

# Smoke Demo Finale

La demo finale non vive più come note sorgente mantenute a mano.

Regola attiva: la demo finale non vive nel sorgente. Per una release consegnabile con demo usa `npm run release:demo`, che crea la release pulita e inserisce la demo nello ZIP. Il contratto dichiarativo vive in `Dev/TemplateFactory/modules/demo_contract.yaml` ed e verificato da `npm run check:demo-contract`.

La fixture di continuita generata da `npm run generate:demo-fixture` resta prova tecnica: scelta -> conseguenza -> propagazione -> materiale D&D collegato al mondo. Il generatore diretto `npm run generate:demo-world` serve solo per manutenzione o debug dentro `dist/vault-gdr-clean`; non e il percorso normale per produrre uno ZIP consegnabile. Include una regione giocabile completa per provare worldbuilding profondo senza creare note sorgente manuali.

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

Percorso normale per la release demo:

```bash
npm run release:demo
```

Per debug del solo generatore, dopo una release pulita locale, `npm run generate:demo-world -- --out dist/vault-gdr-clean --force` produce almeno:

- mondo;
- regione giocabile con tre luoghi;
- campagna;
- cultura locale;
- tre fazioni;
- conflitto;
- segreto DM con indizi player-safe;
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
