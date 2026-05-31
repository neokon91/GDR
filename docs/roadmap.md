# Analisi & Roadmap

Brief di stato e priorità per riprendere il lavoro. Quattro lenti (PM, Architect,
Worldbuilder, DM 5/5.5e) + backlog prioritizzato. Lo stato tecnico dettagliato è
in [architecture](architecture.md) / [data_model](data_model.md) /
[rules_layer](rules_layer.md) / [plugin_contracts](plugin_contracts.md).

> Aggiornata dopo i tre lavori di **Fase 1 (fondamenta)**: **grafo cosmologico** da
> FantasyWorld (5 categorie nuove: sistema_magico/dominio/legge_fondamentale/
> entita_primordiale/piano, cross-linkate) + assi divinita/lingua/specie; **PG di 1º
> livello SRD-completo** (specie/competenze/lingue/CA-armatura/equip/incantesimi);
> **note SRD** col contenuto recuperato (blocchi+tabelle). Prima: doc plugin (20 schede),
> 8 categorie lore, jinja opzionale, radar assi. **36 categorie, 20 con assi.** Tutto
> committato/pushato/buildato su `origin/main` (HEAD `cc150c5`).

## Dove siamo (sintesi)

Pipeline matura: sorgenti YAML/Jinja/JS → `render.py` (modulare) → `dist/GDR-vault`.
Modello fuso core+system+entities (**36 categorie**, 20 con assi), **trinità per-entità**
(YAML + Jinja `_entity_base` + `crea_<id>.js`), con gli **assi tematici scorporati** in
`YAML/assi/<id>.yaml` (formato ricco 1-5). **Jinja opzionale**: le entità uniformi non
dichiarano `jinja` → ereditano `_entity_base.j2`. **Grafo cosmologico** connesso
(dominio↔leggi↔entità primordiali↔piani↔sistemi magici). Differenziatore: **superficie
giocabile** su ogni nota lore (`uso_al_tavolo`/`gancio`/`pressione`/`prossima_mossa`).
**Rules-engine PG di 1º livello SRD-completo** (specie/competenze/lingue/CA-armatura/
equip/incantesimi → wizard `crea_pg` → scheda ricca). SRD 5.2.1 IT (1389 note col
contenuto pieno — condizioni/tabelle — + 334 mostri statblock, layout IT 2024). Pannelli
dinamici via **JS Engine** (`views.js`: Vista, backlink, **radar assi**, confronto). Indici
come **Bases** (`.base`) + hub Dataview (fallback). Home a 2 aree, Homepage, **145 test**, check 0.
**Stadio prodotto: scaffold ricco e solido; l'esperienza in-app è ancora da confermare.**

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
  snapshot + e2e wizard. Test (**129**, ridondanti sussunti dagli snapshot).
  Nuova entità = 1 YAML (+1 assi); Jinja solo per layout custom (default `_entity_base.j2`).
- **Debito/fragilità**:
  - **Logica embeddata nelle note**: il blocco `js-engine`/`statblock`/`dataview`
    finisce nel corpo alla creazione → modifiche a `views.js`/macro **non si
    propagano** alle note esistenti. Il loader js-engine (CommonJS via `new Function`)
    *attenua* (la logica vera è in `views.js`, importata a runtime) ma il blocco-guscio
    resta nel corpo. Tendere a note sottili + logica condivisa.
  - **Thin shell Jinja residui**: il default `_entity_base.j2` ora esiste
    (`common.DEFAULT_JINJA`) e le 8 nuove categorie lo sfruttano senza guscio, ma i 3
    file `cultura`/`lingua`/`nota.md.j2` (solo `{% extends %}`) sono ancora su disco →
    eliminabili subito ora che erediterebbero il default (quick win #6, residuo).
  - **`build()` lunga** (~170 righe in render.py): orchestrazione + config plugin in
    un'unica funzione. Spezzabile in `write_obsidian_config()` ecc.
  - **Doc plugin parziale**: `Dev/Reference/` ha 10 schede (core/templater/dataview/
    js-engine/tab-panels/meta-bind/metadata-menu/statblocks/tasks/dice). Mancano i
    plugin già cablati nella pipeline ma non documentati — **bases** (`.base`),
    **callout-manager** (qui il gotcha *callout collassati*), **iconize**, **homepage** —
    e quelli installati-ma-non-integrati (initiative-tracker/calendarium/excalidraw/
    zoom-map/fantasy-content-generator/brat). Richiesta utente: una per plugin, con gotcha.
  - **Test**: 129 verdi ma coprono la *generazione*, non il runtime Obsidian
    (Meta Bind/Dataview/Templater/JS Engine) — gap inerente, colmabile solo con QA manuale.

## 🌍 Worldbuilder

- **Pregi**: ontologia ricca (31 categorie), relazioni tipizzate, **assi tematici 1-5
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
  `diceRolling` negli statblock), **rules-engine PG di 1º livello SRD-completo** (specie/
  competenze/lingue/CA-armatura/equip/privilegi/incantesimi), note SRD col contenuto pieno.
