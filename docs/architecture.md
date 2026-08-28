# Architettura GDR

Doc di sviluppo **unico** (panoramica completa del sistema). Deep-dive del contratto
homebrew in **[schema_homebrew.md](schema_homebrew.md)**; processo di rilascio in
**[releasing.md](releasing.md)**.

GDR è un **vault Obsidian generato**: le sorgenti in `Dev/Source/` sono l'unica verità,
compilate in `dist/GDR-vault/` (il vault vivo). Il repo di sviluppo resta pulito; il vault è
ricostruibile. Il build è **non distruttivo**: non tocca `Mondi/` (note utente) né
`.obsidian/plugins/`.

```
Dev/Source/                 Dev/Tools/                       dist/GDR-vault/
  YAML/  (modello)   ─┐
  Jinja/ (template)   ├─▶  render.py (orchestratore)  ─▶     z.modelli/      (template)
  JS/    (runtime)    │      ├─ common.py (modello+IO)        z.automazioni/  (JS + *.json)
  SiteJinja/ (HTML)  ─┘      ├─ build_srd.py                  z.classi/       (fileClass)
                            ├─ build_personaggio/            SRD/            (sola lettura)
                            ├─ gen_bestiario/condizioni.py   Home/Indici/…
                            ├─ render_config/  validate.py   Mondi/          (i tuoi)
```

## Ecosistema a 4 repo

Sotto `~/Documents/Sviluppo/projects/`:

| Repo | Ruolo | Remote |
|---|---|---|
| **archivio** | DATI SRD 5.5e (YAML+MD) + libri/mappe. Fonte-dati unica, multi-consumatore. | ✅ privato |
| **regole** | Motore 5.5e in TS: primitive (`lib`) + creatore (`creatore`) + combattimento event-sourced (`motore`). **UI-agnostico**, testato. | ✅ privato |
| **GDR** | Questo repo: vault + plugin. Consuma `archivio` + `regole`. | ✅ |
| **Compendio** | App Astro/Preact (catalogo/creatore web). Consuma `archivio` + `regole`. | ✅ |

**Wiring**: in dev, `archivio` e `regole` sono **symlink gitignorati** dentro `GDR/`
(co-sviluppo live; a release → submodule/dipendenze versionate). esbuild segue il symlink
`regole/` e **bundla** la catena TS del motore in `plugin/main.js`. I generatori
(`gen_bestiario.py`, `gen_condizioni.py`) leggono `archivio/` e scrivono i **sidecar** in
`plugin/data/` (gitignorati, rigenerabili).

---

## Pipeline di build (`render.py build()`)

`build()` è un orchestratore sottile di funzioni nominate (nessun monolite); la logica sta nei
moduli, tutti importano `common` (nessun ciclo):

| Modulo | Responsabilità |
|---|---|
| `common.py` | Percorsi, IO, e il **modello**: `deep_merge`, `load_core`, `load_templates`, `load_pages`, `apply_entities`. |
| `build_srd.py` | Genera l'albero `SRD/` (sola lettura) da `archivio`. `srd_note` rende il contenuto (infobox, sezioni, potenziamento, evocazioni inline, footer *Vedi anche*). Le pagine mostro emettono `` ```gdr statblock <id> ``. Fonte UNICA = archivio. |
| `build_personaggio/` | Converter del rules-engine PG: SRD (da archivio) + `pg_rules.yaml` → `personaggio.json`. |
| `gen_bestiario.py` / `gen_condizioni.py` | Sidecar del motore (`plugin/data/srd_bestiario.json`, `srd_condizioni.json`) da `archivio`. |
| `render_config/` | Config `.obsidian` (merge non distruttivo, un writer per plugin), bottoni/fileClass dal modello, viste **Bases**, CSS colore-categoria. |
| `validate.py` | `check()`: confine core/system, dup-ID, snake_case, shape, schema wizard, inversi reciproci, uguaglianza byte delle sorgenti `_*.js`. |

Fasi di `build()`: (1) carica il modello; (2) `write_engine_data()` scrive `core.json`/
`personaggio.json` + copia i JS runtime + bundla `views.js`/`meta_actions.js`; (3)
`render_notes()` rende i template Jinja + le note fisse (Home/Manuale/Indici…) e `write_bases()`;
(4) `build_srd()`; (5) `write_obsidian_config()`; (6) `scaffold_folders()`. `clean()` (prima di
ogni build) rimuove ESATTAMENTE ciò che si genera (`generated_note_names()` da `ROOT_NOTES`),
mai le note utente né i plugin.

---

## Modello dati

```
core = apply_entities( deep_merge(core.yaml, system.yaml), entities/*.yaml )
```
- `deep_merge`: fonde i dict per chiave (lo split è lossless — i file non condividono chiavi,
  lo garantisce il check dup-ID).
