# Reference: Initiative Tracker (`initiative-tracker`)

Versione vault: **v13.0.21** (Jeremy Valentine). Doc: https://plugins.javalent.com/initiative-tracker
Repo: https://github.com/javalent/initiative-tracker  (ex `valentine195/obsidian-initiative-tracker`)

> **Stato: cablato.** `encounter.md.j2` emette il blocco ` ```encounter ` (tab *Combattimento*);
> `aggiorna_encounter` auto-popola **creature + alleati** (flag `ally`) dalle relazioni e
> applica gli **override HP/CA/init** dal campo `varianti`; la **difficoltà/budget XP 2024** è in
> `renderEncounter`; quick-ref condizioni in `renderCondizioni`.
> ✅ **Party auto-iniettato**: `inizia_incontro` (bottone *Prepara il gruppo (IT)*) popola il
> Party IT dai **PG** del vault (personaggio · tipo pg) via `savePlayer`, così `players: true` risolve.

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

## Sintassi creature avanzata
- **Alleato** (✅ sfruttato): `- Scheletro, ally` — schierato dalla parte del gruppo (separato
  dai nemici nel conteggio difficoltà). `aggiorna_encounter` lo emette dal campo `alleati`
  dell'incontro (PNG alleati / evocazioni).
- **Override inline** (✅ sfruttato via `varianti`): `- 3: Salamandra, 60, 12, 20` = count, HP, CA,
  mod iniziativa → varia al volo una creatura SRD senza creare una nota (boss potenziato,
  gregario indebolito). Indicando l'HP, la creatura **non tira gli HP** (incontro ripetibile).
  Fonte-dato: il frontmatter `varianti` dell'incontro, una riga per creatura
  (`"[[Salamandra]]: hp 60, ca 12, init 20"`, alias `pf`→hp); `aggiorna_encounter` la emette.
  **hp è l'ancora** (sintassi posizionale): una variante con solo `ca`/`init` non è esprimibile.

## Ponte con Fantasy Statblocks (già nel layout 5.5e)
Il layout `5-5e-ita.json` espone due `action` block nello statblock — **"Avvia incontro"**
(`InitiativeTracker.newEncounter({roll:true, creatures:[monster]})`) e **"Aggiungi al
tracker"** (`InitiativeTracker.addCreatures([monster])`): popolano il tracker dalla scheda
creatura in un click (degrada se IT assente).

## ⚠️ Gotcha
- **Render pigro nei tab**: il blocco vive dentro ` ````tabs ` → renderizza solo quando il
  tab *Combattimento* è attivo (come per i callout collassati, vedi [obsidian-core](obsidian-core.md#callout)).
- I nomi creatura sono **stringhe**: un typo = creatura non trovata, niente statblock.
- `players: true` richiede un party configurato nel plugin — ora **auto-iniettato** da
  `inizia_incontro` (meta_action) dai PG del vault; nessuna config manuale.

## Fatto (ex roadmap DM #3)
Pre-popolamento di `creatures:` (e **alleati** col flag `ally`) dalle relazioni
dell'`incontro` (`aggiorna_encounter`); **override HP/CA/init** dal campo `varianti`
(boss/gregari, incontri ripetibili); **difficoltà/budget XP 2024** in `renderEncounter`;
quick-ref condizioni dalle 15 note SRD (`renderCondizioni`). ✅ **Auto-iniezione del Party**:
`inizia_incontro` schiera i PG del vault nel Party IT (runtime, via `savePlayer`/`saveSettings`),
non-distruttivo (aggiunge solo i mancanti) — il ponte è completo, IT resta il motore del combattimento.
