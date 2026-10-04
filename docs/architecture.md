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
                            ├─ gen_catalogo.ts (kernel)      SRD/            (sola lettura)
                            ├─ gen_bestiario/condizioni.py   Home/Indici/…
                            ├─ render_config/  validate.py   Mondi/          (i tuoi)
```

## Ecosistema a 4 repo

Sotto `~/Documents/Sviluppo/projects/`:

| Repo | Ruolo | Remote |
|---|---|---|
| **archivio** | DATI SRD 5.5e (YAML+MD) + libri/mappe. Fonte-dati unica, multi-consumatore. | ✅ privato |
| **regole** | Motore 5.5e in TS: primitive (`lib`) + creatore (`creatore`) + combattimento event-sourced (`motore`). **UI-agnostico**, testato. | ✅ privato |
| **GDR** | Questo repo (pubblico): vault + plugin. Consuma la copia vendorizzata di `archivio/srd` + `regole`. | ✅ |
| **Compendio** | App Astro/Preact (catalogo/creatore web). Consuma `archivio` + `regole`. | ✅ |

**Wiring**: in dev, `archivio` e `regole` sono **symlink gitignorati** dentro `GDR/`.
esbuild segue il symlink `regole/` e **bundla** la catena TS del motore in `plugin/main.js`.
I dati NON vengono dall'archivio (privato) ma dalla sua **copia vendorizzata**
`Dev/Source/SRD/` (= `common.SRD_DIR`, solo `srd/`, CC-BY-4.0): la leggono `build_srd.py` e
i generatori (`gen_*.py`), che scrivono i **sidecar** in `plugin/data/` (gitignorati,
rigenerabili). `sync_srd.py` la aggiorna dall'archivio accanto (specchio esatto: nuovi,
cambiati, spariti; la licenza resta); `--check`, il job CI `deriva-srd` e
`tests/test_sync_srd.py` segnalano quando resta indietro. Così GDR si costruisce da un
clone pulito senza l'archivio.

---

## Pipeline di build (`render.py build()`)

`build()` è un orchestratore sottile di funzioni nominate (nessun monolite); la logica sta nei
moduli, tutti importano `common` (nessun ciclo):

| Modulo | Responsabilità |
|---|---|
| `common.py` | Percorsi, IO, e il **modello**: `deep_merge`, `load_core`, `load_templates`, `load_pages`, `apply_entities`. |
| `build_srd.py` | Genera l'albero `SRD/` (sola lettura) dalla copia vendorizzata `Dev/Source/SRD/`. Al confine (`_load_archivio`) i riferimenti puntati `dnd.<tipo>.<slug>` si proiettano sullo slug, la chiave di tutto GDR; l'`id` della voce resta qualificato per l'id-index. `srd_note` rende il contenuto (infobox, sezioni, potenziamento, evocazioni inline, footer *Vedi anche*). Le pagine mostro emettono `` ```gdr statblock <id> ``. Fonte UNICA = la copia di `archivio/srd`. |
| `gen_catalogo.ts` | Il catalogo del creatore del PG (`plugin/data/srd_catalogo.json`) dalla copia SRD, con `catalogoDa` del kernel (lo stesso costruttore del Compendio). |
| `gen_bestiario.py` / `gen_condizioni.py` | Sidecar del motore (`plugin/data/srd_bestiario.json`, `srd_condizioni.json`) dalla copia SRD. |
| `sync_srd.py` | Aggiorna la copia vendorizzata `Dev/Source/SRD/` da `archivio/srd` (solo quella cartella); `--check` per la deriva. |
| `archivio_io.py` | **Lettura unica dei file in formato archivio** (la copia SRD) per i generatori: `.yaml` (entità) e `.md` (note con prosa, corpo → `descrizione`), tipo riconosciuto dall'id `dnd.<tipo>.…`, mai dal nome-file. Nato dopo che i vecchi glob a suffisso (`*.spell.yaml`…) leggevano 0 file e il plugin usciva vuoto con la build verde (set 2026); `tests/test_generatori_plugin.py` ne tiene le soglie. |
| `render_config/` | Config `.obsidian` (merge non distruttivo, un writer per plugin), bottoni/fileClass dal modello, viste **Bases**, CSS colore-categoria. |
| `validate.py` | `check()`: confine core/system, dup-ID, snake_case, shape, schema wizard, inversi reciproci, uguaglianza byte delle sorgenti `_*.js`. |