- `apply_entities`: distribuisce ogni file-entità nelle sezioni globali (`folders`, `fields`,
  `categories`, `scheda`, `assi_tematici`, `relazioni`, `creation`, `archetipi`, `guida`).

**`core.yaml`** = globali worldbuilding: `fields` (registro `{id:{label,widget}}`), `gruppi`
(mappa concettuale), `tavolo` (superficie giocabile), `states`, `fronte_categorie` (chi può
avere un Clock), allowlist `tappe_/coerenza_/ritratto_categorie`, `spunti`.
**`system.yaml`** = globali 5.5e: `fields`, `caratteristiche` (6), `abilita` (18), `xp`
(difficoltà incontri: `cr_xp` + `budget_2024`).
**`entities/<id>.yaml`** = schema per-entità: `folder`, `gruppo`, `templates`, `subtypes` (lista
di nomi **o** oggetti-profilo), `famiglie`, `fields`, `scheda`, `guida`, `relazioni` (con
`reciprocal` per l'inverso), `creation` (scaffold del corpo). Assi & archetipi in
`YAML/assi/<id>.yaml`. Overlay: `pg_rules.yaml`, `templates.yaml` (solo `actions`), `pages.yaml`
(hub), `plugins.yaml`, `astrologia.yaml`, `generatori.yaml`.

### Tassonomia a 3 strati
1. **gruppo** (`core.gruppi`) — la famiglia concettuale (cornice/geografia/tempo/società/cosmo/
   regole/tavolo); guida Home e navigazione.
2. **tipo** (subtype) — la forma dentro l'entità; può essere un profilo ricco
   `{nome, campi, clock, evoluzione}` che `views.renderTipoProfilo` rende reattivo al `tipo`.
3. **famiglia** — dimensione tematica ortogonale, col preset-assi.

**Aggiungere un'entità/gruppo/sottotipo è un'operazione di DATI** (YAML), non di codice: le
macro condivise e `renderTipoProfilo` rendono il nuovo senza casi speciali.

### Principio d'inclusione (l'arbitro anti-bloat)
> Una cosa diventa un'**entità** (file in `entities/`) *se e solo se* ha **entrambe**: (1)
> relazioni tipizzate proprie, **e** (2) superficie giocabile propria (`uso_al_tavolo`/
> `gancio`/`pressione`/`statblock`/…).

| (1) relazioni | (2) superficie | → |
|:--|:--|:--|
| sì | sì | **entità** |
| sì | no | campo/relazione su un'entità |
| no | sì | **subtype**/tag |
| no | no | **prosa** in una nota (heading/callout) |

---

## Il plugin GDR — l'unico runtime del vault

Il plugin autoriale (`plugin/`, buildato+installato da `install_authored_plugins`) è **l'unico
runtime**: js-engine, Templater, Fantasy Statblocks, Initiative Tracker sono stati **ritirati**.
Fa:
- **Pannelli** — il blocco ` ```gdr ` col solo nome-vista (`renderX`) è reso dal plugin: carica
  `views.js` come CommonJS (`evalCjs`), risolve `dv`/`page` via la mappa `_panels.mjs:PANELS`,
  rende con `MarkdownRenderer` in modo **reattivo** (listener `metadataCache`+Dataview).
  Aggiornare `views.js` si propaga a tutte le note senza ricrearle. Il **radar** (` ```gdr `
  → `radar <cat>`) legge gli assi dal frontmatter e si aggiorna live muovendo uno slider.
- **Azioni** — `meta_actions.js` esposto come **comandi nativi** `gdr:<azione>` (hotkey/ribbon,
  modali native).
- **Creazione** — istanzia i template col mini-motore `createFromTemplate` (`tpShim`):
  `create_entity.js` (entità uniformi, schema da `core.json`) e `crea_pg.js` (l'unico wizard
  hand-authored). Il template Jinja porta un marcatore `<% await tp.user.crea_<id>(tp) %>` che
  il plugin **sostituisce** col frontmatter del wizard.
- **Cruscotto DM**, e il **runtime di combattimento** (sotto).

### Config injection ai plugin terzi (non distruttiva)
`render.build()` scrive config **solo** per i plugin **già installati** (`merge_plugin_config`
salta se la cartella manca): **Dataview** (`enableDataviewJs`), **Meta Bind** (input/button
templates; le azioni-bottone lanciano *sempre* un comando: il `command` del button o
`gdr:<azione>`), **Metadata Menu** (un fileClass per categoria), **Tab Panels**
(`enableCaching:false` — obbligatorio, il caching crasha Meta Bind), **Bases** (una vista-DB
`.base` per hub, da `pages.yaml`), **Calendarium** (parsing + ponte `fc-*`, whitelisted in
`validate.INTEROP_FIELDS`), **Folder Notes** (nota-cartella auto-indice), **Callout Manager**
(callout custom), **Bookmarks**, **community-plugins** (union degli id). Dichiarati ma non
configurati (uso a mano, aggancio = campo `mappa`): **Excalidraw**, **zoom-map**. Chrome:
`snippets/gdr.css` nasconde le `z.*`; `Media/` = cartella allegati.

