# Completamento Plugin Per Release ZIP

Questa pagina decide quali strumenti entrano nella prima release ZIP come esperienza supportata.

## Principio

La release iniziale non deve dimostrare tutti i plugin. Deve dimostrare un prodotto stabile. Un plugin entra nel percorso principale solo se l'utente non tecnico vede un beneficio immediato.

## Core Release

| Strumento | Stato release | Motivo |
| --- | --- | --- |
| Dataview | core | Dashboard e controlli. |
| Templater | core | Creazione guidata. |
| Meta Bind | core | Pulsanti e campi interattivi. |
| JS Engine | core tecnico | Supporto logiche avanzate. |
| Metadata Menu | core leggero | Campi guidati. |
| Homepage | core | Apertura su `Inizia Qui`. |
| Folder Notes | core | Indici di cartella. |
| Tabs | core UX | Note lunghe più leggibili. |
| Callout Manager | core UX | Blocchi riconoscibili. |
| Style Settings | core UX | Regolazioni visuali. |

## TTRPG Supportati Nella Release

| Strumento | Stato release | Uso |
| --- | --- | --- |
| Dice Roller | supportato | Tiri rapidi e tabelle casuali. |
| Fantasy Statblocks | supportato | Creature e statblock. |
| Initiative Tracker | supportato | Incontri pronti. |
| Calendarium | supportato | Calendario narrativo e scadenze. |
| Kanban | supportato | Preparazione e post-sessione. |

## Mappe E Media

| Strumento | Stato release | Uso |
| --- | --- | --- |
| Excalidraw | supportato | Schemi, relazioni e mappe ragionate. |
| Hex Cartographer | opzionale guidato | Mappe esagonali e viaggio. |
| TTRPG Tools: Maps | opzionale guidato | Mappe zoomabili al tavolo. |
| Media Extended | supportato leggero | Audio/video con timestamp e materiali. |
| Advanced Tables | supporto editoriale | Editing tabelle. |

## Fuori Dal Flusso Base

| Strumento | Decisione |
| --- | --- |
| Iron Vault | Fuori dal flusso D&D/fantasy classico. Può restare installato ma non va mostrato all'utente base. |
| BRAT | Solo manutenzione. Non e parte dell'esperienza utente. |
| Emoji Toolbar | Opzionale. Non blocca nessun workflow. |

## Import Esterni

| Fonte | Decisione |
| --- | --- |
| Azgaar `.map` | Non importare direttamente nella release iniziale. Formato interno, utile come salvataggio Azgaar. |
| Azgaar GeoJSON | Supportato come import controllato verso bozze. |
| Azgaar CSV | Prossimo candidato: citta, stati, culture, religioni. |
| SVG/PNG | Trattare come riferimento visuale, non come dati canonici. |

## Criterio Di Chiusura

La release ZIP e pronta quando:

- `npm run check` passa;
- `npm run import:azgaar -- "Import/Azgaar/Prova - Azgaar.geojson" --world "Demo - Terre della Soglia" --dry-run` passa;
- `npm run release:clean` genera ZIP;
- la demo copre onboarding, dashboard, sessione, post-sessione, vista giocatori e import mappa demo;
- i plugin opzionali non bloccano il percorso principale.
