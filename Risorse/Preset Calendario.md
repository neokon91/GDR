---
cssclasses:
  - indice
categoria: risorsa
tipo: guida
stato: pronto
---

# Preset Calendario

Questa pagina evita di spiegare campi tecnici al DM. Scegli un modo semplice per segnare il tempo e usalo sempre.

## Preset Rapido

| Uso | Scrivi cosi |
| --- | --- |
| Giorni normali | "Giorno 1", "Giorno 2", "Giorno 3" |
| Notti o fasi | "Prima notte", "Seconda notte", "Terza notte" |
| Viaggio | "Viaggio, giorno 1", "Viaggio, giorno 2" |
| Mistero | "Prima ora", "Seconda ora", "Al tramonto" |
| Sandbox | "Settimana 1", "Settimana 2", "Fine mese" |

## Dove Scriverlo

| Nota | Campo leggibile |
| --- | --- |
| Sessione | `data_mondo` |
| Missione | `scadenza_mondo` |
| Evento storico | `data_mondo` |

## Se Vuoi Una Vista Calendario

Chi prepara il vault puo compilare anche:

| Campo | Esempio semplice |
| --- | --- |
| `fc-calendar` | "Brumafonda" |
| `fc-date` | "1-1-1" |
| `fc-category` | "sessione" |
| `fc-display-name` | "Sessione 1" |

Il DM puo ignorare questi campi: [[Mondi/Calendario]] mostra comunque le date leggibili e segnala cosa manca.

## Categorie Consigliate

| Categoria | Quando usarla |
| --- | --- |
| `sessione` | Sessioni preparate o giocate. |
| `scadenza` | Missioni con tempo limitato. |
| `pericolo` | Minacce che avanzano se ignorate. |
| `conseguenza` | Eventi nati dopo una sessione. |
| `festa` | Ricorrenze, mercati, rituali e date speciali. |