### La "trinità" per-entità + sorgenti condivise
Ogni entità ≈ 3 file: **YAML** (schema) + **Jinja** (corpo, macro `_macros.j2` su
`_entity_base.j2`) + **JS di creazione** (wizard). I file `_*.js` (`_comparators`/
`_homebrew_bridge`/`_relations`) sono **sorgenti canoniche condivise**: gli script autonomi ne
tengono una COPIA fra marker, e `check()` impone che sia **byte-identica** (la deriva è un errore
di build, non un bug latente).

---

## Rules-engine PG (5.5e)

Il PG è un **creatore con regole applicate**:
```
SRD (archivio) + pg_rules.yaml + system.yaml
  │ build_personaggio (converter, parsa la prosa dove serve)
  ▼ personaggio.json  (opzioni: classi con progressione 1-20, specie, background, armature, slot)
  │ crea_pg.js (wizard eseguito dal plugin)
  ▼ frontmatter con ID stabili  →  pg.md.j2 / scheda_pg_rules() (presentazione)
```
- **Creazione** (PG di 1º livello SRD-completo): PF=`dado_vita+mod(COS)`, CA dall'armatura,
  competenze/lingue/equipaggiamento/privilegi L1, incantatore (trucchetti+preparati+slot),
  talento d'origine. Frontmatter con id stabili + flag 0/1 `ts_<car>`/`prof_<abilita>`
  (matematica Meta Bind) + `mod_<car>` pre-seedato per i tiri Dice Roller.
- **Level-up 2-20** (`sali_pg.js`): PF media fissa della classe che sale, ASI/talenti (filtrati
  per categoria 2024), sottoclasse, **multiclasse** (prereq RAW bloccanti, tabella slot
  combinata, Patto del Warlock separato). ASI-COS → PF ricalcolati su tutti i livelli (RAW).
- **Homebrew `concede`**: un talento/privilegio con blocco `concede` strutturato
  (caratteristica/abilità/competenze) è **applicato** a creazione e al livello giusto
  (`applyConcede`, sorgente condivisa `_homebrew_bridge.js`); i freeform restano prosa.
- **Presentazione** (`scheda_pg_rules()`): caratteristiche/abilità con tiri Dice Roller col bonus
  reale, risorse di classe a barre (`renderRisorsePG`), slot, riposi (loop di sessione 2024),
  incantesimi con CD/attacco.

---

## Play layer — la superficie giocabile

Meccaniche "al tavolo", tutte **data-driven** (YAML) + macro/`views.js`; le azioni che scrivono
il frontmatter sono in `meta_actions.js`.

- **Al tavolo** (`tavolo()`): ogni nota lore espone `uso_al_tavolo`/`gancio`/`pressione`/
  `prossima_mossa`. `pressione` (0-10) ha l'etichetta di rischio calcolata (Calma/Tensione/Crisi).
  È il differenziatore: lore già pronta a essere giocata.
- **Clock & conseguenze** (Fronti): un fronte traccia un orologio `clock_dim`+`clock` +
  `conseguenza`/`conseguenza_su`. Componente «⏳ Clock» offerto **solo** sulle
  `fronte_categorie`. *Avanza fronte* (+1), *Scatena conseguenza* crea un `evento` collegato,
  azzera il clock, linka → la giocata diventa storia. Dashboard `Indici/Fronti.md`.
- **Archetipi** (tag-da-assi): catalogo `{quando:{asse:comparatore}, tag}` in `assi/<id>.yaml`.
  *Applica profilo* scrive i tag `profilo/*` (rimuovendo i vecchi); in creazione l'archetipo è un
  **preset** che pre-compila assi+tag. Anche la `famiglia` può pre-compilare gli assi.
- **Catena di prep**: `missione`→`scena`(`conduce_a`)→`incontro`/`indizio`(regola dei 3)→`insidia`,
  che si chiude col mondo via `scena.genera_evento`→`evento` e bottino→`oggetto`.
- **Generatori** (`generatori.yaml`→`genera.js`): nomi/toponimi/fazioni a tema IT + spunti +
  **tesoro** e **incontro casuale** con creature/oggetti REALI dell'SRD; ganci **world-aware**
  (pescano da fazioni/luoghi/PNG del mondo attivo). Tabelle casuali (roll nativo Dice Roller) in
  `Tabelle casuali.md`.
