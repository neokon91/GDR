# Reference: Initiative Tracker (`initiative-tracker`)

Versione vault: **v13.0.21** (Jeremy Valentine). Doc: https://plugins.javalent.com/initiative-tracker
Repo: https://github.com/javalent/initiative-tracker  (ex `valentine195/obsidian-initiative-tracker`)

> **Stato: cablato a livello base.** `encounter.md.j2` emette un blocco ` ```encounter `
> (tab *Combattimento*). Manca l'auto-popolamento e il budget XP (roadmap DM #3).

## Cos'è
Tracker di iniziativa/combattimento 5e: ordina i turni, gestisce HP/condizioni, e
**legge i mostri da Fantasy Statblocks** (`obsidian-5e-statblocks`) per nome.

## Blocco `encounter` (già usato)
```encounter
name: <% tp.config.target_file.basename %>   # il basename reale (NON tp.file.title: snapshot pre-rename)
players: true                 # include il gruppo (party) configurato nel plugin
creatures:
  - 1: Nome Creatura          # - <numero>: <Nome dal bestiario Statblocks/SRD>
```
"Avvia incontro" apre il tracker pre-popolato. I nomi devono combaciare con una creatura
del **bestiario Fantasy Statblocks** (le 334 note SRD lo alimentano).

## Sintassi creature avanzata (non sfruttata)
- **Alleato**: `- Scheletro, ally` — schierato dalla parte del gruppo (separato dai nemici
  nel conteggio difficoltà). Utile per PNG alleati / evocazioni.
- **Override inline**: `- 3: Salamandra, 60, 12, 20` = count, HP, CA, mod iniziativa →
  varia al volo una creatura SRD senza creare una nota (boss potenziato, gregario indebolito).
  Indicando l'HP, la creatura **non tira gli HP** (incontro bilanciato/ripetibile).

## Ponte con Fantasy Statblocks (già nel layout 5.5e)
Il layout `5-5e-ita.json` espone due `action` block nello statblock — **"Avvia incontro"**
(`InitiativeTracker.newEncounter({roll:true, creatures:[monster]})`) e **"Aggiungi al
tracker"** (`InitiativeTracker.addCreatures([monster])`): popolano il tracker dalla scheda
creatura in un click (degrada se IT assente).

## ⚠️ Gotcha
- **Render pigro nei tab**: il blocco vive dentro ` ````tabs ` → renderizza solo quando il
  tab *Combattimento* è attivo (come per i callout collassati, vedi [obsidian-core](obsidian-core.md#callout)).
- I nomi creatura sono **stringhe**: un typo = creatura non trovata, niente statblock.
- `players: true` richiede un party configurato nel plugin (non generato dalla pipeline).

## Aggancio previsto (roadmap DM #3)
Pre-popolare `creatures:` dalle creature **collegate** nell'`incontro` (relazioni
tipizzate) e mostrare la **difficoltà/budget XP 5e** (il tracker la calcola da CR; serve
fornire CR/statblock coerenti). Quick-ref condizioni dalle 15 note SRD.
