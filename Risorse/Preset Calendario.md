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

Il vault include i calendari default di Calendarium e usa `Brumafonda` come calendario custom predefinito per `Mondi`, `Campagne` e `Inbox`.

Chi prepara il vault puo compilare anche:

| Campo | Esempio semplice |
| --- | --- |
| `fc-calendar` | "Brumafonda" |
| `fc-date` | "1-1-1" |
| `fc-category` | "sessione" |
| `fc-display-name` | "Sessione 1" |

Il DM puo ignorare questi campi: [[Mondi/Calendario]] mostra comunque le date leggibili e segnala cosa manca.

## Calendari Disponibili

| Calendario | Uso consigliato |
| --- | --- |
| `Brumafonda` | Calendario custom del vault e default per le campagne demo. |
| `Calendar of Harptos` | Riferimento Forgotten Realms o campagne con mesi di Faerûn. |
| `Gregorian Calendar` | Campagne moderne, storiche o calendario reale. |
| `Calendar of Greyhawk` | Riferimento Greyhawk. |
| `Calendar of Galifar` | Riferimento Eberron. |
| `Barovian Calendar` | Riferimento Ravenloft/Barovia. |

## Categorie Consigliate

| Categoria | Quando usarla |
| --- | --- |
| `sessione` | Sessioni preparate o giocate. |
| `scadenza` | Missioni con tempo limitato. |
| `pericolo` | Minacce che avanzano se ignorate. |
| `conseguenza` | Eventi nati dopo una sessione. |
| `festa` | Ricorrenze, mercati, rituali e date speciali. |