- **Difficoltà incontri** (DMG 2024): budget del gruppo (`pg_livello×pg_numero`) vs XP delle
  creature (`pe`/`cr_xp[gs]`) → etichetta 2024 (`renderEncounter`).

---

## Motore di combattimento

La superficie di combattimento è la **Board nativa** sul motore event-sourced di `regole`
(nessun plugin terzo).

- **Motore** (`regole/src/motore`, puro, event-sourced): lo stato non si muta — si accumulano
  `Evento[]` e lo stato è `ricostruisci(eventi)`. I **comandi**
  (`comandoIniziativa/Attacco/Salvezza/Multiattacco/Cura/Leggendaria/SostituisciEsito`) leggono
  lo stato ed emettono `Evento[]`; `registro` narra, `esitoScontro`/`ordine`/`attivo` derivano
  viste. Copre l'**economia del turno** (azione/bonus/reazione), le **condizioni che mordono** i
  tiri, concentrazione, **reazioni** (Resistenza Leggendaria ribalta un TS), **azioni
  leggendarie** (pozzo/round). Adapter d'ingresso: `daMostro(RawMostro)` e `daAttore(Attore)`.
- **Board** (`plugin/board.ts`, `BoardView`): incontro dal roster (bestiario SRD + homebrew) +
  PG del vault; iniziativa/turni; pannello azioni dell'attivo (principali + **bonus**);
  **leggendarie** fra i turni; banner **reazioni**; controlli GM per riga (danno/cura/`＋stato`);
  **F5 Conseguenze** a fine scontro (PF ai PG, avanza fronte, marca Incontro risolto — origine
  tracciata da F2); persistenza nel `data.json`.
- **Statblock nativo** (`renderStatblock`): CA/Iniziativa/PF/Velocità, **caratteristiche in
  tabella 2024** (Punteggio·Mod·TS, doppia colonna), abilità/sensi/lingue, difese, GS, sezioni in
  prosa Markdown. Due superfici: `StatblockModal` (click su un combattente) e blocco
  `` ```gdr statblock ``. `scaffold_statblock` genera una base dal GS.
- **Condizioni "vere"**: `gen_condizioni.py`→sidecar; il plugin risolve via `risolviCondizioni()`
  → `defs` passati ai comandi (prono/avvelenato→svantaggio, afferrato→velocità 0, buff…).

### Homebrew giocabile al tavolo (Rotta homebrew)
`RawMostro` è il **contratto**: SRD e homebrew sono "solo dati nello schema". Il plugin
**scopre** l'homebrew del vault e lo fonde col bundlato — creature (`homebrewCreature` →
`bestiarioCompleto`, `categoria: creatura` + blocco `` ```gdr statblock `` inline) e
condizioni/effetti (`homebrewCondizioni` → `condizioniComplete`, `categoria: condizione` +
`effetti`/`attivita` nel frontmatter, che **mordono** come le SRD). Validazione:
`validaRawMostro` inline nel blocco + comando batch. Contratto completo e forme di authoring in
**[schema_homebrew.md](schema_homebrew.md)**.

---

## Migrazione dati archivio (in corso)
`archivio` migra al **doppio-file**: `<slug>.yaml` (dati) + `<slug>.md` (prosa, frontmatter
`id`), legati per **id qualificato** `dnd.<tipo>.<slug>`. Vale per tutto ciò che ha prosa
(condizioni fatte; mostri a seguire). Il plugin/motore è **tollerante**: i ref risolvono sia per
id qualificato sia per slug nudo (`risolviCondizioni`/`risolviAzione`, `norm_ref` in `srd_links`).

## Validazione & regole operative
- `validate.py check()`: confine core-only (`tavolo`/`states`) vs system-only
  (`scheda`/`caratteristiche`/`abilita`); dup-ID; snake_case (eccetto `fc-*` di Calendarium);
  shape; schema wizard; reciproci; uguaglianza byte delle sorgenti `_*.js`. Dati archivio:
  `archivio/tools/validate_archivio.py` (gate a build/CI).
- **Verifica**: `npm test` (pytest) + `npm run check`; il **rendering reale dei plugin** va
  confermato aprendo `dist/GDR-vault` in Obsidian dopo un build.
- Build/commit/push **solo con ok esplicito**; MAI build sul vault utente né `rm` su `dist`.

## Sito dei giocatori (output separato)
Bottone in-app **«Genera sito»** (`genera_sito.js`, unico esportatore): sito statico HTML
**spoiler-free** in `Sito-giocatori/` da `Mondi/`. Esclude segreti, campi DM, blocchi dinamici e
`dice:`, note `visibilita: dm`/`pubblico: false`.