Fasi di `build()`: (1) carica il modello; (2) `write_engine_data()` scrive `core.json`
+ copia i JS runtime + bundla `views.js`/`meta_actions.js`; (3)
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
`YAML/assi/<id>.yaml`. Overlay: `templates.yaml` (solo `actions`), `pages.yaml`
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
  `create_entity.js` (entità uniformi, schema da `core.json`); il **PG** lo crea il kernel
  (`plugin/creatore.ts`, sotto). Il template Jinja porta un marcatore `<% await tp.user.crea_<id>(tp) %>`
  che il plugin **sostituisce** col frontmatter.
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
`_relations`) sono **sorgenti canoniche condivise**: gli script autonomi ne
tengono una COPIA fra marker, e `check()` impone che sia **byte-identica** (la deriva è un errore
di build, non un bug latente).

---

## Rules-engine PG (5.5e)

Il PG è un **libretto del kernel**: la base del 1º livello + un passo per livello
(`regole/src/creatore/libretto.ts`), salvato nella nota in `libretto`. Una catena sola, dalla
creazione al tavolo:
```
copia SRD ──gen_catalogo.ts (catalogoDa del kernel)──▶ srd_catalogo.json
                       + homebrew del vault (plugin/homebrew.ts) = catalogoCompleto()
                                   │
   creatore.ts (guida del kernel) ─┼─▶ libretto nella nota ──scriviPg──▶ campi della scheda
                                   ├─▶ Board: combattenteDiPg (assembla → daAttore)
                                   └─▶ viste della scheda (kernel = {catalogo, armi})
```
- **Creazione e salita**: le domande le decide la **guida** del kernel (`creatore/guida.ts`, la
  stessa del creatore del Compendio); `plugin/creatore.ts` le pone coi modali (comandi «Crea PG»
  e «Sali di livello»). Multiclasse, sottoclassi, talenti e incantesimi passano da lì.
