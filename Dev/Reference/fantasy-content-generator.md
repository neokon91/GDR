# Reference: Fantasy Content Generator (`fantasy-content-generator`)

Versione vault: **v1.2.4** (Gregory Jagermeister).

> **Stato: installato, NON ancora cablato.** Candidato per **generazione rapida di
> nomi/spunti** (roadmap Worldbuilder #8) durante la creazione di entità.

## Cos'è
Generatore di contenuti fantasy/TTRPG: **nomi** (PNG, luoghi, taverne…), spunti, tabelle
casuali. Si usa dalla **command palette** (genera e inserisce/copia il risultato).

## Aggancio previsto (roadmap #8)
- Spunto nel **wizard di creazione** (Templater `crea_<id>`): proporre un nome generato
  come default editabile per `personaggio`/`luogo`/`fazione`.
- Tabelle rapide per arricchire i seed (mestieri, tratti, toponimi) coerenti col genere
  del `mondo`.
- **Trasversale alle 4 lenti**: riduce l'attrito "pagina bianca" del worldbuilder.

## ⚠️ Gotcha
- Genera testo **generico** (non legato all'ontologia/assi del progetto): va trattato come
  *spunto*, non come dato canonico — l'utente cura e tipizza dopo.
- L'integrazione con Templater richiede di capire come il plugin **espone** la generazione
  (comando vs API JS): verificare prima di agganciarlo al wizard.
- Plugin a basso impatto: l'aggancio è **opzionale** e tardivo (dopo che rules-engine e
  worldbuilding profondo sono rifiniti).
