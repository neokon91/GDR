# Packaging Prodotto

Questa pagina serve a trasformare il vault da strumento potente a prodotto leggibile in pochi secondi.

## Posizionamento

Vault Obsidian italiano per DM e worldbuilder: prepara una sessione, giocala, aggiorna il mondo. Atlante, portale giocatori, party control e quality report restano strumenti di supporto, non il percorso principale.

## Feature Da Mostrare

| Feature | Screenshot consigliato | Cosa deve comunicare |
| --- | --- | --- |
| Primo avvio | `Inizia Qui` | L'utente vede solo Prepara, Gioca, Aggiorna il mondo. |
| Portale giocatori | `Vista Giocatori` | Materiale condivisibile senza segreti DM. |
| Party control | `Hub/Party Control` | PG, HP, missioni e flags durante la sessione. |
| Atlante | `Atlante del Mondo` tab Mappa | Mappe, territori, rotte e luoghi collegati. |
| Quality report | `Risorse/Quality Report` | Copertura e buchi visibili come report prodotto. |
| Demo | `Demo - La Reliquia Spezzata` | Una campagna clonabile gia collegata. |

## GIF Brevi

1. Flusso base obbligatorio: `Inizia Qui` -> `Preparazione Sessione` -> `Durante il Gioco` -> `Cosa Succede Fuori Scena`.
2. Sessione: `Preparazione Sessione` -> cinque blocchi pronti -> `Durante il Gioco`.
3. Condivisione: `Vista Giocatori` -> mappa pubblica -> handout.
4. Worldbuilding: `Atlante del Mondo` -> mappa -> rotte -> buchi ambientazione.
5. Release: `Quality Report` -> `Controllo Vault` -> `RELEASE`.

## Core System-Neutral

Il core vendibile e composto da:

- `Hub`
- `Campagne`
- `Mondi`
- `Giocatori`
- `Risorse`
- `z.modelli`
- `z.automazioni`
- `.obsidian` con plugin abilitati e snippet CSS

`SRD` e un modulo regolamentare separato: utile per D&D-like, ma non necessario per usare workflow, player portal, party control, atlante e quality report.

## Checklist Release

- [ ] `npm run check` pulito.
- [ ] `npm run release:clean` genera `dist/vault-gdr-clean.zip`.
- [ ] Test manuale UX: nuovo utente capisce il prossimo click in 30 secondi.
- [ ] Test manuale UX: la preparazione mostra cosa manca in una schermata.
- [ ] Lo ZIP contiene `Hub/Vista Giocatori.md`, `Hub/Party Control.md`, `Risorse/Quality Report.md` e `LEGGIMI.md`.
- [ ] `Vista Giocatori` senza segreti esposti.
- [ ] `Quality Report` senza buchi bloccanti.
- [ ] Demo navigabile da `Inizia Qui`.
- [ ] Screenshot aggiornati.
- [ ] GIF brevi aggiornate.
- [ ] README e CHANGELOG allineati.
- [ ] Testo pubblico allineato in [PAGINA_RELEASE.md](PAGINA_RELEASE.md).