- **Frontmatter** (`plugin/pg.ts`, `scriviPg`): i campi derivati li riscrive il codice dal
  libretto (PF, CA, caratteristiche, flag `ts_<car>`/`prof_<abilita>` per la matematica Meta
  Bind, `mod_<car>` per i tiri Dice Roller, slot, `risorse_pg`, incantesimi per NOME). Lo stato
  di gioco (PF attuali, slot e usi spesi) resta e la Board lo riporta (`risorseDaNota`/
  `notaDaRisorse`). Una risorsa che torna in parte col riposo breve (l'Ira: un uso) porta
  `breve: N`, e il riposo breve del vault ne rende N.
- **Homebrew**: classi, specie, background, talenti, sottoclassi e incantesimi del vault entrano
  nel catalogo del kernel (`plugin/homebrew.ts`, `concede` tradotto in effetti).
- **Presentazione** (`scheda_pg_rules()` + viste): caratteristiche/abilità con tiri Dice Roller
  col bonus reale, risorse a barre (`renderRisorsePG`), riposi (loop di sessione 2024). Le viste
  con dati di regola li ricevono dal plugin (`_panels.mjs`, `kernel: true`): progressione coi
  privilegi di classe e sottoclasse (`renderProgressione`), incantesimi per livello con CD e
  attacco dalla caratteristica della classe (`renderIncantesimi`), la nota della specie
  incorporata (`renderSpecieTratti`), attacchi con maestria dalle armi SRD + homebrew
  (`renderAttacchi`). Nessun dato di regola scritto dalla build per la scheda.
- **PG senza libretto** (creati prima del kernel): restano giocabili (scheda, Board via
  `daPgGdr`), ma per salire di livello si ricreano. `build_personaggio`, `personaggio.json`,
  `pg_rules.yaml`, `crea_pg.js` e `sali_pg.js` sono ritirati.
- **Lo spazio**: il combattente del kernel porta `taglia`, `velocita` e la `distanza` (portata,
  gittata) delle azioni d'attacco e degli incantesimi; `gen_incantesimi.py` tiene la `gittata`,
  `homebrew.ts` legge quella scritta a mano (`gittataHomebrew`). Il motore resta relazionale:
  questi dati servono a chi propone ingaggi e zone da una mappa. Il tiro per colpire del
  kernel accetta un contesto di distanza (`distanzaDelTiro`: portata, gittata lunga, nemico
  vicino); la Board glielo passa dalla scena di Atlas collegata (sotto, «Il ponte con la Board»).
  Prova headless: `npm run smoke:pg` (anche in `tests/test_pg_kernel.py`).

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
  PG del vault; iniziativa/turni; pannello del turno (economia, azioni principali e **bonus**,
  **attivabili** e aure a zona, **relazioni** mischia/opportunità/copertura, incantesimi con
  livello di slot o cariche e **variante**); **leggendarie** fra i turni; banner **reazioni**
  (Resistenza Leggendaria, reazioni d'oggetto, **parate**); controlli GM per riga (danno con tiro
  di concentrazione, cura, PF temporanei, `＋stato`, tiri contro morte), condizioni barrate se
  immuni; **riposi** del gruppo. Ciò che si mostra PRIMA di agire lo dice il motore
  (`opzioniLancio`, `motivoAzioneBloccata`, `statoAttivabile`), lo stesso della plancia del
  Compendio. Prova headless: `npm run smoke:board` (jsdom + `Dev/Tools/obsidian-finto.ts`);
  **F5 Conseguenze** a fine scontro (PF ai PG, avanza fronte, marca Incontro risolto — origine
  tracciata da F2); persistenza nel `data.json`.
- **Statblock nativo** (`renderStatblock`): CA/Iniziativa/PF/Velocità, **caratteristiche in
  tabella 2024** (Punteggio·Mod·TS, doppia colonna), abilità/sensi/lingue, difese, GS, sezioni in
  prosa Markdown. Due superfici: `StatblockModal` (click su un combattente) e blocco
  `` ```gdr statblock ``. `scaffold_statblock` genera una base dal GS.
- **Condizioni "vere"**: `gen_condizioni.py`→sidecar; il plugin risolve via `risolviCondizioni()`
  → `defs` passati ai comandi (prono/avvelenato→svantaggio, afferrato→velocità 0, buff…).
- **Tavolo virtuale (Atlas VTT, terzo, non critico, solo desktop)**: solo mappa, token, nebbia
  e vista giocatori; PF, turni e condizioni restano alla Board. Atlas non ha API pubblica: il
  contatto passa per i file. (1) Le pagine mostro SRD portano `name` e `hp` (PF medi,
  `build_srd.pf_medi`, la regola di `puntiFeritaCalcolati` del kernel), nella forma che Atlas
  legge da una nota-statblock. Ma Atlas (verificato sul sorgente della 0.5.0, la versione
  fissata) offre da collegare ai token e da importare come token SOLO ciò che passa da Fantasy
  Statblocks (`useStatblockEntries`, `requireResolvedBestiary`), che il vault non usa: senza
  quel plugin il collegamento non è raggiungibile, e i campi restano pronti e inerti. (2) Le
  scene sono file `.atlasmap` (JSON, schema `atlas-vtt` v4, riscritto da Atlas entro 0,5 s da
  ogni modifica). Dalla 0.5.0 un token porta lo schieramento (`side`: `players`/`opponents`) e
  le risorse in `resources` (i PF non stanno più in `hp`); l'azione
  `collega_mappa_battaglia` (bottone `collega-tavolo`, Luogo e Incontro) le elenca dal vault e
  scrive il link in `mappa_battaglia`. **Perimetro** (deciso ott 2026): Atlas più la Board fanno
  il tavolo dal vivo (GM al portatile, giocatori sulla finestra di Atlas su un secondo schermo);
  il gioco online non è un obiettivo, Atlas non ha rete e non gliela si costruisce. Non usati: il tracker d'iniziativa di Atlas (doppione
  della Board) e l'importazione «da statblock» (richiede Fantasy Statblocks).
  **Il ponte con la Board** (verificato sul sorgente di Atlas 0.5.0, provato su scene scritte dal
  suo codice): (a) *lettura*. Atlas salva la scena nel `.atlasmap` stesso con l'API del vault
  (`vault.create`, poi `vault.process`, 500 ms dopo l'ultima modifica), quindi il plugin la sente
  con gli eventi `create`/`modify`. `plugin/atlas.ts` la legge (`leggiScenaAtlas`: rifiuta un
  formato più nuovo del 4, come Atlas; metri per casella dalla griglia, 5 piedi = 1,5 m se non
  dice niente; i token con nome, copia, taglia, `side`, nascosto) e abbina i token ai combattenti
  per **nome** (`abbinaToken`: Atlas 0.5 non lega un token a una nota senza Fantasy Statblocks;
  le copie in ordine, «Goblin (2)» è la copia 2). La geometria del kernel
  (`regole/src/motore/geometria.ts`) ne fa i metri e i nemici vicini di un tiro
  (`contestoDaPosizioni` → `distanzaDelTiro`). Prova: `npm run smoke:atlas` (in pytest), sulle
  scene di `tests/fixtures/atlas/`, che si rigenerano col codice di Atlas
  (`genera_scene_atlas.test.ts.txt`). (b) *dal vivo e in scrittura*: la vista di Atlas espone
  `getStore()` (lo store della scena, con le sue azioni, che Atlas salva da sé) e
  `reloadActiveScene(riscrivi)` (riscrive la scena aperta in sicurezza: salva il sospeso, ferma i
  salvataggi, riscrive, ricarica). Sono interni di Atlas, non un'API promessa: il ponte poggia sul
  file, e questi si useranno solo se presenti. (c) *nella Board* (`board.ts`): la scena è quella
  scelta a mano (**Cambia scena…**, `boardScena` nei dati del plugin, svuotata da Reset e da un
  nuovo schieramento), altrimenti la `mappa_battaglia` dell'Incontro d'origine o del suo `luogo`.
  La Board la rilegge sugli eventi del vault (`modify` del file, `create`/`delete`/`rename` di un
  `.atlasmap`, `changed` della nota d'origine) e la riga **Mappa** dice quanti sono sulla griglia e
  chi è senza token. Ogni tiro riceve il contesto (`contestoDaPosizioni`, casella della scena):
  azioni, multiattacchi, leggendarie e attacchi degli incantesimi (`contesti` per bersaglio). I
  picker dei bersagli dicono i metri; un attacco che non arriva (`fuoriTiro` del kernel: un
  multiattacco solo se nessun colpo arriva) non parte e un avviso dice perché, senza spendere
  azione, slot o pozzo. **Schiera dalla mappa** riconosce i token senza combattente
  (`riconosciToken`: PG del vault, poi bestiario, per nome) e li schiera col lato del token (i PG
  alleati; i nascosti non spuntati); i nomi senza riscontro si segnalano. Limiti: muri, linea di
  vista e copertura restano dichiarazioni del GM, l'area di un incantesimo la decide il GM (un TS
  non si rifiuta per distanza), su griglia esagonale nessuna distanza. Prova: `npm run
  smoke:board-mappa` (in pytest), la Board vera sulle stesse scene.

### Homebrew giocabile al tavolo (Rotta homebrew)
Il **contratto** (RawMostro per le creature, `effetti`/`attivita` per le def) vale per SRD e
homebrew: sono "solo dati nello schema". Il plugin **scopre** l'homebrew del vault e lo fonde col
bundlato, con lo STESSO rituale per ogni entità (`homebrewX` → `Xcompleti` = SRD + vault):
- **creature** (`categoria: creatura` + blocco `` ```gdr statblock ``);
- **condizioni** (`categoria: condizione` + `effetti`/`attivita`, che **mordono** come le 15 SRD);
- **incantesimi** (`categoria: incantesimo` + `attivita`; sidecar SRD `gen_incantesimi.py`;
  `RisolviIncantesimo` passato a `daMostro` → le creature lanciano coi loro numeri);
