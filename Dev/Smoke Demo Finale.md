---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: sospeso
---

# Smoke Demo Finale

La demo finale non vive più come note sorgente mantenute a mano.

Regola attiva: la demo va generata solo a fine ciclo, da script, dopo che template, runtime, fileClass, controlli e viste operative sono stabili. Fino ad allora `npm run check` deve verificare il prodotto senza pretendere contenuti demo.

## Stato

- [x] Demo sorgente rimossa dal vault.
- [x] Gate statico convertito su onboarding, vista giocatori, live e post-sessione.
- [x] Le note demo manuali storiche sono vietate dal controllo vault.
- [ ] Creare uno script dedicato di generazione demo finale.
- [ ] Generare scenario demo coerente con TemplateFactory e runtime M11.
- [ ] Eseguire smoke visuale sulla release generata.

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

## Smoke Senza Demo

Fino alla fase demo finale, `npm run check:smoke` controlla solo:

- `Inizia Qui`;
- `Vista Giocatori`;
- `Durante il Gioco`;
- `Post Sessione Guidato`;
- catena M11 di continuità;
- pulsante `registra-scelta-mondo`.
