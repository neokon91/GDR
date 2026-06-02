# Analisi & Roadmap

Brief di stato e priorità per riprendere il lavoro. Quattro lenti (PM, Architect,
Worldbuilder, DM 5/5.5e) + backlog prioritizzato. Lo stato tecnico dettagliato è
in [architecture](architecture.md) / [data_model](data_model.md) /
[rules_layer](rules_layer.md) / [play_layer](play_layer.md) / [plugin_contracts](plugin_contracts.md).

> Aggiornata a sessione **2026-06-01**. **Fasi 1-2 coperte** + rifiniture di questa sessione:
> **quick-win architetturali** (3 thin-shell jinja eliminati, `build()` spezzata in helper),
> **note SRD complete** (creature evocate inline, footer *Vedi anche*, de-dup prose),
> **auto-riscrittura del blocco encounter**, **timeline navigabile** (pannello *Linea del
> tempo* sulla pagina Cronologia) e **tab Mappe** su luogo/mondo. Doc plugin **completa**
> (21 schede). **36 categorie, 20 con assi.** Tutto committato/pushato/buildato su
> `origin/main` (HEAD `c600232`), **164 test verdi**, check 0. *L'esperienza in-app resta in
> gran parte da confermare (rischio #1, QA deferita su scelta utente — ci si appoggia ai test).*

## 🚦 Verdetto beta — analisi 4 lenti (2026-06-01, HEAD `1b02340`)

Nuova analisi a 4 prospettive indipendenti sullo stato attuale (post: guscio js-engine,
plugin Folder Notes/Tasks/Calendarium, statblock 5.5e completo, cartella Media). **Verdetto
convergente: PRONTO-CON-RISERVE per un beta CHIUSO e PICCOLO (3-5 tester, meglio con un minimo
di confidenza Obsidian); NON-ANCORA per un beta aperto.**

**Il blocco #1 è unanime (Worldbuilder + DM + PM): manca il MONDO-ESEMPIO popolato.** Il vault
parte dal foglio bianco — `Mondi/` ha solo le note-cartella indice, zero contenuto → tutte le
dashboard di Home (Fronti/Cronologia/Trame/Note-per-categoria) e gli indici si rendono **vuoti**
(sembra "spento/rotto"), la profondità dell'ontologia è invisibile, e il **LEGGIMI cita note che
NON esistono** (`Mondi/Creature/Goblin`, `Mondi/Incontri/Imboscata sulla Strada` — §righe 85-88):
link morti nel primo passo guidato. Un mini-mondo curato (~8-15 note che attraversano gli strati,
incluse Goblin + Imboscata) risolve in un colpo: foglio bianco + link morti + dashboard vuote +
time-to-first-win.

**Il blocco #2 (Architect, + caveat di DM e PM): QA in-app.** ✅ **Smoke test in-app eseguito
(2026-06-01b)**: verificati in Obsidian — Home/tab-panels; **statblock 5.5e** (initiative, saves/
abilità con label IT, resist./immunità, GS con PE+CB); **statblock 5e via `monster:`** (due tab a
dati condivisi → FS risolve la creatura); **note-cartella** (clic cartella → indice + Dataview +
bottone Crea); **Media** (icona) + Iconize; **wizard di creazione** (`create_entity`: bottone Crea
→ Templater → modali → nota + rename, con fallback per vault vuoto); **chain `meta_actions`** (bottone
**Collega** → legame tipizzato **reciproco** scritto in frontmatter via `processFrontMatter`).
**Due bug trovati e CORRETTI**: (1) radar reattivo `meta-bind-js-view` → `META_BIND_ERROR`
(Meta Bind 1.4.x) → convertito a `js-engine`/`boot.radar`; (2) statblock con `name: Untitled`
(`<% tp.file.title %>` è uno snapshot pre-rename di Templater → ogni creatura si registrava come
"Untitled") → `<% tp.config.target_file.basename %>`. *Restano da provare gli altri path mutativi
(sali_pg/aggiorna_encounter/scatena/applica_profilo — stesso chain meta_actions, già validato con
Collega) idealmente creando un PG + un incontro dai bottoni.*

### Checklist pre-beta (prioritizzata)
**Bloccanti:**
1. **Mondo-esempio popolato** (sforzo medio, opt-in/cancellabile in `Mondi/Esempio/`): Mondo + 2-3
   Luoghi (uno con mappa) + 1-2 Fazioni con clock + 2-3 PNG (uno col tema natale) + 1 PG + **Goblin**
   + **Imboscata sulla Strada** + 1-2 Eventi datati + 1 cosmologia/divinità/culto collegati.
2. ✅ **LEGGIMI riallineato**: link morti Goblin/Imboscata tolti (→ SRD/flusso Crea) + §2 corretto
   [`7babc61`]; LEGGIMI **in vista** (bookmark + callout in cima a Home) + blocco beta [`e2e31e4`].
3. **Smoke test in-app** — ✅ fatto: rendering (statblock 5e/5.5e, radar, folder-notes), **wizard di
   creazione** e **chain meta_actions** (Collega) — 2 bug corretti. *Resta (basso rischio)*: gli
   altri bottoni mutativi (sali_pg/aggiorna_encounter/scatena/applica_profilo) creando un PG + un
   incontro dai bottoni — stesso chain di Collega, già validato.

**Quasi-gratis — ✅ FATTI** (`e2e31e4`):
4. ✅ **Legami tipizzati** aggiunti: `luogo`→{bioma,cultura,piano}; `divinita`→piano;
   `evento`→{divinita,culti}; `cultura`→specie; `specie`→{luogo,culture}.
5. ✅ **Label "Mortale ☠️" rimossa** (non-2024) in `views.renderEncounter` → solo Bassa/Moderata/Alta
   (oltre budget Alta = avviso, non tier).
6. ✅ Blocco **"stai testando una beta"** nel LEGGIMI (cosa è acerbo + feedback) + callout in cima a
   Home che linka il LEGGIMI + **LEGGIMI nei bookmark** (chiude anche "LEGGIMI in vista" del blocco #2).

**Post-beta / medio sforzo:** ✅ **risorse combattimento FATTE** (PF temp, TS morte, tabella slot,
Riposo lungo — `205af81`, verificate in-app); ✅ **ponte Calendarium FATTO** (`evento`→`fc-date`,
callout *Calendario*; `73041f5`, verificato in-app: evento datato → calendario); ✅ **generazione
nomi (FCG) FATTA** (suggester inline `@` + bottone Genera su PNG/luogo/fazione; `e591a5d`,
verificato in-app); ✅ **generatore homebrew IT** (`0b6e6ad`) + **FCG italianizzato** (`53e20b1`);
✅ **solidità JS** — cache `core.json` (views/boot) + **guard anti-drift** `matchesCond`
(test-guardia, non modulo condiviso) (`a876bcc`); ✅ **famiglie→preset assi** (la famiglia
pre-compila gli assi, stile archetipi; `75814c1`); ✅ **epoche sul calendario** (intervallo
`fc-date→fc-end`; `cfbbf13`). Restano: spell management inline; assi allo strato cosmico;
report gap copertura categorie; plugin/YAML lato UI (Metadata Menu/mappe/Initiative, da QA).

### Una riga per lente
- **🌍 Worldbuilder** — *pronto-con-riserve*. Ontologia profonda e in più punti avanti su
  Obsidian-TTRPG-Community/FantasyWorld (strato cosmico, tema natale, assi-carattere, guida
  tassonomica). Riserva: profondità invisibile al primo avvio → mondo-esempio.
- **🎲 DM 5.5e** — *pronto*. Statblock 2024 fedeli, PG SRD-completo, level-up 2-20, condizioni/budget
  incontri corretti, **risorse combattimento** (PF temp/TS morte/slot/Riposo lungo). Riserve DM
  originali tutte chiuse (link-morti ✅, label Mortale ✅, tracking risorse ✅). Resta opz.: spell mgmt inline.
- **🏗️ Architect** — *pronto-con-riserve*. Single-source validata, pipeline idempotente, merge
  config non distruttivo, guscio JS isolato, test su logica reale. Riserva unica forte: **zero
  copertura runtime** (i 199 test danno falsa sicurezza) → smoke test in-app.
- **📣 PM** — *non-ancora per beta aperto; chiuso-con-caveat dopo i 3 bloccanti*. Flusso
  ZIP+trust-prompt solido, onboarding ben scritto, ma foglio bianco + link morti + LEGGIMI non in
  vista affossano i primi 10 minuti.

## Dove siamo (sintesi)

Pipeline matura: sorgenti YAML/Jinja/JS → `render.py` (modulare) → `dist/GDR-vault`.
Modello fuso core+system+entities (**36 categorie**, 20 con assi), **trinità per-entità**
(YAML + Jinja `_entity_base` + `crea_<id>.js`), assi scorporati in `YAML/assi/<id>.yaml`
(formato ricco 1-5) con **archetipi** (combinazioni di valori-assi → tag, in creazione e
in nota). **Grafo cosmologico** connesso. Differenziatore: **superficie giocabile** su ogni
nota lore (`uso_al_tavolo`/`gancio`/`pressione`/`prossima_mossa`) + **clock & conseguenze**
(un fronte pieno crea un evento → muove il mondo) + **timeline** (eventi per epoca) e **mappe**
(tab Mappa su luogo/mondo). **Rules-engine PG 1-20** (creazione SRD-completa + sali di livello
interattivo: PF/competenza/slot + ASI/sottoclasse/incantesimi). **Difficoltà incontri** (budget
XP 2024 vs GS delle creature) + **auto-riscrittura del blocco `encounter`**. SRD 5.2.1 IT
(1389 note + 334 statblock, ogni voce rende tutto il JSON). Pannelli **JS Engine** (`views.js`:
Vista, radar assi, profilo, clock, difficoltà incontro, progressione, linea del tempo, mappa,
quick-ref condizioni, tema natale, rete collegamenti). **Note stile wiki**: infobox con
tabella-fatti + ritratto (immagine), tabelle di relazione.
Indici **Bases** `.base` + hub Dataview; dashboard auto **Ponte Mondo↔Sistema** e **Fronti**.
Home a 2 aree, Homepage, **164 test**, check 0. **Stadio prodotto: scaffold ricco e profondo;
l'esperienza in-app è in gran parte da confermare (QA deferita su scelta utente).**

## 🎯 Visione: due suite integrate ma separate

Il vault è **due prodotti che condividono la stessa pipeline e si parlano**, con superfici
distinte e riconoscibili:
- **Suite Worldbuilding** — mondo *profondo e connesso*: ontologia ricca, relazioni
  tipizzate, assi-carattere, timeline, mappe, pantheon/cosmologia. Metro: profondità e
  coerenza.
- **Suite DM (gestione gioco + sistema)** — *al tavolo* e *regole 5.5e*: SRD, statblock,
  incontri/iniziativa, dadi, rules-engine PG 1-20, clock/conseguenze, difficoltà incontri.
  Metro: immediatezza e correttezza di sistema.

**Integrate ma separate**: si collegano (una creatura del mondo alimenta un incontro, un
luogo fa da scena, un fronte muove la trama) ma restano due esperienze distinte. La
roadmap tiene le due colonne separate e segna dove si incrociano. **Direzione di fondo
(scelta utente)**: finire le *fondamenta* di entrambe le suite **prima** di costruirci
sopra i sistemi avanzati (vedi backlog).

## 🧭 Senior PM

- **Valore**: prodotto mono-utente (DM/worldbuilder) che connette mondo profondo e
  tavolo 5.5e. Il differenziatore (superficie giocabile + assi-carattere visualizzati)
  è chiaro e *mostrato* (radar); ora rinforzato da **timeline** e **mappe** (worldbuilding)
  e dall'**auto-encounter** (tavolo).
- **Rischio #1 — debito di verifica in-app (standing)**: tutta la pipeline è *generata* e
  *poco confermata* in Obsidian. Su scelta utente la **QA in-app è deferita**: ci si appoggia
  ai **164 test** (generazione + wizard/renderer JS via node), che però **non coprono il
  runtime Obsidian** (Meta Bind/Dataview/Templater/JS Engine). Il vecchio bug
  `views.renderEntityPanel` ricorda che certi bug vivono solo nel runtime. *Va fatta prima o
  poi*, idealmente a blocchi (PG/sali-livello; clock→conseguenza; incontro+aggiorna-encounter;
  timeline; mappe).
- **Propagazione**: la *logica* vive in `views.js` (importata a runtime → si propaga alle note
  senza ricrearle); ✅ il **guscio** nel corpo è ora **una riga** che importa `boot.mjs` (ESM)
  e gli delega il pannello per nome — eliminato il blocco loader ripetuto (~1000 righe in meno
  nelle note generate). ✅ **Verificato in-app** (smoke test): `engine.importJs("…/boot.mjs")`
  risolve l'ESM (export `panel`/`radar`), `panel→renderCondizioni` popola il callout e
  `radar` disegna l'SVG degli assi. Resta separata la sola *reattività live* del radar
  `meta-bind-js-view` (binding Meta Bind, già da QA prima di questo cambio).
- **Onboarding**: il **LEGGIMI** è completo (3 passi + setup + tassonomia "quale categoria
  quando"). **Distribuzione = vault ZIP** (scelta utente): il tester apre → *trust prompt* →
  plugin abilitati, niente install manuale (LEGGIMI riscritto per questo flusso). Resta
  opzionale un **mondo-esempio** pronto per chi vuole "vedere" prima di creare.
- **Core loop** sessione → incontro → fronti: i pezzi ci sono e più fluidi (auto-encounter,
  clock→conseguenza); resta da confermare in-app la catena completa.
- **Priorità (direzione utente)**: **fondamenta delle due suite + Fase 2 sostanzialmente
  fatte**. Prossimo valore: rifiniture (quick-ref condizioni, level-up avanzato) e **recuperi
  FantasyWorld** (#9 tema natale ✅ fatto; restano legami cosmo, glossari subtypes residui,
  alberi evolutivi). La **QA in-app** resta igiene *continua* deferita (rischio #1).

## 🏗️ Architect

- **Pregi**: trinità per-entità + **assi scorporati** (file entità snelli, assi come
  glossario coeso). `render.py` **snello** — `build()` orchestratore (~25 righe) che delega a
  helper nominati (`write_engine_data`/`render_notes`/`write_obsidian_config`/…), moduli
  common/build_srd/build_personaggio/validate, merge lossless, validazione forte
  (confine/dup/snake/shape/entity-schema/assi). Snapshot + e2e wizard/renderer via node
  (PG/caster, preset, level-up, profilo, clock, incontri, **timeline**, **mappa**,
  **condizioni**, **srd_note**, **aggiorna_encounter**). Test (**164**, ridondanti sussunti dagli snapshot).
  Nuova entità = 1 YAML (+1 assi); Jinja solo per layout custom (default `_entity_base.j2`).
- **Debito/fragilità**:
  - ✅ **Guscio js-engine ridotto** (ultimo residuo architetturale): introdotto
    `Dev/Source/JS/boot.mjs` (modulo **ESM**, caricato con `engine.importJs`) che concentra il
    caricamento CommonJS di `views.js` (`new Function`), la risoluzione `dv`/`page` e
    `engine.markdown.create`. Il corpo nota passa da ~8 righe a **una** per pannello
    (`.panel(engine, app, container, "renderX")`); ~1000 righe di boilerplate in meno negli
    snapshot. `new Function` ora vive in **un solo posto**. ✅ **Verificato in-app** (smoke
    test: `importJs` risolve l'ESM, `panel→renderCondizioni` popola, `radar` disegna l'SVG).
    *(Thin-shell, `build()`, doc-plugin: ✅ chiusi sotto.)*
  - ✅ **Thin shell Jinja eliminati**: il default `_entity_base.j2`
    (`common.DEFAULT_JINJA`) è ora l'unico guscio condiviso; i 3 file
    `cultura`/`lingua`/`nota.md.j2` (solo `{% extends %}`) sono stati rimossi e le
    relative entità ereditano il default (output dei modelli byte-identico).
  - ✅ **`build()` spezzata**: da ~184 righe a un orchestratore di ~25 che delega a
    helper nominati (`write_engine_data`/`render_notes`/`write_obsidian_config` con un
    writer per plugin/`scaffold_folders`). Refactor a output invariato (manifest del
    vault byte-identico).
  - ✅ **Doc plugin completa**: `Dev/Reference/` ha **21 schede** — una per ogni plugin
    cablato (core/templater/dataview/meta-bind/js-engine/tab-panels/metadata-menu/
    fantasy-statblocks/tasks/dice-roller/**bases**/**callout-manager**/**iconize**/
    **homepage**/initiative-tracker/calendarium/excalidraw/zoom-map/
    fantasy-content-generator/brat), coi gotcha (es. callout collassati).
  - **Test**: **164 verdi** ma coprono la *generazione* (+ wizard/renderer JS via node), non il
    runtime Obsidian (Meta Bind/Dataview/Templater/JS Engine) — gap inerente, colmabile solo con QA manuale.

## 🌍 Worldbuilder

- **Pregi**: ontologia ricca (36 categorie, grafo cosmologico connesso), **classificazione a 2
  livelli** (famiglia tematica curata + tipo, su **14 entità**, con legenda auto-documentante),
  relazioni tipizzate, **assi tematici 1-5 con etichette+descrizioni** (seed FantasyWorld,
  formato "fatto bene"; **~8 per entità** dopo l'integrazione assi FW) + **radar** di
  carattere e **confronto fra entità**. Entità lore arricchite bespoke (luogo/mondo/
  fazione/cultura/oggetto/creatura/cosmologia/personaggio). **Template reattivi**: gli slider
  del Carattere mostrano l'**etichetta-valore attiva** (es. *4 · Gerarchico*) e l'header un
  **ritratto calcolato** (icona categoria + campi-scheda), entrambi `VIEW` Meta Bind che si
  aggiornano live col frontmatter; il **radar** ora è `meta-bind-js-view` (si ridisegna mentre
  muovi gli slider — *reattività da confermare in-app*, con fallback al frontmatter se i binding
  non popolano).
- **Gap per mondi profondi**:
  - ✅ **Timeline/storia**: la categoria **epoca** + la **vista cronologica** ora ci sono —
    pagina *Cronologia* col pannello **Linea del tempo** (`views.renderTimeline`): eventi
    raggruppati per epoca (callout pieghevoli), ordinati per `quando`. ✅ **Calendario vero
    e proprio**: `evento` emette `fc-date` → compare su **Calendarium** (callout *Calendario*,
    `73041f5`, verificato in-app). Il calendario del mondo si crea in-app dai preset (opt-in).
    ✅ **Timeline CAUSALE**: coppia direzionale `evento.causato_da ↔ conseguenze` + tab
    *Catena causale* (`views.renderCausalita`): a monte le cause, a valle ciò che l'evento ha
    innescato, ricostruite ricorsivamente nelle due direzioni.
  - ✅ **Geografia spaziale**: `luogo.confina_con` (adiacenza simmetrica) + tab *Dintorni*
    (`views.renderDintorni`): regione contenitore, luoghi contenuti, confinanti e **distanza
    in confini** calcolata via BFS, più le rotte. Dashboard **Geografia** (contenimento +
    confini + rotte). *Residuo*: coordinate vere / auto-pin Azgaar→`markers.json` (rinviato).
  - ✅ **Economia/risorse**: categoria **risorsa** + relazioni `luogo.{produce,dipende_da,
    rotta_con}` e `fazione.controlla_risorse` + dashboard **Economia** — il mondo diventa
    simulabile (una risorsa contesa alimenta un Fronte).
  - ✅ **Mappe**: luogo e mondo hanno una **tab Mappa** (campo `mappa` + embed via
    `views.renderMap`) che mostra un disegno **Excalidraw**, un'immagine o una nota; se
    vuota guida a crearne una (Excalidraw / Zoom Map / immagine trascinata). *Residuo*:
    mappe interattive con pin cliccabili (Zoom Map avanzato).
  - **Cosmologia/pantheon**: le categorie **divinità**, **culto** e **mito** ora esistono
    → il pantheon è coperto come dato. Restano da approfondire i **legami**
    cosmologia↔luogo↔culto↔divinità e gli oggetti che FantasyWorld aveva (leggi/entità
    primordiali/domini) come relazioni tipizzate vere.
  - ✅ **Generazione**: due vie su PNG/luogo/fazione. **Generatore homebrew** (italiano,
    a tema, legato all'ontologia via `stile_nomi`): nomi persona/toponimi/fazioni, bottone
    *Genera (locale)* (`generatori.yaml`+`genera.js`, `0b6e6ad`; QA in-app pendente). + **FCG**
    (rapido): suggester inline `@` + bottone *Genera* (modale) (`e591a5d`), ora **italianizzato**
    nei generatori configurabili (monete/locande/bevande via `fcg_it.yaml`, `53e20b1`; QA
    pendente). *Rinviati FCG*: dungeon/gruppi/bottino/città (frasi/branching).
  - **Fronti/clock** (`pressione`+`prossima_mossa`, stile Blades) ottimi → si possono
    approfondire con progress-clock e agende di fazione nel tempo.
- **Azione**: timeline + mappe ✅, generazione nomi (FCG) ✅, calendario (Calendarium) ✅.
  Prossimi: legami pantheon/cosmologia più ricchi e il **sistema astrologico/tema natale**
  (#9, recupero FantasyWorld) come profondità-personaggio opt-in.
- **Analisi wizard/YAML (2026-06-01)** — il modello ha relazioni tipizzate ricche ma il
  wizard non leggeva `core.relazioni` (33/36 categorie nascevano con 0-1 link). Fatti:
  `insidia` orfana → ✅ wired (`65b29b0`); ✅ **(a) wizard "connetti alla creazione"** — offre
  le relazioni della categoria nel wizard (gate opzionale, dedup vs creation.fields; `16dc3ab`),
  + corretta la collisione `luogo.abitanti` relazione↔body (→ `figure`) + guard in validate.
  ✅ **(c) inverse tipizzati** — *auto-derivati* (niente authoring): `Collega` scrive il reverse
  tipizzato quando la coppia è univoca (`reciprocalField`; ambiguo/assente → generico
  `connessioni`) + **dashboard "Rete del mondo"** (orfani/snodi via Dataview `file.inlinks`)
  (`51acb45`). ✅ **inverso ESPLICITO** (`relazioni[].reciprocal` → `inverseRelation`): per le
  relazioni dove l'auto-derivazione è ambigua — simmetriche (`confina_con`/`rotta_con`) o
  direzionali (`causato_da↔conseguenze`); validato a build (`validate_reciprocals`). **Aperti**: **(b) assi allo strato cosmico** (dominio/entita_primordiale/
  legge_fondamentale/piano senza assi → Carattere vuoto) + scheda per cosmologia/dominio;
  *residuo*: inverse anche nel wizard-connect (oggi solo `Collega`); CSS feel-wiki; maestrie
  armi + Bastioni 2024.

## 🎲 DM (D&D 5/5.5e)

- **Pregi**: SRD 5.2.1 IT a portata (incantesimi/oggetti/mostri/condizioni), statblock
  (layout IT 2024), superficie giocabile, incontri con Fantasy Statblocks + **Initiative
  Tracker**, **Dice Roller** (macro `tiri()`: d20/vantaggio/svantaggio in PG e incontro;
  `diceRolling` negli statblock), **rules-engine PG 1-20** (creazione SRD-completa + sali
  di livello interattivo), **difficoltà incontri** (budget XP 2024), **clock & conseguenze**
  al tavolo, note SRD col contenuto pieno.
- **Gap al tavolo (residui)**:
  - ✅ **Quick-ref condizioni**: callout pieghevole *Condizioni 5.5e* (le 15, nome linkato
    alla nota SRD + effetti compatti) in **scheda PG** (tab *Al tavolo*) e **incontro** (tab
    *Combattimento*). Dati da `core.condizioni` (note SRD), `views.renderCondizioni`.
  - ✅ **Encounter block auto-riscritto**: il bottone *Aggiorna encounter*
    (`meta_actions.aggiorna_encounter`) riscrive il fence `encounter` dalle creature
    collegate (conta per nome, risolve i link, preserva `players`). Niente più copia-incolla.
  - **Level-up avanzato**: scelte di sottoclasse multiple/feature opzionali oltre il
    set base; il motore copre il flusso standard.
- **Azione**: il residuo DM è ora il **level-up avanzato** (sottoclassi multiple/feature
  opzionali); encounter auto-riscritto ✅ e quick-ref condizioni ✅. Conferma in-app deferita (rischio #1).

## ✅ Backlog prioritizzato

Riorganizzato per **fasi** (direzione utente): prima le *fondamenta* delle due suite, poi
i sistemi avanzati. La QA in-app è igiene continua, non una fase a sé.

### Fase 1 — Fondamenta (sostanzialmente coperta)
**Suite Worldbuilding**
1. ✅ **Import idee da FantasyWorld** — grafo cosmologico a 5 nodi (sistema_magico/dominio/
   legge_fondamentale/entita_primordiale/piano) cross-linkato + assi divinita/lingua/specie.
   *Residuo*: seed FW minori come campi/subtypes (rito/dottrina/simbolo/titolo/conflitto/
   genealogia), non categorie.

**Suite Sistema / DM**
2. ✅ **PG per SRD (1º livello)** — specie (tratti/scurovisione), competenze armi/armature/
   strumenti + lingue, CA da armatura, equipaggiamento SRD A/B, privilegi di classe L1,
   incantesimi L1 (trucchetti/preparati/slot) per i caster. *La progressione 2-20 è in Fase 2.*
3. ✅ **Note SRD** — recuperato il contenuto perso: effetti delle condizioni, tratti, privilegi
   (blocchi) e tabelle (progressione classe/lignaggi/risultati) — 0 heading vuoti su 1053 voci.
   *Affinato*: `srd_note` ora rende **tutto** il JSON — **creature evocate inline** (callout
   statblock negli incantesimi di evocazione), footer **Vedi anche** coi link risolti
   (`srd_id_index`), e de-duplica le prose ripetute (basta talenti col testo 3 volte).

### Fase 2 — Verso un vault ultra-pro (gran parte FATTA)
4. ✅ **Clock & conseguenze** — clock a segmenti (4/6/8) sulla superficie tavolo; bottone
   *Scatena conseguenza* crea un evento collegato e azzera il clock (ponte gioco→mondo);
   dashboard **Fronti** (clock pieni/in corso + conseguenze-storia). Vedi [play_layer](play_layer.md).
5. ✅ **Difficoltà incontri** — budget XP 2024 vs GS delle creature collegate (GS/PE
   interrogabili) + ✅ **auto-riscrittura del blocco `encounter`** (bottone *Aggiorna
   encounter* → `meta_actions.aggiorna_encounter`) + ✅ **quick-ref condizioni** (callout
   *Condizioni 5.5e* in scheda PG e incontro, `views.renderCondizioni`).
6. ✅ **Progressione PG 2-20** — *sali di livello interattivo*: PF/competenza/slot
   automatici + scelte (ASI/talento, sottoclasse, nuovi incantesimi). Vedi [rules_layer](rules_layer.md).
7. **Profondità worldbuilding**: ✅ **timeline navigabile** (pannello *Linea del tempo* su
   Cronologia, `views.renderTimeline`) + ✅ **mappe** (tab Mappa su luogo/mondo, campo `mappa`
   + `views.renderMap`) + ✅ **calendario strutturato** (ponte `evento`→`fc-date`→Calendarium,
   `73041f5`). *Residuo*: legami cosmologia↔culto↔divinità più ricchi.
8. ✅ **Arricchimento tassonomico** — **tag-da-assi** (archetipi: combinazioni di valori →
   tag, vista *Profilo* + bottone *Applica*) + **preset in creazione** (archetipo→pre-compila
   gli assi). Vedi [play_layer](play_layer.md).

### 🔮 Da recuperare da FantasyWorld (analizzato 2026-05-31, NON ancora importato)
Materiale ricco in `/Users/andrea/Desktop/projects/FantasyWorld/JSON/`, da valutare quando
le fondamenta saranno rifinite. In ordine di valore:
9. ✅ **Tema natale / psico-archetipico** (`JSON/astrologia/`) — importato come layer
   **personalità + allineamento per i personaggi** (soprattutto PNG, scelta utente). Una
   scelta (**segno**) → profilo derivato coerente: **archetipo** psico-astrale + elemento/
   modalità + **MBTI** + manifestazioni + **ombra**; **arcano** (carta del destino) opzionale;
   **allineamento D&D** accanto. Catalogo distillato in `astrologia.yaml` (12 segni/22 arcani/
   4 elementi) → `core.json`; `views.renderTemaNatale`; campi `segno`/`arcano` su personaggio.
   *Espansione futura (rinviata)*: categorie astrologiche (segno/arcano/pianeta) come entità
   per i mondi dove l'astrologia conta davvero, e i layer pesanti (case/cammini/pianeti/piani).
10. ✅ **Glossari di categoria FW** (`JSON/generale/glossari/*_cat.json`) — **classificazione
    a 2 livelli** `famiglia` (curata, con descrizioni + legenda auto-documentante) **+** `tipo`
    (subtypes). Plumbing generico (common→`core.categories`, fileClass select, macro
    `classificazione`, validate); famiglia query-abile/editabile. **14 entità**: luogo/fazione/
    evento/cultura/divinità/specie/epoca/lingua (famiglie curate FW) + personaggio (*ruoli
    narrativi* png) + le **minori** hand-authored (cosmologia=questione cosmica, dominio=ambito
    di realtà, legge_fondamentale=ambito retto, incontro=scopo scena, insidia=natura). *Le
    famiglie possono in futuro **presettare gli assi**, stile archetipi.*
11. **Alberi evolutivi** (`JSON/TTRPG/alberi_evolutivi.json`) — abilità per parte-del-corpo
    → grado → potere (skill-tree). *Recupero*: poteri di creatura o un binario homebrew che
    estende la progressione PG (#6, già fatta per le classi SRD).
- *Solo contenuto del suo mondo (NON schema, non riusare)*: `personaggio.json`/`luogo.json`/
  `organizzazioni.json`/`politica.json`/`world_building/divinita|leggi` = istanze del mondo FW.

### Trasversale / continuo
- **QA in-app** su ogni pezzo di fondamenta prima di allargare (rischio #1).
- **Quick-win architetturali**: ✅ eliminati i 3 thin-shell `cultura`/`lingua`/`nota.md.j2`
  (ereditano `_entity_base.j2`); ✅ spezzata `build()` in render.py (helper nominati,
  output invariato); ✅ **ridotto il guscio js-engine** (corpo nota = una riga via `boot.mjs`
  ESM). Tutti i quick-win architetturali chiusi.
- **Plugin non sfruttati** (analisi fatta): ✅ Folder Notes, Tasks, Calendarium (vedi sotto) +
  ✅ **Fantasy Content Generator** (in corpo nota: suggester inline `@` + bottone *Genera*;
  niente hook wizard perché FCG non espone un'API richiamabile — `e591a5d`). *Igiene*: BRAT è
  opzionale per lo ZIP (i plugin sono bundlati → si caricano col trust-prompt a prescindere
  dallo store; serve solo per aggiornarli).

### ✅ Fatto (sessione 2026-06-01)
- **Statblock 5e → 5.5e (Fantasy Statblocks)**: il layout `5-5e-ita` era già fedele al 2024
  ma `srd_statblock_yaml` mappava ~metà dei campi. Ora mappa TUTTO il 2024 (initiative,
  saves/skillsaves con label IT da core.abilita, resist./immunità/vulnerab., gear,
  bonus_actions, reactions, leggendarie+descrizione, GS+pb; campi vuoti omessi). Layout:
  initiative preferisce il valore esplicito. Template **creatura a due tab** (scelta utente):
  *Statblock 5.5e* inline + *Statblock 5e* via `monster:` (stessa creatura, `layout_5e`, zero
  duplicazione). `autoParse` (FS) abilitato dalla pipeline → `monster:` risolve out-of-the-box.
  Calendarium: Gregorian importato dall'utente in dist. **199 test.**
- **Plugin sottoutilizzati cablati** (analisi + 3 di 4):
  - **Folder Notes**: nota-cartella auto-indice per ogni categoria (`Mondi/<X>/<X>.md`, resa con
    `index.md.j2`) — cliccare la cartella apre l'indice. `folder_index_pages` + `write_folder_notes`
    + 34 snapshot; `clean()` le rimuove.
  - **Tasks**: convenzione `#gancio`/`#trama` (fili narrativi) + `#prep` (checklist sessione);
    Home *Al tavolo* → 🧵 Fili narrativi + ✅ Da fare; template `sessione` con checklist prep.
  - **Calendarium**: primer di parsing eventi cablato (`autoParse`/`parseDates`/`eventFrontmatter`
    + `inlineEventsTag: #cronologia`). Il calendario (mesi/ere) è contenuto per-mondo → creato
    in-app dai preset (opt-in); iniezione di un default RINVIATA a una sessione con QA Obsidian.
  - **Igiene**: rimosse 2 voci-plugin fantasma (`tabs`/`media-extended`, abilitate senza cartella)
    dal vault. Schede `Dev/Reference/` aggiornate (+ nuova `folder-notes.md`). **199 test.**
- **Guscio js-engine ridotto** (ultimo quick-win architetturale): nuovo `boot.mjs` (ESM via
  `engine.importJs`) concentra loader CommonJS di `views.js` + `dv`/`page` + `markdown.create`;
  il corpo nota passa a **una riga** per pannello (≈1000 righe di boilerplate in meno negli
  snapshot). **165 test** (build/`node --check` su `.js`+`.mjs`) + ✅ **smoke test in-app**
  superato (importJs ESM, panel, radar). (da committare)
- **Quick-win architetturali** (output invariato, manifest byte-identico): 3 thin-shell jinja
  eliminati; `build()` spezzata in helper nominati. (`8c29ad4`)
- **Auto-riscrittura blocco encounter** — bottone *Aggiorna encounter* (`meta_actions`). (`9c87ca5`)
- **Note SRD complete** — `srd_note` rende tutto il JSON: creature evocate inline, footer
  *Vedi anche* (link risolti), de-dup prose. (`cbbdb08`)
- **Timeline navigabile** (pannello su Cronologia) + **tab Mappe** (luogo/mondo). (`f9dc160`)
- **Docs** riallineate (roadmap + 4 lenti, play_layer/architecture, LEGGIMI). (`584eb08`)
- **Quick-ref condizioni** — callout *Condizioni 5.5e* (15, da `core.condizioni`/SRD) in
  scheda PG e incontro (`views.renderCondizioni`). (`cbba25b`)
- **Template reattivi** (profondità+bellezza): etichette-valore attive sugli assi del
  Carattere + ritratto calcolato/icona in `identita_card` (`VIEW` reattivo); radar migrato a
  **`meta-bind-js-view`** (ridisegno live, fallback al frontmatter; reattività da QA). (`64c1514`)
- **Classificazione a 2 livelli** (`famiglia` + tipo, recupero #10): plumbing generico +
  **14 entità** — famiglie curate FW (luogo/fazione/evento/cultura/divinità/specie/epoca/
  lingua) + ruoli png + minori hand-authored (cosmologia/dominio/legge/incontro/insidia),
  legenda auto-documentante. (`5800a20`+`af354c3`+`13a7816`)
- **Assi integrati da FantasyWorld** (espansione curata 5→~8): 9 entità portate a 8 assi
  (i 3 FW più distintivi mancanti); le 5 senza assi restano tali. (`51bd020`)
- **Tema natale** (#9, personalità + allineamento per i personaggi): segno → archetipo/
  elemento/MBTI/ombra + arcano + allineamento D&D (`astrologia.yaml`→core.json,
  `views.renderTemaNatale`, campi segno/arcano su pg+png). (`5d71c7e`)
- **Cura del corpo nota** (feel wiki): `identita_card` → **infobox** con tabella-fatti
  (VIEW reattivi) + **ritratto** opzionale (Meta Bind imageSuggester, categorie "visive");
  **tabelle di relazione** (`views.renderConnessioni` → rete in *Collegamenti*). LEGGIMI per
  distribuzione **ZIP** (trust-prompt). **164 test**. HEAD `c600232`.

### ✅ Fatto (sessione 2026-05-31)
- **Fase 1 fondamenta**: doc plugin (poi completata a 21 schede), grafo cosmologico (5 categorie),
  PG-SRD di 1º livello, note SRD col contenuto recuperato.
- **Fase 2 (gran parte)**: tag-da-assi (archetipi/profilo) + preset in creazione; dashboard
  **Ponte Mondo↔Sistema** + **Fronti**; **clock & conseguenze**; **difficoltà incontri**
  (2024); **progressione PG 2-20**; LEGGIMI onboarding non tecnico. HEAD `5c7522c`.
- **Docs** allineati: nuovo [play_layer](play_layer.md); aggiornati rules_layer/data_model/
  architecture/plugin_contracts.

## Come ripartire

**212 test verdi**, check 0; HEAD `a11418c`. **Post-beta (tutto pushato)**: ponte Calendarium
`73041f5` + aggancio FCG `e591a5d` (verificati in-app) + generatore homebrew IT `0b6e6ad` +
FCG italianizzato `53e20b1` + solidità JS `a876bcc` + wire insidia `65b29b0` + wizard
connetti-alla-creazione `16dc3ab` + connessione (inverse tipizzati + dashboard Rete del mondo)
`51acb45` + CSS feel-wiki (infobox) `bc8f018` + Bastioni 2024 schema+ordini `6484fde` +
**maestrie armi 2024** (mappa SRD `padronanza` + scelta in creazione PG; il dato ERA nel SRD)
`d306d91` + **turno di bastione interattivo** (registro turni) `a9e27aa`. **Unica vera riserva
beta rimasta: il mondo-esempio (blocco #1, rinviato).** *Mappe = **Zoom Map** (no Leaflet/
Breadcrumbs, scelta utente). Residui: **catalogo strutture speciali Bastioni** (contenuto DMG,
NON nel SRD → non fabbricato, serve fonte) + risoluzione automatica ordini; (b) assi cosmici;
inverse anche nel wizard; report gap copertura. **QA in-app FATTA (2026-06-02)**: verificati
infobox CSS, maestrie+condizioni quick-ref, callout padronanze, generatore IT (insert al cursore),
Collega inverso tipizzato (cultura.regioni), rename Figure, turno di bastione (registro), dashboard
Rete del mondo — **1 bug trovato e corretto** (callout padronanze fuso con Scatena, `a11418c`).
Restano QA non critici (stesso meccanismo già visto): FCG italiano, epoca→calendario, prompt
famiglia/connetti nel wizard. Tab-extra data-driven valutato e **non fatto**.*
Leggi questo file + i
docs (`architecture`/`data_model`/`rules_layer`/`play_layer`/`plugin_contracts`) + la memoria
(`project-northstar`, `vault-due-suite`). **Fasi 1-2 coperte + rifiniture** → prossimi:
- **Residui Fase 2**: level-up scelte avanzate (quick-ref condizioni ✅).
- **Recuperi FantasyWorld** (#9-11): **#9 sistema astrologico/tema natale** (il differenziatore
  "wow", opt-in per mondo), #10 glossari subtypes, #11 alberi evolutivi.
- **Worldbuilding**: legami pantheon/cosmologia più ricchi (generazione nomi/spunti ✅, FCG).
- **QA in-app** (rischio #1, deferita su scelta utente): quando si vuole, a blocchi — crea un PG
  e *Sali di livello*; clock → *Scatena conseguenza* (+ Fronti); incontro + *Aggiorna encounter*;
  **Cronologia** (timeline); **tab Mappa** su un luogo; archetipo/profilo; note SRD.
  ✅ Il **guscio `boot.mjs`** (tocca *tutti* i pannelli) è già confermato via smoke test
  (importJs ESM + panel + radar); resta da provare i flussi sopra e la *reattività live* del radar.
