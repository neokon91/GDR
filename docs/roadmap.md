# Roadmap

Stato e priorità del vault GDR (worldbuilding profondo *connesso* al tavolo D&D 5.5e).
Il **come** sta nei doc tecnici ([architecture](architecture.md) · [data_model](data_model.md) ·
[rules_layer](rules_layer.md) · [play_layer](play_layer.md) · [plugin_contracts](plugin_contracts.md));
la **cronistoria** dettagliata vive nelle memorie di progetto. Qui: dove siamo e cosa manca.

## Stato (2026-06-03)

`origin/main` (`84bca8e`), **269 test**, check 0. Pipeline matura: sorgenti YAML/Jinja/JS →
`render.py` → vault Obsidian (+ sito giocatori opzionale). Mondo-esempio **Valdombra** popolato.

**Ultima sessione** (2026-06-03): consolidamento ontologia (principio di inclusione + merge
`istituzione→fazione`); irrobustimento (harness + copertura pannelli/radar, **cap a scala** dei
cruscotti); onboarding «Inizia da qui»; **fix Tab Panels↔Meta Bind** (crash `onCacheChanged` risolto:
`enableCaching:false`); **scaffolder mostri GS→statblock** (boss homebrew giocabili, base da mediane
SRD); **inversi reciproci nel wizard** (`_relations.js` canonico); **generatori in-casa Stage 1→3**
(14 tipi: nomi + PNG/taverna/bevanda/gancio/diceria/bottino/insediamento/oggetto/meteo/dungeon +
**tesoro legato all'SRD** — parità FCG raggiunta → **dipendenza FCG ritirata**). Pubblicazione
decisa: **no-ZIP**, repo + sito statico condivisibile, licenze verificate (pulite).

**Verdetto 4-lenti** (analisi fresca, tarata sui competitor — World Anvil/Kanka/LegendKeeper/
Foundry/D&D Beyond): Architetto **8** · World-builder **8** · Game-designer 5.5e **8** · PM **6.5**.
Il *wedge* difendibile — grafo-di-mondo che **compila in superficie giocabile** + motore-regole
2024 + locale/proprietà del dato — non è coperto da nessun competitor. Il PM resta più basso per
**distribuzione/condivisione**, non per profondità (che è già abbondante).

Pronto per **beta chiuso**. Per la beta aperta restano i punti PM qui sotto.

## Fatto (consolidato)

- **Modello di mondo** — 36 categorie (classificazione `famiglia`+`tipo`; `istituzione` assorbita
  in `fazione` col merge SYS-2 — vedi [data_model §Principio di inclusione](data_model.md)), relazioni tipizzate
  con inversi auto-derivati, assi tematici 1-5 (radar/archetipi, **preset famiglia→assi**,
  **motore di coerenza** `renderCoerenza` che fa emergere le tensioni tematiche fra entità
  collegate — contrasti forti, rivali-specchio), **economia/risorse**,
  **geografia** (coord/confini/distanza/viaggio), **timeline causale**, **cronologia per-entità**
  (stati epoch-stamped — il mondo *cambia*: fondato→fiorito→caduto, `tappe`/`renderTappe`,
  **integrate nella timeline globale** accanto agli eventi),
  **alberi evolutivi** (progressioni lore ramificate), **Fronti reattivi al grafo** (econ/geo **e cosmico**: un
  principio cosmico-Fronte è spinto dai suoi siti di manifestazione in crisi e dai dipendenti
  che vacillano → la metafisica preme sul tavolo) + cruscotto **Stato del Mondo** (`renderStatoMondo`,
  dashboard Fronti) che ordina tutti i Fronti per imminenza = clock + spinte dal grafo, per la prep
  di sessione, tema natale, strato cosmico con assi.
- **Sistema 5.5e / DM** — PG SRD-completo (1º liv) + **level-up 2-20**; statblock 5.5e (+5e);
  **loop di sessione 2024** (Esaurimento, Dadi Vita, riposo breve/lungo, concentrazione 🌀);
  incantesimi inline, condizioni, maestrie armi; **encounter** budget XP 2024 + auto-riscrittura
  + **alleati** (`ally`); clock/Fronti; **ponte homebrew→motore** (incantesimi/talenti/background/
  specie/classe/**sottoclasse** giocabili); **tiri Dice Roller col bonus reale** sulla scheda PG.
- **Onboarding & condivisione** — mondo-esempio Valdombra + **nota guidata «Inizia da qui»**
  (UX-1, momento-aha: in 3 passi mostra lore→superficie giocabile calcolata, col bottone
  `crea-luogo` e il link al cruscotto Fronti; read-only, `visibilita: dm`, vive/muore con
  l'esempio); **on-ramp Home** (6 tipi primari, metafisica opt-in; il tip apre «Inizia da qui»);
  LEGGIMI di distribuzione; **sito dei giocatori** statico spoiler-free
  (`npm run site`, `visibilita: dm`) con **rivelazione progressiva** (`rivelazione`
  pubblico/incontrato/segreto + `--reveal`): il portale svela per gradi.
- **Solidità** — 265 test (snapshot + e2e/headless JS + rules-engine), validazione del contratto
  YAML↔wizard, anti-drift byte-equal (`_comparators.js`/`_homebrew_bridge.js`), merge config
  `.obsidian` non distruttivo, mondo-esempio rigenerato a ogni build. Copertura headless dei
  pannelli (`renderEntityPanel`/`renderSessionPanel`) e dell'injection-DOM dei radar
  (`renderAxesRadar`/`renderAxesCompare`). **Stress-test a scala (SYS-3)**: un grafo grande e
  sporco (84 fronti, link pendenti, dati mancanti) verifica robustezza e tempi — emerso che
  `renderStatoMondo`/`renderCoerenza`/`renderPressioni` erano *senza cap* (muro a scala) →
  aggiunti **top-N + dichiarazione del totale** (no silent cap); performance già lineare.

## Aperti — prioritizzati

### PM / crescita (il gap del verdetto)
- **Distribuzione & scoperta** — GitHub release (versioning + issue per feedback) e/o itch.io
  (vetrina + name-your-price). *Scelta utente: per ora resta **free + ZIP manuale** finché si
  sviluppa.* Posizionamento/pricing da definire quando si apre.
- ✅ **Condivisione ai giocatori — rivelazione progressiva** — campo `rivelazione`
  (pubblico<incontrato<segreto), ortogonale a `visibilita` (il «mai»); il build del sito
  sceglie il livello (`npm run site -- --reveal <tier>`) e include una nota se il suo tier
  ≤ livello → il portale «svela per gradi» man mano che la campagna procede (modello Kanka).
  Selettore 👁 *Condivisione* nel tab *Al tavolo*; l'indice mostra il livello e quante voci
  restano. Demo: Valdombra (La Voragine=incontrato, Vorth=segreto). (FATTO)
  ✅ **Rivelazione per-sezione**: callout `[!rivela|<tier>]` (player-facing, gated dal
  build) → una nota pubblica può celare una verità che emerge a un livello più alto
  (demo: Forte Cenere «cosa sogna sotto le cantine» a `--reveal segreto`). (FATTO)
  ✅ **Anteprima «occhi del giocatore» in-vault**: dashboard Dataview che mostra cosa
  vedono i giocatori per tier, senza buildare il sito (in Home). (FATTO)
- **Onboarding guidato** — ✅ il **momento-aha** è coperto dalla nota «Inizia da qui» (UX-1).
  Resta il *tour interattivo* più profondo: wizard di worldbuilding a tappe con spunti
  suggeriti (accoglienza alla World Anvil) — opzionale, dopo il primo segnale dagli utenti.

### 5.5e / DM (completare l'esperienza di sessione)
- ✅ **Sottoclasse homebrew** — `sali_pg` offre le sottoclassi homebrew del vault al
  `livello_sottoclasse`; `privilegi_l1` della classe homebrew applicati in `crea_pg`. (FATTO)
- ✅ **Override HP/CA inline** negli incontri (`- N: Nome, HP, CA, init`) per boss/gregari ed
  encounter ripetibili — il frontmatter `varianti` dell'incontro è la fonte-dato per-creatura;
  `aggiorna_encounter` la applica (hp è l'ancora posizionale). (FATTO)
- ✅ **Maestrie per-arma applicate** ai tiri d'attacco — la scheda PG ha un pannello
  *Attacchi con maestria* (`renderAttacchi`): per ogni arma di cui il PG ha padronanza,
  tiro per colpire (mod arma + competenza) + danni + effetto della maestria, dal catalogo
  armi SRD (`build_personaggio._weapon_catalog`). (FATTO)
- ✅ **Scaffolder mostri GS→statblock** — un boss homebrew con solo `gs` diventa giocabile: il
  bottone *Genera statblock dal GS* (`meta_actions.scaffold_statblock`) riempie il blocco
  ` ```statblock ` coi valori-base derivati dalle **mediane dei mostri SRD di pari GS**
  (`build_srd.gs_baselines` → `core.json:gs_baseline`): AC/PF/BC/iniziativa + un'azione d'attacco
  col bonus e il danno tipici (+ azione-salvezza). **Fonte SRD, non DMG** → niente vincolo di
  licenza; fallback al GS più vicino. (FATTO)
- **Bastioni** — catalogo strutture speciali (contenuto DMG, **non** nel SRD → serve fonte) +
  risoluzione automatica degli ordini.

### Worldbuilding (profondità)
- ✅ **Generatore homebrew → parità FCG raggiunta, dipendenza FCG ritirata.** Alternativa
  *in casa* (italiano, a tema, riusa lo `stile_nomi` della cultura/specie; **con API** →
  agganciabile): `generatori.yaml`+`genera.js`, **14 tipi** nel registro `GENERATORI`
  (estendibile: sezione `forme` in YAML + una riga; `generaDaForme` generico; validazione
  placeholder auto-rilevata). **Stage 1**: persona/toponimo/fazione + PNG/taverna/gancio.
  **Stage 2**: diceria, bottino, insediamento, oggetto. **Stage 3**: meteo/presagio,
  dungeon-stanza, bevanda + **tesoro legato all'SRD** (monete a fascia + un oggetto/equip
  reale per rarità, dai JSON SRD via `srd_loot_pool()` → `tesoro._srd`, funzione dedicata
  `generaTesoro`). Coperte tutte le categorie FCG (in IT/a tema) → **FCG rimosso** (un plugin
  di terzi in meno: ZIP/licenza più puliti).
- **Legami cosmologia↔culto↔divinità** più ricchi.
- **Recuperi da FantasyWorld**: ✅ **alberi evolutivi / skill-tree** — nuova entità
  `albero_evolutivo` (progressioni *lore* ramificate: tradizione/lignaggio/evoluzione/
  iniziazione/dottrina; nodi nella proprietà `nodi` = righe `grado | nome | prereq | effetto`,
  resi a gradi da `renderAlbero`, agganciata al grafo via sistema_magico/specie/culto). ✅ **seed
  minori mirati** (anti-filler: l'audit ha mostrato che rito/conflitto/titolo/genealogia erano
  già coperti; aggiunti solo i vuoti veri) — `simbolo`→cultura/regno/fazione, `rivali`→culto/
  divinità, `dottrina`→sistema_magico. Resta: categorie astrologiche come entità (opt-in).
- **Geografia avanzata — importer Azgaar** (design concordato, **non** implementato). Principio:
  la mappa-immagine è la tela, le note sono lo strato curato. **NO import a tappeto**: import a
  livelli con budget (solo il tier alto: stati/capitali/province/culture/religioni), il long-tail
  resta **dato** queryabile (`azgaar/<mondo>.json`), promozione on-demand di singole note,
  idempotente/reversibile. L'importer **cabla** nel grafo (containment→regione, adiacenza→
  `confina_con`, routes→`rotta_con`, coord→`coord`). Backbone `coord`/`scala_mappa`/distanza ✅.

### Runtime / tech
- ✅ **Reattività live** (`engine.reactive`) — il **radar** si ridisegna allo slider senza
  riaprire la nota (verificato in-app). L'infobox usa già VIEW Meta Bind (reattivo nativo).
- **Bases `cards`** — galleria ritratti (serve key immagine + asset).

### Frontiera / esplorazioni
- **Memoria-di-campagna AI locale** (Ollama + RAG sul grafo già strutturato): continuità di
  campagna / "prossime mosse" dai Fronti, **in locale** — wedge di 2ª generazione che nessun
  competitor locale presidia. Esplorativo, dopo i punti PM.

## QA in-app (igiene continua, rischio #1)

Distinzione utile: i test coprono la *generazione* **e** la *logica delle funzioni di rendering*
(`views.js` eseguito headless in Node con mock `dv`/`app`/`container` — ~30 test, incl. il
percorso di injection DOM dei radar `renderAxesRadar`/`renderAxesCompare` e i pannelli
`renderEntityPanel`/`renderSessionPanel`). Quello che **resta** scoperto è l'*integrazione
plugin* vera (Meta Bind che binda, Dataview che indicizza, reattività live nel DOM Obsidian):
non testabile headless → ogni QA in-app ha storicamente trovato bug reali.
- **Verificato**: dashboard popolate, note (infobox/callout/clock), Esaurimento + Riposo lungo,
  `renderSpecieTratti`, wizard *Crea PG*, statblock 5.5e/5e, Meta Bind/Dataview/Calendarium/Tasks;
  ✅ (2026-06-02) **tiri Dice Roller col bonus dal frontmatter** (tooltip «1d20 + mod_forza [15] + 3»),
  **scheda PG live** (Dadi Vita / Concentrazione / Riposo breve end-to-end), **IT alleati** (`ally`),
  **radar reattivo** (`engine.reactive`: slider→radar live) e **sito dei giocatori** (Safari: spoiler-free).
- **Finding QA**: `dice: [[Nota]]` su una nota-lista **incorpora** l'elenco, non pesca una riga
  (doc/demo corretti; il single-pick richiede il formato tabella DR — da approfondire).
- **Da spuntare**: nulla di critico nel blocco recente (tutto verificato). Aperto solo il
  *single-pick* tabella DR e il **Party** PG nel tracker (config IT lato utente).

## Come ripartire

Leggi questo file + i doc tecnici + le memorie. Stato pulito, tutto su `origin/main`.
**Prima cosa, idealmente**: la **pubblicazione** (rendere il repo accessibile + 3-5 DM reali → il
template «🎲 Feedback beta» è già live) per il primo segnale esterno; **oppure** la **QA in-app del
blocco recente** (inverse-nel-wizard, i 14 generatori incl. tesoro SRD + bevanda, merge
`istituzione→fazione`, `renderAxesCompare`/`renderSessionPanel`) — da fare quando computer-use è
di nuovo disponibile. Candidati build: **importer Azgaar** (cantiere worldbuilding), rivelazione
progressiva ai giocatori, memoria-di-campagna AI locale (frontiera).
