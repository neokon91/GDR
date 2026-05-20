---
cssclasses:
  - indice
categoria: risorsa
tipo: demo
stato: pronto
---

# Demo Finale

Scenario demo creato dopo M1 e M2 per verificare che il vault 1.0 funzioni con template ufficiali, dashboard, mappe, conseguenze e vista giocatori.

## Nucleo

- Mondo: [[Brumafonda Demo]]
- Campagna: [[Campagna - Sale Sotto La Nebbia]]
- Sessione: [[2026-05-28 - La Campana Nella Nebbia]]
- Missione: [[Recuperare La Campana Sommersa]]
- Conseguenza: [[La Marea Ha Preso Il Faro Vecchio]]

## Copertura

| Area | Nota |
| --- | --- |
| Cultura | [[Custodi Delle Saline]] |
| Potere/Fazione | [[Consorzio Del Sale Nero]] |
| Religione/Culto | [[Culto Della Lanterna Bassa]] |
| Luogo | [[Porto Di Brumafonda]] |
| Economia | [[Mercato Del Sale Nero]] |
| Mappa | [[Mappa Pubblica Di Brumafonda]] |
| Dispensa pubblica | [[Avviso Della Dogana Di Brumafonda]] |
| Vista giocatori | recap pubblico in [[2026-05-28 - La Campana Nella Nebbia]] e mappa pubblica |

## Verifica

- [x] Creato dopo completamento M1 e M2.
- [x] Frontmatter allineato ai template ufficiali del vault.
- [x] Copre mondo, cultura, potere, culto, economia, mappa, campagna, sessione e conseguenza.
- [x] Include recap, mappa e dispensa pubblici per [[Vista Giocatori]].
- [x] `npm run check` passa con gate statico M3 su presenza demo e player-safe.
- [ ] Smoke visuale manuale in Obsidian: [[Dev/Smoke Demo Finale]].

## Gate Statico M3

`npm run check` verifica:

- tutte le note demo obbligatorie esistono;
- la sessione demo e pubblica e ha `recap_pubblico`;
- la mappa demo e pubblica e ha testo/luoghi player-safe;
- la dispensa demo e pronta, pubblica e player-safe;
- i file pubblici demo non espongono campi DM evidenti;
- [[Vista Giocatori]] contiene stato portale e controllo sicurezza.
