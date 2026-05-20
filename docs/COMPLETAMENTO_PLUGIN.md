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
| Metadata Menu | core leggero | FileClass per sessione, missione, tracciato, PNG, luogo, fazione e relazione. |
| Homepage | core | Apertura su `Inizia Qui`. |
| Workspaces | core UX | Layout consigliati per cambio contesto. |
| Bookmarks | core UX | Segnalibri per pagine operative. |
| Folder Notes | core | Indici di cartella. |
| Tabs | core UX | Note lunghe più leggibili. |
| Callout Manager | core UX | Blocchi riconoscibili. |
| Style Settings | core UX | Regolazioni visuali. |
| Tasks | supportato operativo | Backlog DM, preparazione e post-sessione filtrati con `#task`; non sostituisce missioni, clock o lore. |

## TTRPG Supportati Nella Release

| Strumento | Stato release | Uso |
| --- | --- | --- |
| Dice Roller | supportato | Tiri rapidi e tabelle casuali. |
| Fantasy Statblocks | supportato | Creature e statblock collegati agli incontri. |
| Initiative Tracker | supportato | Combattimenti pronti con blocchi `encounter` e vista [[../Risorse/Iniziativa e Combattimenti|Iniziativa e Combattimenti]]. |
| Calendarium | supportato | Calendario narrativo e scadenze. |
| Kanban | supportato | Preparazione e post-sessione. |

## Mappe E Media

| Strumento | Stato release | Uso |
| --- | --- | --- |
| Excalidraw | supportato | Schemi, relazioni, fronti, reti di indizi e scene al tavolo. |
| Advanced Canvas | supportato leggero | Canvas strutturali di note per fronti e archi di campagna. |
| Maps per Bases | supportato leggero | Base pilota con coordinate e plugin community `maps` installato. |
| Hex Cartographer | opzionale guidato | Mappe esagonali e viaggio. |
| TTRPG Tools: Maps | opzionale guidato | Mappe zoomabili al tavolo. |
| Media Extended | supportato leggero | Audio/video con timestamp e materiali. |
| Advanced Tables | supporto editoriale | Editing tabelle. |
| Linter | supporto sviluppo | Pulizia manuale controllata; niente lint automatico nella release base. |

## Fuori Dal Flusso Base

| Strumento | Decisione |
| --- | --- |
| Iron Vault | Non incluso nel bundle. Fuori dal flusso D&D/fantasy classico; resta solo come studio di design in documentazione. |
| BRAT | Manutenzione essenziale per plugin non ufficiali o versioni beta. Resta attivo, ma non fa parte del percorso del DM. |
| Emoji Toolbar | Non incluso. Opzionale per il singolo utente, ma fuori dalla release base per ridurre rumore al primo avvio. |

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
- `npm run release:clean` genera lo ZIP utente;
- la demo copre onboarding, dashboard, sessione, post-sessione, mondo vivo, geopolitica, vista giocatori e import mappa demo;
- le FileClass principali sono presenti in `z.fileclass`;
- i plugin opzionali non bloccano il percorso principale.
