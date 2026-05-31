# Analisi & Roadmap

Brief di stato e priorità per riprendere il lavoro. Quattro lenti (PM, Architect,
Worldbuilder, DM 5/5.5e) + backlog prioritizzato. Lo stato tecnico dettagliato è
in [architecture](architecture.md) / [data_model](data_model.md) /
[rules_layer](rules_layer.md) / [plugin_contracts](plugin_contracts.md).

## Dove siamo (sintesi)

Pipeline matura: sorgenti YAML/Jinja/JS → `render.py` (modulare) → `dist/GDR-vault`.
Modello fuso core+system+entities (23 entità), **trinità per-entità** (YAML +
Jinja `_entity_base` + `crea_<id>.js`). Differenziatore: **superficie giocabile**
su ogni nota lore (`uso_al_tavolo`/`gancio`/`pressione`/`prossima_mossa`).
Rules-engine PG (SRD+overlay → wizard `crea_pg` → scheda ricca). SRD 5.2.1 IT
(1387 note + 334 mostri statblock, layout IT 2024). 135 test, Home a 2 aree,
Homepage. **Stadio prodotto: scaffold ricco e solido, esperienza in-app da rifinire.**

## 🧭 Senior PM

- **Valore**: prodotto mono-utente (DM/worldbuilder) che connette mondo profondo
  e tavolo 5.5e. Il differenziatore (superficie giocabile) è chiaro e implementato.
- **Rischio #1 — debito di verifica in-app**: tanto è *generato* ma poco *confermato*
  in Obsidian (matematica scheda PG, wizard, tabelle Meta Bind, statblock). Il valore
  vive in-app → serve una **QA pass strutturata** prima di allargare.
- **Core loop**: sessione → incontro → fronti è il cuore giocabile; va reso tight e
  "tutto a un clic" al tavolo.
- **Onboarding**: rimossi i sample (scelta utente). Manca un *getting-started* (anche
  solo una guida "crea il tuo primo mondo in 5 mosse").
- **Priorità**: verifica in-app > stringere il core loop > rifinire rules-engine >
  ampiezza (più plugin/entità).

## 🏗️ Architect

- **Pregi**: trinità per-entità, `render.py` modulare, merge lossless, validazione
  forte (confine/dup/snake/shape/entity-schema), snapshot test + e2e wizard. Ingegneria
  solida e scalabile (nuova entità = 1 YAML + 1 Jinja).
- **Debito/fragilità**:
  - **Logica embeddata nelle note**: `vista` (dataviewjs `new Function`), blocchi
    `statblock`/`dataview` finiscono nel CORPO delle note alla creazione → le modifiche
    ai template **non si propagano** alle note già create. Tendere a **note sottili +
    logica condivisa** (views.js) per ridurre il problema.
  - **dataviewjs vs JS Engine**: oggi dataviewjs; l'utente vuole **JS Engine**. Decidere
    uno standard e convergere (JS Engine è più robusto per pannelli ricchi).
  - **Bases (core, nuovo)**: opportunità per sostituire le pagine-indice Dataview con
    viste-DB native (più manutenibili). Serve uno **spike** sul formato `.base`.
  - **Test**: 135 verdi ma coprono la *generazione*, non il runtime Obsidian
    (Meta Bind/Dataview/Templater) — gap inerente, da colmare con QA manuale.

## 🌍 Worldbuilder

- **Pregi**: ontologia ricca (23 categorie), relazioni tipizzate, assi tematici, campi
  connessi. La fazione è già arricchita "mix curato" (seed FantasyWorld).
- **Gap per mondi profondi**:
  - **Timeline/storia**: gli eventi hanno `quando` ma niente calendario/timeline
    (Calendarium non integrato). Servono ere/epoche e una vista cronologica.
  - **Mappe**: nessuna integrazione (Excalidraw / Zoom Map) — luoghi/mondi le vogliono.
  - **Cosmologia/pantheon sottili** rispetto al potenziale (FantasyWorld aveva leggi,
    entità primordiali, astrologia, domini): scaffold più profondi per cosmologia/divinità/cultura.
  - **Generazione**: Fantasy Content Generator non agganciato (nomi/spunti rapidi).
  - **Fronti/clock**: `pressione`+`prossima_mossa` (stile Blades) sono ottimi → si possono
    approfondire con progress-clock e agende di fazione nel tempo.
- **Azione**: estendere l'arricchimento bespoke (come fazione) a luogo/mondo/personaggio/
  creatura/cosmologia; poi timeline + mappe.

## 🎲 DM (D&D 5/5.5e)

- **Pregi**: SRD 5.2.1 IT a portata (incantesimi/oggetti/mostri/condizioni), statblock
  (layout IT 2024), superficie giocabile, incontri con Fantasy Statblocks, rules-engine PG.
- **Disponibili (da rifinire/verificare in-app)**:
  - **Iniziativa**: **Initiative Tracker installato** + blocco ` ```encounter ` nel template
    incontro (combattimento + iniziativa, legge il bestiario FS).
  - **Dadi**: Dice Roller agganciato in incontro (` `dice: 1d20` `) — estendibile a statblock/PG.
- **Gap al tavolo**:
  - **Difficoltà incontri**: gli incontri citano creature ma niente budget XP/letalità 5e;
    pre-popolare il blocco `encounter` dalle creature collegate.
  - **PG oltre il 1º livello**: il rules-engine fa il livello 1; mancano avanzamento,
    slot incantesimo, gestione privilegi/inventario.
  - **Quick-ref condizioni/regole** durante il gioco.
- **Azione**: rifinire iniziativa+dadi in-app; poi **difficoltà incontri**; la
  progressione PG è un lift maggiore.

## ✅ Backlog prioritizzato

**Subito (prossima conversazione)**
1. **QA pass in-app** — verificare l'esperienza generata (riduce il rischio #1).
2. **Plugin da attivare ora** (richiesta utente): **Bases** (viste-indice native),
   **JS Engine** (standard per i pannelli dinamici), **Dice Roller** (tiri inline in
   statblock/incontri).
3. **Conversione + arricchimento bespoke** dei template (luogo/mondo/personaggio/
   creatura/…) sul pattern fazione, coi seed FantasyWorld.

**Medio termine**
4. **Strumenti DM al tavolo**: iniziativa, difficoltà incontri (budget XP), quick-ref condizioni.
5. **Profondità worldbuilding**: timeline/calendario (Calendarium), mappe (Excalidraw/Zoom Map),
   cosmologia/pantheon più ricchi.
6. **Progressione PG**: livelli, slot incantesimo, privilegi.

**Dopo (a sistema rifinito)**
7. Generazione nomi/spunti (Fantasy Content Generator), mappe relazioni (Canvas),
   integrazioni minori.

**Trasversale**: risolvere la propagazione della logica nelle note; scegliere lo
standard dataviewjs↔JS Engine; continuare ad arricchire i seed da FantasyWorld.

## Come ripartire

Repo pulito, 135 test verdi, tutto pushato. Leggi questo file + la memoria
(`project-northstar.md`) per lo stato. Primo passo consigliato: **QA in-app** (build,
crea un PG e un Luogo, verifica scheda/tabelle/wizard/Vista/statblock) → poi #2 (Bases/
JS Engine/Dice) e #3 (arricchimento bespoke).