- **Gap al tavolo**:
  - **Difficoltà incontri**: l'incontro cita avversari a prosa ma niente budget XP/
    letalità 5e né pre-popolamento del blocco `encounter` dalle creature collegate.
  - **PG oltre il 1º livello**: il 1º livello è completo; manca l'**avanzamento 2-20**
    (slot per livello, privilegi ai livelli successivi, ASI, sottoclasse). → Fase 2.
  - **Quick-ref condizioni/regole**: le 15 condizioni ora hanno gli effetti pieni nelle
    note SRD; manca ancora un richiamo *rapido* in scheda/incontro durante il gioco.
- **Azione**: **difficoltà incontri** (budget XP + auto-popola da creature collegate) è
  il prossimo lift DM a maggior valore; la progressione PG 2-20 è un lift maggiore.

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

### Fase 2 — Verso un vault ultra-pro (poi, in sequenza da valutare)
4. **Clock & conseguenze** (fronti/progress-clock, esiti che muovono il mondo) — il
   **ponte fra le due suite**: la giocata cambia il worldbuilding.
5. **Strumenti DM al tavolo**: difficoltà incontri (budget XP + auto-popola `encounter`
   dalle creature collegate; Initiative Tracker già cablato a livello base), quick-ref
   condizioni.
6. **Progressione PG** oltre il 1º livello: avanzamento, slot incantesimo, privilegi,
   inventario.
7. **Profondità worldbuilding**: timeline/calendario (Calendarium), mappe (Excalidraw/
   TTRPG Tools-Maps), legami cosmologia↔culto↔divinità più ricchi.

### Trasversale / continuo
- **QA in-app** su ogni pezzo di fondamenta prima di allargare (rischio #1).
- **Quick-win architetturali**: eliminare i 3 thin-shell `cultura`/`lingua`/`nota.md.j2`
  (jinja default già attivo); spezzare `build()` in render.py; ridurre la logica
  embeddata nelle note.
- Generazione nomi/spunti (Fantasy Content Generator) e integrazioni minori quando comodo.

### ✅ Fatto (sessione 2026-05-31)
- **Doc plugin** in `Dev/Reference/` — 20 schede + gotcha *callout collassati*.
- **Fase 1 fondamenta**: grafo cosmologico (5 categorie), PG-SRD di 1º livello completo,
  note SRD col contenuto recuperato. Tutto committato/pushato/buildato (`cc150c5`).
- **Roadmap** riorganizzata sulle due suite e aggiornata a Fase 1 coperta.

## Come ripartire

**145 test verdi**, check 0; HEAD `cc150c5` (tutto pushato+buildato). Leggi questo file
+ la memoria (`project-northstar.md`, `vault-due-suite.md`). **Fase 1 fondamenta coperta**
→ prossimi candidati: (a) **QA in-app** di tutto il lavoro (rischio #1: PG nuovo mago/
guerriero, grafo cosmologia, note SRD/condizioni, radar su divinita/oggetto); (b) seed FW
minori come campi/subtypes; poi **Fase 2** (clock & conseguenze → ponte fra le due suite,
difficoltà incontri, progressione PG 2-20, timeline/mappe).
