# Analisi & Roadmap

Brief di stato e priorità per riprendere il lavoro. Quattro lenti (PM, Architect,
Worldbuilder, DM 5/5.5e) + backlog prioritizzato. Lo stato tecnico dettagliato è
in [architecture](architecture.md) / [data_model](data_model.md) /
[rules_layer](rules_layer.md) / [plugin_contracts](plugin_contracts.md).

> Aggiornata dopo: attivazione **Bases / JS Engine / Dice Roller**, arricchimento
> bespoke entità lore, **radar assi tematici** + **assi ricchi 1-5** (valori/
> etichette/descrizioni, 8 categorie), **fix js-engine** (CommonJS), e refactor di
> ottimizzazione (split assi per-entità, test snelliti). origin/main = `235ad51`.

## Dove siamo (sintesi)

Pipeline matura: sorgenti YAML/Jinja/JS → `render.py` (modulare) → `dist/GDR-vault`.
Modello fuso core+system+entities (**23 entità**), **trinità per-entità** (YAML +
Jinja `_entity_base` + `crea_<id>.js`), con gli **assi tematici scorporati** in
`YAML/assi/<id>.yaml` (formato ricco 1-5). Differenziatore: **superficie giocabile**
su ogni nota lore (`uso_al_tavolo`/`gancio`/`pressione`/`prossima_mossa`).
Rules-engine PG (SRD+overlay → wizard `crea_pg` → scheda ricca). SRD 5.2.1 IT
(1389 note + 334 mostri statblock, layout IT 2024). Pannelli dinamici via **JS Engine**
(`views.js`: pannello Vista, backlink, **radar assi**, confronto entità). Indici come
**Bases** (`.base`) + hub Dataview (fallback). Home a 2 aree, Homepage, **105 test**, check 0.
**Stadio prodotto: scaffold ricco e solido; l'esperienza in-app è ancora da confermare.**

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
- **Priorità**: QA in-app > stringere il core loop al tavolo > rifinire rules-engine/
  worldbuilding > ampiezza.

## 🏗️ Architect

- **Pregi**: trinità per-entità + **assi scorporati** (file entità snelli, assi come
  glossario coeso). `render.py` modulare (common/build_srd/build_personaggio/validate),
  merge lossless, validazione forte (confine/dup/snake/shape/entity-schema/assi),
  snapshot + e2e wizard. Test snelliti (**105**, tolti i ridondanti sussunti dagli
  snapshot). Nuova entità = 1 YAML (+1 assi) + 1 Jinja.
- **Debito/fragilità**:
  - **Logica embeddata nelle note**: il blocco `js-engine`/`statblock`/`dataview`
    finisce nel corpo alla creazione → modifiche a `views.js`/macro **non si
    propagano** alle note esistenti. Il loader js-engine (CommonJS via `new Function`)
    *attenua* (la logica vera è in `views.js`, importata a runtime) ma il blocco-guscio
    resta nel corpo. Tendere a note sottili + logica condivisa.
  - **Thin shell Jinja**: `cultura`/`lingua`/`nota.md.j2` sono solo `{% extends %}`.
    Eliminabili con un default `jinja: _entity_base.j2` in render.py (deciso di
    rimandare; quick win quando si vuole).
  - **`build()` lunga** (~170 righe in render.py): orchestrazione + config plugin in
    un'unica funzione. Spezzabile in `write_obsidian_config()` ecc.
  - **Doc plugin incompleta**: `Dev/Reference/` aggiornato solo per js-engine; mancano
    schede per meta-bind/dataview/bases/tab-panels/statblocks/dice/callout-manager/…
    (richiesta utente: una per plugin, con gotcha e gestione callout collassati).
  - **Test**: 105 verdi ma coprono la *generazione*, non il runtime Obsidian
    (Meta Bind/Dataview/Templater/JS Engine) — gap inerente, colmabile solo con QA manuale.

## 🌍 Worldbuilder

- **Pregi**: ontologia ricca (23 categorie), relazioni tipizzate, **assi tematici 1-5
  con etichette+descrizioni** (seed FantasyWorld, formato "fatto bene") + **radar** di
  carattere e **confronto fra entità**. Entità lore arricchite bespoke (luogo/mondo/
  fazione/cultura/oggetto/creatura/cosmologia/personaggio).