- **oggetti-effetto** (`categoria: oggetto` + `effetti`; sidecar SRD `gen_oggetti.py`) →
  picker **«🎒 Equipaggia»**, un Active Effect sul portatore (riusa la macchina condizioni).

La meccanica delle def si autora nel frontmatter **o** in un blocco `` ```yaml `` del corpo
(`estraiDefBody`); i template «Crea …» la scaffoldano (⚙️ Meccanica). **Offensiva PG**: i PG
schierati derivano i bottoni d'attacco dalle `padronanze_armi` (`gen_armi.py` +
`adapters.ts:azioneDaArma`), non più manuale. **Validazione** unica: «Valida l'homebrew del
vault» copre tutte e quattro le entità. Contratto e authoring in
**[schema_homebrew.md](schema_homebrew.md)**; il piano entità-per-entità è nella roadmap di memoria.

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
  `archivio/tools/validate_archivio.py` (ogni file si apre) e `npm run valida` di Compendio
  (le regole sui dati: una copia sola).
- **Verifica**: `npm test` (pytest) + `npm run check`; il **rendering reale dei plugin** va
  confermato aprendo `dist/GDR-vault` in Obsidian dopo un build.
- Build/commit/push **solo con ok esplicito**; MAI build sul vault utente né `rm` su `dist`.

## Sito dei giocatori (output separato)
Bottone in-app **«Genera sito»** (`genera_sito.js`, unico esportatore): sito statico HTML
**spoiler-free** in `Sito-giocatori/` da `Mondi/`. Esclude segreti, campi DM, blocchi dinamici e
`dice:`, note `visibilita: dm`/`pubblico: false`.
