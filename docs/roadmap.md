# Roadmap

Stato e priorità del vault GDR (worldbuilding profondo *connesso* al tavolo D&D 5.5e).
Il **come** sta nei doc tecnici ([architecture](architecture.md) · [data_model](data_model.md) ·
[rules_layer](rules_layer.md) · [play_layer](play_layer.md) · [plugin_contracts](plugin_contracts.md));
la **cronistoria** dettagliata vive nelle memorie di progetto. Qui: dove siamo e cosa manca.

## Stato (2026-06-02)

`origin/main`, **246 test**, check 0. Pipeline matura: sorgenti YAML/Jinja/JS → `render.py`
→ vault Obsidian (+ sito giocatori opzionale). Mondo-esempio **Valdombra** popolato.

**Verdetto 4-lenti** (analisi fresca, tarata sui competitor — World Anvil/Kanka/LegendKeeper/
Foundry/D&D Beyond): Architetto **8** · World-builder **8** · Game-designer 5.5e **8** · PM **6.5**.
Il *wedge* difendibile — grafo-di-mondo che **compila in superficie giocabile** + motore-regole
2024 + locale/proprietà del dato — non è coperto da nessun competitor. Il PM resta più basso per
**distribuzione/condivisione**, non per profondità (che è già abbondante).

Pronto per **beta chiuso**. Per la beta aperta restano i punti PM qui sotto.

## Fatto (consolidato)

- **Modello di mondo** — 36 categorie (classificazione `famiglia`+`tipo`), relazioni tipizzate
  con inversi auto-derivati, assi tematici 1-5 (radar/archetipi), **economia/risorse**,
  **geografia** (coord/confini/distanza/viaggio), **timeline causale**, **Fronti reattivi al
  grafo**, tema natale, strato cosmico con assi.
- **Sistema 5.5e / DM** — PG SRD-completo (1º liv) + **level-up 2-20**; statblock 5.5e (+5e);
  **loop di sessione 2024** (Esaurimento, Dadi Vita, riposo breve/lungo, concentrazione 🌀);
  incantesimi inline, condizioni, maestrie armi; **encounter** budget XP 2024 + auto-riscrittura
  + **alleati** (`ally`); clock/Fronti; **ponte homebrew→motore** (incantesimi/talenti/background/
  specie/classe giocabili); **tiri Dice Roller col bonus reale** sulla scheda PG.
- **Onboarding & condivisione** — mondo-esempio Valdombra; **on-ramp Home** (6 tipi primari,
  metafisica opt-in); LEGGIMI di distribuzione; **sito dei giocatori** statico spoiler-free
  (`npm run site`, `visibilita: dm`).
- **Solidità** — 246 test (snapshot + e2e JS + rules-engine), validazione del contratto
  YAML↔wizard, anti-drift byte-equal (`_comparators.js`/`_homebrew_bridge.js`), merge config
  `.obsidian` non distruttivo, mondo-esempio rigenerato a ogni build.

## Aperti — prioritizzati

### PM / crescita (il gap del verdetto)
- **Distribuzione & scoperta** — GitHub release (versioning + issue per feedback) e/o itch.io
  (vetrina + name-your-price). *Scelta utente: per ora resta **free + ZIP manuale** finché si
  sviluppa.* Posizionamento/pricing da definire quando si apre.
- **Condivisione ai giocatori — evoluzione** — il sito esiste; approfondire con **rivelazione
  progressiva / livelli di visibilità** (estende `visibilita`, modello Kanka): una vista
  "occhi del giocatore" che svela per gradi.
- **Onboarding guidato** — tour "crea il tuo primo mondo in 10 minuti" + wizard di worldbuilding
  a tappe con spunti suggeriti (accoglienza che oggi manca rispetto a World Anvil).

### 5.5e / DM (completare l'esperienza di sessione)
- **Sottoclasse homebrew** — dichiarabile/giocabile in `sali_pg` + `privilegi_l1` della classe
  homebrew (si fa modificando `_homebrew_bridge.js` e risincronizzando le copie).
- **Override HP/CA inline** negli incontri (`- N: Nome, HP, CA, init`) per boss/gregari ed
  encounter ripetibili — serve una fonte-dato per-creatura nell'incontro.
- **Maestrie per-arma applicate** ai tiri d'attacco (la mappa arma→proprietà c'è già).
- **Bastioni** — catalogo strutture speciali (contenuto DMG, **non** nel SRD → serve fonte) +
  risoluzione automatica degli ordini.

### Worldbuilding (profondità)
- **Legami cosmologia↔culto↔divinità** più ricchi.
- **Recuperi da FantasyWorld**: alberi evolutivi / skill-tree (`alberi_evolutivi.json`); seed
  minori come campi/subtypes (rito/dottrina/simbolo/titolo/conflitto/genealogia); categorie
  astrologiche come entità (opt-in, per i mondi dove l'astrologia conta).
- **Geografia avanzata — importer Azgaar** (design concordato, **non** implementato). Principio:
  la mappa-immagine è la tela, le note sono lo strato curato. **NO import a tappeto**: import a
  livelli con budget (solo il tier alto: stati/capitali/province/culture/religioni), il long-tail
  resta **dato** queryabile (`azgaar/<mondo>.json`), promozione on-demand di singole note,
  idempotente/reversibile. L'importer **cabla** nel grafo (containment→regione, adiacenza→
  `confina_con`, routes→`rotta_con`, coord→`coord`). Backbone `coord`/`scala_mappa`/distanza ✅.

### Runtime / tech
- **Reattività live** (`engine.reactive`) — radar/infobox che si ridisegnano allo slider senza
  riaprire la nota (ponte evento Meta Bind↔JS Engine).
- **Bases `cards`** — galleria ritratti (serve key immagine + asset).

### Frontiera / esplorazioni
- **Memoria-di-campagna AI locale** (Ollama + RAG sul grafo già strutturato): continuità di
  campagna / "prossime mosse" dai Fronti, **in locale** — wedge di 2ª generazione che nessun
  competitor locale presidia. Esplorativo, dopo i punti PM.

## QA in-app (igiene continua, rischio #1)

I 246 test coprono la *generazione*, non il *rendering runtime* dei plugin: ogni QA in-app ha
storicamente trovato bug reali.
- **Verificato**: dashboard popolate, note (infobox/callout/clock), Esaurimento + Riposo lungo,
  `renderSpecieTratti`, wizard *Crea PG*, statblock 5.5e/5e, Meta Bind/Dataview/Calendarium/Tasks;
  ✅ (2026-06-02) **tiri Dice Roller col bonus dal frontmatter** (tooltip «1d20 + mod_forza [15] + 3»)
  e **sito dei giocatori** (Safari: stilizzato, spoiler-free, tabella GM esclusa).
- **Finding QA**: `dice: [[Nota]]` su una nota-lista **incorpora** l'elenco, non pesca una riga
  (doc/demo corretti; il single-pick richiede il formato tabella DR — da approfondire).
- **Da spuntare**: flag `, ally` di Initiative Tracker (serve Party + incontro con alleati),
  scheda PG (Dadi Vita/Concentrazione live), reattività live del radar.

## Come ripartire

Leggi questo file + i doc tecnici + le memorie (`audit-2026-competitor`, `geografia-timeline`,
`project-northstar`). Candidato naturale appena torna computer-use: **QA in-app** del blocco
recente; poi, a scelta, **sottoclasse homebrew** o un punto **PM** (distribuzione / rivelazione
progressiva / onboarding guidato).
