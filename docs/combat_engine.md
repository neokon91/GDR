# Motore di combattimento, Board e ecosistema a 4 repo

Questo documento copre il **runtime di combattimento** del vault GDR e l'**ecosistema
multi-repo** su cui poggia — la parte NON generata dalla pipeline `render.py` (per quella
vedi [architecture.md](architecture.md)). È il quadro d'insieme di plugin ↔ motore ↔ dati.

> Stato (2026-08): il motore + la Board + lo statblock nativo + le condizioni "vere" sono
> **in produzione** nel plugin, e sono l'UNICA superficie di combattimento. Initiative
> Tracker e Fantasy Statblocks sono stati **ritirati** (vedi § Ritiro, completato).

## L'ecosistema a 4 repo
Sotto `~/Documents/Sviluppo/projects/`:

| Repo | Ruolo | Remote |
|------|-------|--------|
| **archivio** | DATI SRD condivisi (YAML) + libri/mappe. Fonte dati. | ✅ privato |
| **regole** | Motore D&D 5.5e logico in TS (primitive + combattimento event-sourced). UI-agnostico. | ✅ privato |
| **GDR** | Questo repo: vault Obsidian + plugin. Consuma `archivio` + `regole`. | ✅ |
| **Compendio** | App Astro/Preact (catalogo). Consuma `archivio` + `regole`. | ❌ (solo locale) |

**Wiring**: in sviluppo, `archivio` e `regole` sono **symlink gitignorati** dentro `GDR/`
(co-sviluppo live); a release diventeranno submodule/dipendenze versionate. esbuild segue il
symlink `regole/` e **bundla** la catena TS del motore dentro `plugin/main.js`. I generatori
(`gen_bestiario.py`, `gen_condizioni.py`) leggono `archivio/` e scrivono i **sidecar** in
`plugin/data/`.

## Il motore (`regole/src/motore`)
Event-sourced e puro (nessuna dipendenza da Obsidian):
- Lo stato non si muta: si accumulano **`Evento[]`** e lo stato è sempre `ricostruisci(eventi)`.
- I **comandi** (`comandoIniziativa`, `comandoAttacco`, `comandoSalvezza`, `comandoMultiattacco`,
  `comandoCura`, `comandoLeggendaria`, …) leggono lo stato ed emettono nuovi `Evento[]`.
- `registro(eventi)` produce il log narrato; `esitoScontro`, `ordine`, `attivo` derivano viste.
- Tipi chiave: **`Combattente`** (forma "magra" in plancia), **`Azione`**, **`DefinizioniCondizioni`**.
- **Adapter d'ingresso**: `daMostro(RawMostro)` — e `RawMostro` È la forma dei `.monster.yaml`
  di archivio, quindi un mostro SRD entra quasi gratis; `daAttore(Attore)` per i PG "ricchi".

## La Board (`plugin/main.ts` → `BoardView`)
`ItemView` (`gdr-board`, comando `apri-board`, ribbon spade) = tracker di combattimento
pilotato dal motore. Tiene `eventi: Evento[]`, ogni comando li accoda e ridisegna
`ricostruisci(eventi)`.
- **Incontro**: si costruisce dal bestiario SRD (picker ➕Nemico/➕Alleato) + PG del vault (🎭PG).
- **Turni**: iniziativa, pannello "Azioni di turno" dell'attivo (attacco/TS/multiattacco/cura
  con scelta bersaglio), passa-turno, annulla.
- **Controlli GM per riga**: danno/cura di N PF, rimuovi combattente, `＋stato` (applica una
  condizione), chip-condizione cliccabili per toglierle. Barre PF, marker attivo/KO.
- **Persistenza**: gli eventi vivono nel `data.json` del plugin → il combattimento sopravvive
  a un reload (`loadBoard`/`saveBoard`).

### Adapter nel plugin
- `daMostro` (da `regole`): mostro archivio → `Combattente`.
- `daPgGdr(frontmatter)` (nel plugin): foglio-PG GDR → `Combattente` (CA/PF/init/TS dai campi
  piatti; NIENTE attacchi auto — l'offensiva del PG resta al giocatore). *Nota debito: la
  matematica TS/mod duplica `regole/lib`; a tendere passare per `daAttore`.*

## Statblock nativo (`renderStatblock`)
Rende uno statblock completo (caratteristiche+TS, azioni in prosa Markdown, ecc.) dal mostro
grezzo del bestiario. Due superfici, stessa funzione: la **`StatblockModal`** (click sul nome
di un combattente nella Board) e il blocco **```gdr statblock `<id>`** (per pagine/note).
Sostituisce **Fantasy Statblocks** per la consultazione.

## Condizioni "vere"
Le condizioni non sono più etichette: il motore ne applica gli **effetti ai tiri**.
- `gen_condizioni.py` → `plugin/data/srd_condizioni.json` (dalle `.condition.yaml` /
  `glossario/condizioni/*.yaml` di archivio).
- Il plugin risolve via `regole` `risolviCondizioni()` → `DefinizioniCondizioni` (`defs`),
  passati a `comandoAttacco/Salvezza/Multiattacco` → prono/avvelenato→svantaggio,
  afferrato→velocità 0, TS con (s)vantaggio o auto-fallimento, buff (benedetto +1d4).

## Sidecar dati (`plugin/data/`, gitignorati)
Generati dai tool (inclusi in `npm run build` del plugin come `gen:bestiario`/`gen:condizioni`)
e copiati nel vault da `render.py:install_authored_plugins`. Letti **on-demand** all'apertura
della Board (main.js resta magro all'avvio). Sorgente = `archivio` + generatore; l'artefatto
è rigenerabile, non è la fonte di verità.

## Migrazione dati archivio (in corso)
`archivio` sta migrando verso il **doppio-file**: `<slug>.yaml` (dati puri) + `<slug>.md`
(prosa, con frontmatter `id`), legati per `id`, con **id qualificati** `dnd.<tipo>.<slug>`
(es. `dnd.condizione.accecato`). Vale per **tutto ciò che ha prosa** (condizioni fatte;
mostri a seguire). Il plugin è reso **tollerante alla transizione**: i ref restano risolti sia
per id qualificato sia per slug nudo (`risolviCondizioni`/`risolviAzione` in `regole`
indicizzano per entrambi), e i generatori leggono vecchio+nuovo formato.

## Ritiro di Initiative Tracker + Fantasy Statblocks (completato)
Il combattimento non dipende più da plugin di terze parti. Fatto:
- **Pagine SRD** (334 mostri) → ` ```gdr statblock <id> ` (dal bestiario generato da archivio).
- **Statblock inline delle evocazioni** (incantesimi) → callout Markdown nativo (`_creatura_evocata`).
- **Creature homebrew** → ` ```gdr statblock ` con dati YAML inline (`renderStatblock` parsa
  il corpo); `scaffold_statblock` genera la base dal GS in forma nativa.
- **Flusso ```encounter → Board**: «Schiera l'incontro nella Board» costruisce lo schieramento
  dalla nota-Incontro; il vecchio blocco ```encounter e i bottoni IT sono rimossi.
- **plugins.yaml**: `obsidian-5e-statblocks` e `initiative-tracker` rimossi (con i loro writer
  di config). `srd_statblock_yaml`/`Dev/Source/statblocks/*.json` eliminati.
