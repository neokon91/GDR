---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: sospeso
---

# Smoke Demo Finale

La demo finale non vive più come note sorgente mantenute a mano.

Regola attiva: la demo finale resta l'ultima cosa. Va generata solo a fine ciclo, da script, dopo che template, runtime, fileClass, controlli e viste operative sono stabili. Fino ad allora `npm run check` deve verificare il prodotto senza pretendere contenuti demo. Il contratto dichiarativo vive in `Dev/TemplateFactory/modules/demo_contract.yaml` ed e verificato da `npm run check:demo-contract`.

La fixture M11 generata da `npm run generate:demo-fixture` non e la demo finale: serve solo a provare la catena tecnica scelta -> conseguenza -> propagazione -> materiale D&D collegato al mondo. Anche la demo minima "Regno di Prova" va generata con `npm run generate:demo-world` dentro `dist/`, non mantenuta in `Mondi/`.

## Stato

- [x] Demo sorgente rimossa dal vault.
- [x] Gate statico convertito su onboarding, vista giocatori, live e post-sessione.
- [x] Le note demo manuali storiche sono vietate dal controllo vault.
- [x] Script di fixture M11 tecnica disponibile: `z.automazioni/generate_demo_fixture.js`.
- [x] Gate M11 tecnico disponibile: `npm run check:m11`.
- [x] Contratto demo dichiarativo disponibile: `demo_contract.yaml`, con generatori `generate:demo-fixture` e `generate:demo-world`.
- [ ] Creare o promuovere lo script dedicato di generazione demo finale solo nella fase finale.
- [ ] Generare scenario demo finale coerente con TemplateFactory e runtime M11.
- [ ] Eseguire smoke visuale sulla release generata come ultimo passaggio pre-release.

## Regola Per La Fase Finale

La demo finale dovrà essere generata da script e poi verificata, non corretta nota per nota.

Lo script dovrà produrre almeno:

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

## Regola Per M11 Prima Della Demo

Prima della demo finale e ammessa solo una fixture tecnica generata in `dist/` e ignorata da Git.

La fixture deve dimostrare:

- catena scelta -> conseguenza -> `entita_impattate` -> `propagazione_stato`;
- almeno un incontro con `encounter_creatures`;
- almeno una creatura con habitat o luogo e aggancio a missione/fazione/sessione;
- almeno un oggetto o ricompensa con uso narrativo e bersagli di propagazione.

Non va trasformata in contenuto sorgente del vault.

## Smoke Senza Demo

Fino alla fase demo finale, `npm run check:smoke` controlla solo:

- `Inizia Qui`;
- `Vista Giocatori`;
- `Durante il Gioco`;
- `Post Sessione Guidato`;
- catena M11 di continuità;
- pulsante `registra-scelta-mondo`.
