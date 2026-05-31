# Analisi & Roadmap

Brief di stato e priorità per riprendere il lavoro. Quattro lenti (PM, Architect,
Worldbuilder, DM 5/5.5e) + backlog prioritizzato. Lo stato tecnico dettagliato è
in [architecture](architecture.md) / [data_model](data_model.md) /
[rules_layer](rules_layer.md) / [play_layer](play_layer.md) / [plugin_contracts](plugin_contracts.md).

> Aggiornata dopo **Fase 1 (fondamenta)** + un grosso blocco di **Fase 2**. Fase 1:
> grafo cosmologico (5 categorie nuove) + assi, PG di 1º livello SRD-completo, note SRD
> col contenuto pieno. Fase 2: **tag-da-assi** (archetipi/profilo) + **preset in
> creazione**, **dashboard-ponte Mondo↔Sistema** + **dashboard Fronti**, **clock &
> conseguenze** (ponte gioco→mondo), **difficoltà incontri** (budget XP 2024),
> **progressione PG 2-20** (sali di livello interattivo), LEGGIMI con onboarding non
> tecnico. **36 categorie, 20 con assi.** Tutto committato/pushato/buildato su
> `origin/main` (HEAD `5c7522c`). **Da confermare in-app (rischio #1).**

## Dove siamo (sintesi)

Pipeline matura: sorgenti YAML/Jinja/JS → `render.py` (modulare) → `dist/GDR-vault`.
Modello fuso core+system+entities (**36 categorie**, 20 con assi), **trinità per-entità**
(YAML + Jinja `_entity_base` + `crea_<id>.js`), assi scorporati in `YAML/assi/<id>.yaml`
(formato ricco 1-5) con **archetipi** (combinazioni di valori-assi → tag, in creazione e
in nota). **Grafo cosmologico** connesso. Differenziatore: **superficie giocabile** su ogni
nota lore (`uso_al_tavolo`/`gancio`/`pressione`/`prossima_mossa`) + **clock & conseguenze**
(un fronte pieno crea un evento → muove il mondo). **Rules-engine PG 1-20** (creazione
SRD-completa + sali di livello interattivo: PF/competenza/slot + ASI/sottoclasse/
incantesimi). **Difficoltà incontri** (budget XP 2024 vs GS delle creature). SRD 5.2.1 IT
(1389 note + 334 statblock). Pannelli **JS Engine** (`views.js`: Vista, radar assi, profilo,
clock, difficoltà incontro, progressione). Indici **Bases** `.base` + hub Dataview;
dashboard auto **Ponte Mondo↔Sistema** e **Fronti**. Home a 2 aree, Homepage, **153 test**, check 0.
**Stadio prodotto: scaffold ricco e profondo; l'esperienza in-app è in gran parte da confermare.**

## 🎯 Visione: due suite integrate ma separate

Il vault è **due prodotti che condividono la stessa pipeline e si parlano**, con superfici
distinte e riconoscibili:
- **Suite Worldbuilding** — mondo *profondo e connesso*: ontologia ricca, relazioni
  tipizzate, assi-carattere, timeline, mappe, pantheon/cosmologia. Metro: profondità e
  coerenza.
- **Suite DM (gestione gioco + sistema)** — *al tavolo* e *regole 5.5e*: SRD, statblock,
  incontri/iniziativa, dadi, rules-engine PG, e a tendere clock/conseguenze. Metro:
  immediatezza e correttezza di sistema.

**Integrate ma separate**: si collegano (una creatura del mondo alimenta un incontro, un
luogo fa da scena, un fronte muove la trama) ma restano due esperienze distinte. La
roadmap tiene le due colonne separate e segna dove si incrociano. **Direzione di fondo
(scelta utente)**: finire le *fondamenta* di entrambe le suite **prima** di costruirci
sopra i sistemi avanzati (vedi backlog).

## 🧭 Senior PM

- **Valore**: prodotto mono-utente (DM/worldbuilder) che connette mondo profondo e
  tavolo 5.5e. Il differenziatore (superficie giocabile + assi-carattere visualizzati)
  è chiaro e ora anche *mostrato* (radar).
- **Rischio #1 — debito di verifica in-app (cresciuto)**: l'ultima ondata (radar,
  fix js-engine, assi 1-5, Bases) è tutta *generata* e *quasi nulla confermata* in
  Obsidian. Serve una **QA pass strutturata** prima di allargare ancora. Il fix
  `views.renderEntityPanel` è la prova che i bug vivono nel runtime, non nei test.