- **Gap per mondi profondi**:
  - **Timeline/storia**: gli eventi hanno `quando`/`portata` ma niente calendario o
    vista cronologica vera (Calendarium non integrato). Servono ere/epoche.
  - **Mappe**: nessuna integrazione (Excalidraw / Zoom Map oltre il doc LEGGIMI) —
    luoghi/mondi le vogliono.
  - **Cosmologia/pantheon**: gli assi sono ricchi, ma manca un'entità *divinità/pantheon*
    dedicata e legami cosmologia↔luogo↔culto più profondi (FantasyWorld aveva leggi/
    entità primordiali/domini).
  - **Generazione**: Fantasy Content Generator non agganciato (nomi/spunti rapidi).
  - **Fronti/clock** (`pressione`+`prossima_mossa`, stile Blades) ottimi → si possono
    approfondire con progress-clock e agende di fazione nel tempo.
- **Azione**: timeline + mappe sono i due salti di valore worldbuilding più grossi;
  poi pantheon/cosmologia.

## 🎲 DM (D&D 5/5.5e)

- **Pregi**: SRD 5.2.1 IT a portata (incantesimi/oggetti/mostri/condizioni), statblock
  (layout IT 2024), superficie giocabile, incontri con Fantasy Statblocks + **Initiative
  Tracker**, **Dice Roller** (macro `tiri()`: d20/vantaggio/svantaggio in PG e incontro;
  `diceRolling` negli statblock), rules-engine PG livello 1.
- **Gap al tavolo**:
  - **Difficoltà incontri**: l'incontro cita avversari a prosa ma niente budget XP/
    letalità 5e né pre-popolamento del blocco `encounter` dalle creature collegate.
  - **PG oltre il 1º livello**: il rules-engine fa il livello 1; mancano avanzamento,
    slot incantesimo, privilegi di classe, inventario.
  - **Quick-ref condizioni/regole** durante il gioco (le 15 condizioni SRD ci sono come
    note, ma non c'è un richiamo rapido in scheda/incontro).
- **Azione**: **difficoltà incontri** (budget XP + auto-popola da creature collegate) è
  il prossimo lift DM a maggior valore; la progressione PG è un lift maggiore.

## ✅ Backlog prioritizzato

**Subito (prossima conversazione)**
1. **QA pass in-app** — verificare l'esperienza generata (riduce il rischio #1): pannello
   Vista (js-engine), radar assi + legenda 1-5 + confronto, scheda PG (matematica),
   wizard, tabelle Meta Bind, statblock IT, encounter/iniziativa, `.base`. Su **note nuove**.
2. **Doc plugin** in `Dev/Reference/` (una per plugin) + gestione callout collassati/
   codice interno (richiesta utente).

**Medio termine**
3. **Strumenti DM al tavolo**: difficoltà incontri (budget XP, auto-popola `encounter`),
   quick-ref condizioni.
4. **Profondità worldbuilding**: timeline/calendario (Calendarium), mappe (Excalidraw/
   Zoom Map), pantheon/cosmologia più ricchi.
5. **Progressione PG**: livelli, slot incantesimo, privilegi.

**Quando comodo (quick win architetturali)**
6. Jinja opzionale (default `_entity_base.j2`) → elimina 3 thin shell.
7. Spezzare `build()` in render.py; ridurre la logica embeddata nelle note.

**Dopo (a sistema rifinito)**
8. Generazione nomi/spunti (Fantasy Content Generator), mappe relazioni (Canvas),
   integrazioni minori.

**Trasversale**: continuare a ridurre la propagazione della logica nelle note;
arricchire i seed da FantasyWorld; confermare in-app prima di allargare.

## Come ripartire

Repo pulito, 105 test verdi, tutto pushato (`235ad51`). Leggi questo file + la memoria
(`project-northstar.md`). Primo passo consigliato: **QA in-app** (apri il vault, crea
PG/Luogo/Fazione *nuovi*, verifica scheda/tabelle/wizard/Vista/radar/statblock/`.base`)
→ poi #2 (doc plugin) e #3 (difficoltà incontri).
