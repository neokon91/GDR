# Roadmap

Stato e priorità del vault GDR (worldbuilding profondo *connesso* al tavolo D&D 5.5e).
Il **come** sta nei doc tecnici ([architecture](architecture.md) · [data_model](data_model.md) ·
[rules_layer](rules_layer.md) · [play_layer](play_layer.md) · [plugin_contracts](plugin_contracts.md));
la **cronistoria** dettagliata vive nelle memorie di progetto. Qui: dove siamo e cosa manca.

## Stato (2026-06-03)

`origin/main` (`84bca8e`), **269 test**, check 0. Pipeline matura: sorgenti YAML/Jinja/JS →
`render.py` → vault Obsidian (+ sito giocatori opzionale). Vault parte vuoto: onboarding via
wizard + callout **ℹ️ Guida** per-entità (il mondo-esempio Valdombra è stato rimosso).

**Ultima sessione** (2026-06-03): consolidamento ontologia (principio di inclusione + merge
`istituzione→fazione`); irrobustimento (harness + copertura pannelli/radar, **cap a scala** dei
cruscotti); onboarding «Inizia da qui»; **fix Tab Panels↔Meta Bind** (crash `onCacheChanged` risolto:
`enableCaching:false`); **scaffolder mostri GS→statblock** (boss homebrew giocabili, base da mediane
SRD); **inversi reciproci nel wizard** (`_relations.js` canonico); **generatori in-casa Stage 1→3**
(14 tipi: nomi + PNG/taverna/bevanda/gancio/diceria/bottino/insediamento/oggetto/meteo/dungeon +
**tesoro legato all'SRD** — parità FCG raggiunta → **dipendenza FCG ritirata**). Pubblicazione
decisa: **no-ZIP**, repo + sito statico condivisibile, licenze verificate (pulite).

**Verdetto 4-lenti** (analisi fresca 2026-06-04, tarata sui competitor — World Anvil/Kanka/
LegendKeeper/Foundry/D&D Beyond): Architetto **8** · World-builder **8.5** · Game-designer 5.5e
**8.5** · PM **4.5**. Il *wedge* difendibile — grafo-di-mondo che **compila in superficie
giocabile** (econ+geo+cosmo+**teologico**) + motore-regole 2024 + locale/proprietà del dato — non
è coperto da nessun competitor: profondità ormai **abbondante e matura**.

⚠️ **Divergenza che conta: il PM è CROLLATO a 4.5** (era 6.5) e non per qualità — per **adozione
≈ 0**: niente è raggiungibile da un umano esterno. Prove concrete dall'audit: il repo GitHub
risponde **404** (privato/non pushato), gli screenshot citati dal README (`docs/images/*.png`)
**non esistono**, nessuna *release* (solo `git tag v0.1.0-rc1` locale), CHANGELOG «Non rilasciato».
Tre audit di fila convergono: **il vincolo è la DISTRIBUZIONE, non il prodotto.** Verdetto PM sulle
feature recenti (grafo teologico, ponte IT, World Board): ottime ma **ritorno decrescente** —
*product debt mascherato da progresso*, aggiunte senza un solo utente reale. La prima ora spesa a
**pubblicare** ha ROI potenzialmente infinito; ogni ora di nuove feature prima del push, marginale.

Pronto per **beta chiuso** da molte sessioni; il blocco è SOLO il gesto di pubblicazione (vedi
§«Come ripartire»). Le mosse #1 delle altre lenti (tutte «altro build») restano valide ma secondarie
al push: **architect** = `node` obbligatorio in `check()`/CI (79 test oggi `skipif(not node)` →
spariscono in verde senza node) + smoke-test di contratto sull'API IT bundlata; **world-builder** =
**importer Azgaar** (unico punto dietro a tutti i competitor: mappa→grafo calibrato); **game-designer**
= **tracker risorse-di-classe a ricarica** (Ki/Rabbia/Incanalare/patto-Warlock: ultimo buco SRD del
loop di sessione, tocca metà delle classi).

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
- **Distribuzione & scoperta** — ✅ *tooling pronto*: `npm run dist` (`release.py`) confeziona
  il **vault turnkey** (plugin inclusi) + il **sito** in zip versionati; README con sezione
  «Per i Game Master», `CHANGELOG.md`, [docs/releasing.md](releasing.md) coi passi `gh release`.
  *Resta l'atto di pubblicare* (GitHub release e/o itch.io vetrina/name-your-price) — scelta
  utente su quando aprire; posizionamento/pricing da definire allora. Verificare le licenze
  dei plugin bundlati prima del pubblico (o release `--no-plugins` + BRAT, da valutare).
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
  ✅ **Tour «Crea il tuo mondo»** (nota generata persistente): 5 tappe dal foglio bianco
  (Mondo→Luogo→Fazione→Collega→Accendi la superficie giocabile) con bottoni Crea, link ai
  cruscotti e **spunti** (domande-stimolo). ✅ **Spunti anche nelle note**: callout 💡
  pieghevole nel tab Lore (macro `spunti()` da `core.spunti`, 9 categorie d'avvio) →
  l'accoglienza stile World Anvil è dove il GM scrive davvero. Linkato da Home.

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
- ✅ **Bastioni — turno risolto (license-safe)** — `turno_bastione` non è più un prompt
  libero: la scheda dichiara le `ordini` (lista *«Struttura | Ordine | esito»*, con dadi
  `1d6`/`1d4×10`/`2d6+1` opzionali nell'esito) e l'azione **risolve** il turno — tira gli
  esiti (`rollInline`/`resolveTurno`), numera il turno (`turni`+1), e scrive un blocco datato
  per-struttura nel *Registro dei turni*. **Ordini ed esiti sono AUTORIALI**: nessuna tabella
  del DMG riprodotta (solo il quick-ref dei 7 ordini generici, già presente). Senza `ordini`,
  ricade nel prompt libero. (FATTO)

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
- ✅ **Legami cosmologia↔culto↔divinità — grafo TEOLOGICO** — la metafisica ora preme
  sul tavolo *dal lato dei mortali*, non solo via il clock della divinità. `spinteFronte`
  deriva per un **Fronte religioso** (categoria `culto` o `tipo: culto`) spinte teologiche:
  il **dio/dominio cosmico venerato** (`divinita`/`domini`→COSMO) che si desta o freme, un
  **culto rivale** in ascesa (i culti-rivali passano dal grafo economico generico al
  teologico, niente doppioni), una **profezia/mito** che lo riguarda che matura (inlink che
  avanza). `culto` aveva già assi ricchi (`assi/culto.yaml`) ed era già in `coerenza_categorie`.
  Demo Valdombra: *La Setta della Voragine* venera *Vorth il Sepolto* (che freme) e custodisce
  *La Profezia del Risveglio* (4/6, che matura) → entrambe spingono la Setta nel cruscotto Fronti.
  Riusa il motore `spinteFronte`/`COSMO`; visibile in *Stato del Mondo* come le spinte cosmiche. (FATTO)
- **Recuperi da FantasyWorld**: ✅ **alberi evolutivi / skill-tree** — nuova entità
  `albero_evolutivo` (progressioni *lore* ramificate: tradizione/lignaggio/evoluzione/
  iniziazione/dottrina; nodi nella proprietà `nodi` = righe `grado | nome | prereq | effetto`,
  resi a gradi da `renderAlbero`, agganciata al grafo via sistema_magico/specie/culto). ✅ **seed
  minori mirati** (anti-filler: l'audit ha mostrato che rito/conflitto/titolo/genealogia erano
  già coperti; aggiunti solo i vuoti veri) — `simbolo`→cultura/regno/fazione, `rivali`→culto/
  divinità, `dottrina`→sistema_magico. Resta: categorie astrologiche come entità (opt-in).
- ✅ **World Board (Obsidian Canvas)** — `world_board_canvas()` genera dal grafo del
  mondo-esempio un `.canvas` (card-file per entità in colonne per categoria + archi delle
  relazioni tipizzate): vista visiva «a colpo d'occhio», alternativa alla dashboard Rete.
  Spunto realizzato dal competitor **vvd**. ✅ **Esteso ai mondi dell'utente** (azione runtime
  `world_board`, bottone *Genera World Board* sulla nota-mondo): enumera le note del mondo
  scelto (la nota-mondo + ogni nota col suo `mondo`), costruisce il `.canvas` e lo scrive
  accanto alla nota-mondo (ripremibile = aggiorna). Gemello-JS di `world_board_canvas` (stesso
  algoritmo/costanti/colori da `core.canvas_colors`); un **test di parità** impone che JS e
  Python diano lo stesso canvas. Non più solo l'esempio/build-time.
- **Mappe — pin manuale (filone CHIUSO con conclusione)**: zoom-map (*TTRPG Tools - Maps*)
  memorizza i marker in `<immagine>.markers.json` (o inline con `storage: note`); piazzamento
  **solo via GUI**, nessun data-binding nativo. **Conclusione onesta**: NON si può auto-piazzare
  pin da `coord` *astratte* su un'immagine caricata (le coord non sono calibrate sui pixel di
  *quella* figura; nemmeno vvd lo fa — pinni trascinando). La posizione in-immagine ha solo due
  sorgenti: (1) qualcuno la segna sull'immagine (manuale), (2) l'immagine nasce coi dati (Azgaar).
  Due strade reali, **rimandate**: **(a)** manuale + *sync pin→coord* (un'azione legge `markers.json`
  e riscrive i `coord` → la mappa diventa fonte di geografia; non elimina il primo clic);
  **(b) importer Azgaar** = vero auto-pin (immagine+coord nello stesso spazio).
- **Geografia avanzata — importer Azgaar** (design concordato, **non** implementato; è la via
  (b) qui sopra). Principio: la mappa-immagine è la tela, le note sono lo strato curato. **NO
  import a tappeto**: import a livelli con budget (solo il tier alto: stati/capitali/province/
  culture/religioni), il long-tail resta **dato** queryabile (`azgaar/<mondo>.json`), promozione
  on-demand di singole note, idempotente/reversibile. L'importer **cabla** nel grafo
  (containment→regione, adiacenza→`confina_con`, routes→`rotta_con`, coord→`coord`). Backbone
  `coord`/`scala_mappa`/distanza ✅.

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
  *single-pick* tabella DR. ✅ **Party PG nel tracker** — risolto: `inizia_incontro` (bottone
  *Prepara il gruppo (IT)* nel tab Combattimento) auto-popola il Party di Initiative Tracker
  dai PG del vault (personaggio · tipo pg) via `savePlayer`/`saveSettings`, non-distruttivo →
  `players: true` risolve senza config manuale. Ponte a IT, nessuna duplicazione (IT resta il
  motore del combattimento; i mostri li risolve già il blocco encounter).

## Come ripartire

Leggi questo file + i doc tecnici + le memorie.

### 🔴 LA cosa, non «una delle»: PUBBLICARE (il verdetto unanime, ora critico)
Tre audit di fila lo dicono e il PM è crollato a **4.5** perché il funnel **inizia con una porta
chiusa**. Non è «idealmente»: è **il** lavoro. Sforzo ~1-2 ore, ROI potenzialmente infinito.
Fatti concreti da sistemare (rilevati dall'audit, in ordine):
1. **Screenshot mancanti** — il README/itch citano `docs/images/*.png` (nota+mappa, radar Carattere,
   World Board, sito-giocatori) che **NON esistono**: catturarli e committarli. Senza immagini un tool
   *visuale* non si scarica (vvd vince sul colpo d'occhio).
2. **Repo 404** — `git push` rendendo il repo **pubblico** (oggi irraggiungibile).
3. **Release** — `npm run dist` + `gh release create v0.1.0` (oggi solo `git tag v0.1.0-rc1` locale,
   CHANGELOG «Non rilasciato» → aggiornarlo).
4. **itch** — `npm run publish:itch` (butler già agganciato) con gli screenshot sulla pagina.
5. Poi i **3-5 DM beta** (template «🎲 Feedback beta» già live) → il primo segnale esterno.

⚠️ Tutto il tooling (`release.py`, `publish_itch.py`) è **pronto e mai eseguito** verso il pubblico.
Ogni nuova feature prima di questo push è **ritorno decrescente** (product debt).

### Candidati build (DOPO il push — secondari per ogni lente)
- **architect**: `node` obbligatorio in `check()`/CI — oggi 79 test `skipif(not node)` spariscono in
  verde senza node (1 fallisce pure: `"node"` hard-coded non guardato); + smoke-test di *contratto*
  sull'API IT bundlata (`savePlayer`/`saveSettings`), che oggi è mock-only e fragile a un update del plugin.
- **world-builder**: **importer Azgaar** (mappa→grafo calibrato) — l'unico punto dietro a TUTTI i
  competitor; hai già il grafo curato in cui far atterrare i dati (containment→regione, adiacenza→
  `confina_con`, routes→`rotta_con`, coord→`coord` sui pixel) → chiude il gap mappa E popola il geo che
  alimenta `spinteFronte`.
- **game-designer**: **tracker risorse-di-classe a ricarica** (campo `usi_<risorsa>`/`usi_max` generico
  nella scheda PG + reset nei riposi per tipo): Ki/Punti Stregoneria/Incanalare/Rabbia/**patto Warlock**
  (ricarica su riposo *breve*). Ultimo vero buco SRD del loop di sessione, tocca metà delle classi.
- Esplorativi: memoria-di-campagna AI locale (frontiera); timeline multi-scala / vista «mappa del sacro».