- **Propagazione**: la logica vive nel CORPO delle note alla creazione → le note
  vecchie non ricevono i fix (js-engine, radar, assi). Per un mono-utente è gestibile
  (ricrea/edita), ma è attrito; va comunicato e, dove possibile, ridotto.
- **Onboarding assente**: niente sample (scelta utente) e niente getting-started.
  Un DM nuovo non sa da dove iniziare. Manca una guida "crea il tuo primo mondo".
- **Core loop** sessione → incontro → fronti: i pezzi ci sono ma non sono ancora
  "tutto a un clic" al tavolo (vedi DM).
- **Priorità (direzione utente)**: completare le **fondamenta delle due suite** —
  import idee FantasyWorld (worldbuilding) + ottimizzazione PG-SRD e note SRD (sistema) —
  **prima** di aggiungere i sistemi avanzati (clock/conseguenze, timeline, mappe). La
  **QA in-app** resta un'igiene *continua* (rischio #1): si applica a ogni pezzo di
  fondamenta man mano, non come fase unica a parte.

## 🏗️ Architect

- **Pregi**: trinità per-entità + **assi scorporati** (file entità snelli, assi come
  glossario coeso). `render.py` modulare (common/build_srd/build_personaggio/validate),
  merge lossless, validazione forte (confine/dup/snake/shape/entity-schema/assi),
  snapshot + e2e wizard (creazione PG/caster, preset, level-up, profilo, clock, incontri).
  Test (**153**, ridondanti sussunti dagli snapshot).
  Nuova entità = 1 YAML (+1 assi); Jinja solo per layout custom (default `_entity_base.j2`).
- **Debito/fragilità**:
  - **Logica embeddata nelle note**: il blocco `js-engine`/`statblock`/`dataview`
    finisce nel corpo alla creazione → modifiche a `views.js`/macro **non si
    propagano** alle note esistenti. Il loader js-engine (CommonJS via `new Function`)
    *attenua* (la logica vera è in `views.js`, importata a runtime) ma il blocco-guscio
    resta nel corpo. Tendere a note sottili + logica condivisa.
  - ✅ **Thin shell Jinja eliminati**: il default `_entity_base.j2`
    (`common.DEFAULT_JINJA`) è ora l'unico guscio condiviso; i 3 file
    `cultura`/`lingua`/`nota.md.j2` (solo `{% extends %}`) sono stati rimossi e le
    relative entità ereditano il default (output dei modelli byte-identico).
  - ✅ **`build()` spezzata**: da ~184 righe a un orchestratore di ~25 che delega a
    helper nominati (`write_engine_data`/`render_notes`/`write_obsidian_config` con un
    writer per plugin/`scaffold_folders`). Refactor a output invariato (manifest del
    vault byte-identico).
  - **Doc plugin parziale**: `Dev/Reference/` ha 10 schede (core/templater/dataview/
    js-engine/tab-panels/meta-bind/metadata-menu/statblocks/tasks/dice). Mancano i
    plugin già cablati nella pipeline ma non documentati — **bases** (`.base`),
    **callout-manager** (qui il gotcha *callout collassati*), **iconize**, **homepage** —
    e quelli installati-ma-non-integrati (initiative-tracker/calendarium/excalidraw/
    zoom-map/fantasy-content-generator/brat). Richiesta utente: una per plugin, con gotcha.
  - **Test**: 153 verdi ma coprono la *generazione* (+ i wizard JS via node), non il runtime Obsidian
    (Meta Bind/Dataview/Templater/JS Engine) — gap inerente, colmabile solo con QA manuale.

## 🌍 Worldbuilder

- **Pregi**: ontologia ricca (36 categorie, grafo cosmologico connesso), relazioni tipizzate, **assi tematici 1-5
  con etichette+descrizioni** (seed FantasyWorld, formato "fatto bene") + **radar** di
  carattere e **confronto fra entità**. Entità lore arricchite bespoke (luogo/mondo/
  fazione/cultura/oggetto/creatura/cosmologia/personaggio).
