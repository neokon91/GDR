---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: pronto
---

# Smoke Demo Finale

Checklist manuale per validare la demo [[Brumafonda Demo]] in Obsidian dopo il gate statico `npm run check`.

## Prima Di Aprire Obsidian

- [x] `npm run check` passa senza errori.
- [x] [[Dev/Demo Finale]] mostra tutte le note del nucleo demo.
- [x] [[Vista Giocatori]] contiene stato portale, recap, mappa, mondo conosciuto, diario pubblico e controllo sicurezza.

## Percorso Visuale

Apri queste pagine in ordine e verifica che non compaiano errori Dataview, JS Engine, Meta Bind o blocchi vuoti critici.

| Passo | Pagina | Esito atteso |
| --- | --- | --- |
| 1 | [[Inizia Qui]] | I pulsanti principali sono visibili e non puntano a percorsi mancanti. |
| 2 | [[Dev/Demo Finale]] | Il nucleo demo copre mondo, campagna, sessione, missione e conseguenza. |
| 3 | [[Worldbuilder Dashboard]] | [[Brumafonda Demo]] e le entita collegate emergono nelle viste worldbuilding. |
| 4 | [[Atlante del Mondo]] | [[Porto Di Brumafonda]] e [[Mappa Pubblica Di Brumafonda]] sono raggiungibili. |
| 5 | [[Campagna da Ambientazione]] | [[Campagna - Sale Sotto La Nebbia]] collega mondo, luogo, fazione, missione e sessione. |
| 6 | [[Durante il Gioco]] | La sessione demo non rompe il cockpit anche senza essere attiva. |
| 7 | [[Vista Giocatori]] | Recap, mappa e dispensa pubblica sono leggibili senza campi DM. |
| 8 | [[Risorse/Controllo Vault]] | Non compaiono blocchi critici legati alla demo. |

## Controllo Player-Safe

- [x] [[2026-05-28 - La Campana Nella Nebbia]] mostra un recap pubblico leggibile.
- [x] [[Mappa Pubblica Di Brumafonda]] e pubblica e non contiene callout segreti.
- [x] [[Avviso Della Dogana Di Brumafonda]] e consegnabile ai giocatori.
- [x] [[Vista Giocatori]] segnala controllo sicurezza pulito.
- [x] Nessuna nota demo pubblica espone `segreti`, `prossima_mossa`, `mosse_segrete` o `verita_nascosta`.

## Evidenze Release

- [ ] Screenshot `Inizia Qui`.
- [ ] Screenshot [[Dev/Demo Finale]].
- [ ] Screenshot [[Vista Giocatori]].
- [ ] Screenshot [[Atlante del Mondo]].
- [ ] Screenshot [[Risorse/Controllo Vault]].
- [ ] GIF breve `Inizia Qui` -> [[Durante il Gioco]] -> [[Vista Giocatori]].

## Esito

- [ ] Smoke visuale superato in Obsidian.
- [ ] Eventuali problemi sono stati corretti e ricontrollati con `npm run check`.

## Stato Ripresa 2026-05-21

- [x] `npm run check` eseguito e passato.
- [x] `npm run release:clean` eseguito e passato.
- [x] Controllo player-safe statico della demo passato dentro `npm run check`.
- [x] `npm run check:smoke` aggiunto come gate statico dedicato per demo finale e player-safe.
- [ ] Smoke visuale Obsidian ancora da eseguire sulle pagine del percorso visuale.
- [ ] Screenshot/GIF di evidenza ancora da acquisire.
