# UX Operativa

Questa e la direzione vincolante dello sviluppo: il vault non deve sembrare ricco, deve far completare lavoro.

## Problema Da Risolvere

Il rischio principale non e la mancanza di template o dashboard. Il rischio principale e far girare il DM da una nota all'altra senza produrre una sessione pronta, una sessione giocata o un mondo aggiornato.

Ogni nuova funzione che aumenta navigazione, scelta o manutenzione senza produrre un output concreto peggiora il prodotto.

## Flusso Primario

Il flusso principale e uno solo:

1. **Prepara**: produce una sessione giocabile.
2. **Gioca**: produce appunti live, decisioni e materiale usato.
3. **Aggiorna il mondo**: produce conseguenze, prossime mosse e prossima sessione.

Tutto il resto e supporto avanzato.

## Definition Of Done UX

Una modifica e accettabile solo se supera almeno uno di questi controlli:

- riduce il numero di note da aprire per preparare una sessione;
- trasforma una vista consultiva in un output compilabile o verificabile;
- sposta strumenti secondari fuori dal percorso principale;
- rende chiaro cosa fare adesso e quale risultato ottenere;
- elimina duplicazione tra dashboard;
- migliora `Prepara -> Gioca -> Aggiorna il mondo` senza introdurre una quarta tappa obbligatoria.

Una modifica non e accettabile se:

- aggiunge una dashboard senza rimuovere o nascondere un percorso equivalente;
- richiede di leggere documentazione prima di usare il vault;
- espone dieci pulsanti quando l'utente deve scegliere una sola azione;
- crea un nuovo indice invece di completare un lavoro;
- sposta complessita dal codice alla navigazione dell'utente.

## Regole Di Progettazione

- `Inizia Qui` deve restare una pagina a tre azioni.
- `Preparazione Sessione` deve restare il punto unico per rendere una sessione giocabile.
- `Durante il Gioco` deve mostrare solo comandi da tavolo; il resto resta collassato.
- `Cosa Succede Fuori Scena` deve chiudere conseguenze e prossime mosse, non diventare un archivio.
- `Vista Giocatori`, `Party Control`, `Atlante`, `Quality Report` e dashboard avanzate non sono tappe obbligatorie.
- Ogni pagina operativa deve dichiarare il proprio output in alto.

## Metriche Manuali

Prima di una release, testare il vault con questi scenari:

| Scenario | Limite |
| --- | --- |
| Nuovo DM apre il vault e capisce il prossimo click | 30 secondi |
| Creare o rendere pronta una sessione minima | 5 blocchi |
| Passare da home a tavolo | 2 click |
| Capire cosa manca a una sessione | 1 schermata |
| Capire cosa fare dopo la sessione | 1 schermata |

Se uno scenario fallisce, la priorita e UX operativa, non nuove feature.