- **Gap per mondi profondi**:
  - **Timeline/storia**: la categoria **epoca** ora esiste (gli eventi possono collegarsi
    a un'epoca) → ere/epoche coperte come dato. Manca ancora la **vista cronologica**
    (Calendarium non integrato): calendario/asse temporale navigabile.
  - **Mappe**: nessuna integrazione (Excalidraw / Zoom Map oltre il doc LEGGIMI) —
    luoghi/mondi le vogliono.
  - **Cosmologia/pantheon**: le categorie **divinità**, **culto** e **mito** ora esistono
    → il pantheon è coperto come dato. Restano da approfondire i **legami**
    cosmologia↔luogo↔culto↔divinità e gli oggetti che FantasyWorld aveva (leggi/entità
    primordiali/domini) come relazioni tipizzate vere.
  - **Generazione**: Fantasy Content Generator non agganciato (nomi/spunti rapidi).
  - **Fronti/clock** (`pressione`+`prossima_mossa`, stile Blades) ottimi → si possono
    approfondire con progress-clock e agende di fazione nel tempo.
- **Azione**: timeline + mappe sono i due salti di valore worldbuilding più grossi;
  poi pantheon/cosmologia.

## 🎲 DM (D&D 5/5.5e)

- **Pregi**: SRD 5.2.1 IT a portata (incantesimi/oggetti/mostri/condizioni), statblock
  (layout IT 2024), superficie giocabile, incontri con Fantasy Statblocks + **Initiative
  Tracker**, **Dice Roller** (macro `tiri()`: d20/vantaggio/svantaggio in PG e incontro;
  `diceRolling` negli statblock), **rules-engine PG 1-20** (creazione SRD-completa + sali
  di livello interattivo), **difficoltà incontri** (budget XP 2024), **clock & conseguenze**
  al tavolo, note SRD col contenuto pieno.
- **Gap al tavolo (residui)**:
  - **Quick-ref condizioni/regole**: le 15 condizioni hanno gli effetti pieni nelle note
    SRD, ma manca un richiamo *rapido* in scheda/incontro durante il gioco.
  - ✅ **Encounter block auto-riscritto**: il bottone *Aggiorna encounter*
    (`meta_actions.aggiorna_encounter`) riscrive il fence `encounter` dalle creature
    collegate (conta per nome, risolve i link, preserva `players`). Niente più copia-incolla.
  - **Level-up avanzato**: scelte di sottoclasse multiple/feature opzionali oltre il
    set base; il motore copre il flusso standard.
- **Azione**: tutto da **confermare in-app** (rischio #1); poi quick-ref condizioni e le
  rifiniture sopra.

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

### Fase 2 — Verso un vault ultra-pro (gran parte FATTA)
4. ✅ **Clock & conseguenze** — clock a segmenti (4/6/8) sulla superficie tavolo; bottone
   *Scatena conseguenza* crea un evento collegato e azzera il clock (ponte gioco→mondo);
   dashboard **Fronti** (clock pieni/in corso + conseguenze-storia). Vedi [play_layer](play_layer.md).
5. ✅ **Difficoltà incontri** — budget XP 2024 vs GS delle creature collegate (GS/PE
   interrogabili) + ✅ **auto-riscrittura del blocco `encounter`** (bottone *Aggiorna
   encounter* → `meta_actions.aggiorna_encounter`). *Residuo*: quick-ref condizioni in
   scheda/incontro.
6. ✅ **Progressione PG 2-20** — *sali di livello interattivo*: PF/competenza/slot
   automatici + scelte (ASI/talento, sottoclasse, nuovi incantesimi). Vedi [rules_layer](rules_layer.md).
7. **Profondità worldbuilding** (residuo): timeline/calendario (Calendarium), mappe
   (Excalidraw/TTRPG Tools-Maps), legami cosmologia↔culto↔divinità più ricchi.
8. ✅ **Arricchimento tassonomico** — **tag-da-assi** (archetipi: combinazioni di valori →
   tag, vista *Profilo* + bottone *Applica*) + **preset in creazione** (archetipo→pre-compila
   gli assi). Vedi [play_layer](play_layer.md).

### 🔮 Da recuperare da FantasyWorld (analizzato 2026-05-31, NON ancora importato)
Materiale ricco in `/Users/andrea/Desktop/projects/FantasyWorld/JSON/`, da valutare quando
le fondamenta saranno rifinite. In ordine di valore:
9. **Sistema astrologico / psico-archetipico** (`JSON/astrologia/`, sistema
   "tarocchi_psicoarchetipici") — un layer *destino/personalità* completo e coeso: **segni
   zodiacali** (12, con elemento/modalità/archetipo/MBTI/pianeti dominanti), **arcani
   maggiori** (tarocchi), **archetipi** di personalità, **pianeti** (10), **case** (12),
   **cammini** + dei del cammino, **elementi** (4), **piani astrali**, e **tema natale**
   (profilo MBTI + elemento/modalità/segno/arcano per un personaggio). *Recupero*: un campo
   `tema_natale`/`archetipo` su **personaggio** (profilo rapido) + categorie astrologiche
   opzionali (segno/arcano/pianeta) per i mondi dove l'astrologia conta. **Differenziatore
   worldbuilding forte** (profondità del personaggio); pesante, quindi opt-in per mondo.
10. **Glossari di categoria FW** (`JSON/generale/glossari/*_cat.json`) — tassonomie curate
    (`categorie`+`sottotipi`) per fazione/evento/epoca/civiltà/artefatto/luogo/lingua/culto.
    *Recupero*: arricchire i **subtypes** delle categorie esistenti quando serve più
    granularità (edit YAML puro).
11. **Alberi evolutivi** (`JSON/TTRPG/alberi_evolutivi.json`) — abilità per parte-del-corpo
    → grado → potere (skill-tree). *Recupero*: poteri di creatura o un binario homebrew che
    estende la progressione PG (#6, già fatta per le classi SRD).
- *Solo contenuto del suo mondo (NON schema, non riusare)*: `personaggio.json`/`luogo.json`/
  `organizzazioni.json`/`politica.json`/`world_building/divinita|leggi` = istanze del mondo FW.

### Trasversale / continuo
- **QA in-app** su ogni pezzo di fondamenta prima di allargare (rischio #1).
- **Quick-win architetturali**: ✅ eliminati i 3 thin-shell `cultura`/`lingua`/`nota.md.j2`
  (ereditano `_entity_base.j2`); ✅ spezzata `build()` in render.py (helper nominati,
  output invariato). *Residuo*: ridurre la logica embeddata nelle note (il blocco-guscio
  `js-engine` nel corpo) — **cambia l'output delle note → richiede QA in-app**, quindi a sé.
- Generazione nomi/spunti (Fantasy Content Generator) e integrazioni minori quando comodo.

### ✅ Fatto (sessione 2026-05-31)
- **Fase 1 fondamenta**: doc plugin (20 schede), grafo cosmologico (5 categorie), PG-SRD
  di 1º livello, note SRD col contenuto recuperato.
- **Fase 2 (gran parte)**: tag-da-assi (archetipi/profilo) + preset in creazione; dashboard
  **Ponte Mondo↔Sistema** + **Fronti**; **clock & conseguenze**; **difficoltà incontri**
  (2024); **progressione PG 2-20**; LEGGIMI onboarding non tecnico. HEAD `5c7522c`.
- **Docs** allineati: nuovo [play_layer](play_layer.md); aggiornati rules_layer/data_model/
  architecture/plugin_contracts.

## Come ripartire

**153 test verdi**, check 0; HEAD `5c7522c` (tutto pushato+buildato). Leggi questo file + i
docs (`architecture`/`data_model`/`rules_layer`/`play_layer`/`plugin_contracts`) + la memoria
(`project-northstar`, `vault-due-suite`). **Fasi 1-2 in gran parte coperte** → prossimi:
- **QA in-app** (rischio #1, molto alto): crea un PG e fai *Sali di livello*; prova clock →
  *Scatena conseguenza* (+ Indici/Fronti); collega creature a un incontro e leggi la
  difficoltà; archetipo/profilo su un culto; Ponte; note SRD (condizioni/classi).
- **Residui Fase 2**: quick-ref condizioni al tavolo; timeline/mappe (Calendarium/Excalidraw);
  level-up scelte avanzate. (✅ auto-riscrittura blocco encounter — `aggiorna_encounter`.)
- **Recuperi FantasyWorld** (#9-11): sistema astrologico/personalità, glossari subtypes, alberi evolutivi.
