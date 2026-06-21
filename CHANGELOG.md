# Changelog

Tutte le modifiche degne di nota. Formato ispirato a [Keep a Changelog](https://keepachangelog.com/it/);
versioni [SemVer](https://semver.org/lang/it/). Le date sono `AAAA-MM-GG`.

## [Non rilasciato]

### Corretto
- **PF retroattivi su ASI/`concede` di Costituzione** (`sali_pg.js`, `crea_pg.js`): alzare il
  modificatore di Costituzione ora aggiunge +1 PF **per ogni livello** (RAW 5.5e), non solo sul
  livello nuovo — prima `pf_max` era fissato col mod COS pre-ASI. Anche a creazione i PF di L1 si
  calcolano DOPO il `concede` del privilegio di livello 1. Test di regressione aggiunto.
- **ASI «+2 a una caratteristica» non azzera più un `concede` dello stesso livello** (`sali_pg.js`):
  il ramo leggeva solo il frontmatter, scartando un bonus-punteggio appena concesso da un
  privilegio-classe homebrew; ora legge il valore aggiornato (come «+1 a due caratteristiche»).
- **`build_site.py` — `parse_note`**: divide il frontmatter solo sulle righe-delimitatore `---`
  (non sul `---` come sottostringa) — un `---` dentro un valore non corrompe più il corpo né può
  far sparire una nota dal sito giocatori.

### Rimosso
- Macro Jinja morta `confronto_assi()` (mai chiamata; il manuale incolla già il suo blocco `renderAxesCompare`).

### Aggiunto
- **Statblock «2024» (Fantasy Statblocks)** — pelle opt-in legata al layout 5.5: override delle
  variabili pubbliche di FS (maroon/pergamena/serif/filetti) applicato solo agli statblock col
  marcatore `gdr-sb-2024` (cls nel layout → `:has()`); il layout classico (`layout_5e`) resta col
  look di default di FS. **Griglia caratteristiche 3+3 ufficiale**: For/Des/Cos · Int/Sag/Car con
  Punteggio/Mod/TS in celle separate (TS integrati da `stats`+`saves` via callback → tabella
  markdown), vincolata al riquadro (`width:100% !important` + `table-layout:fixed` + wrapper-valore
  inline forzato a blocco). Rimossi dal layout 5.5 la tabella-colonne, il blocco `fage_stats`
  (residuo Fantasy AGE) e la riga «Tiri Salvezza» (ora nella griglia).
- **Generatore — nuove categorie**: `trappola/insidia` (innesco + effetto coi dadi + TS/CD +
  individuazione/disinnesco), `evento di viaggio` (overland/hexcrawl) e **`incontro casuale`** —
  che pesca una **creatura REALE dell'SRD** per banda di GS (`srd_creature_pool` → `incontro._srd`,
  come il tesoro) + numero (1d4/branco…) + attività/atteggiamento/twist. Data-driven (le prime due
  via `forme`; l'incontro ha funzione dedicata `generaIncontro` come `tesoro`).
- **Generatore world-aware**: ganci e dicerie ora citano le **fazioni/luoghi/PNG REALI del mondo
  attivo**, non più solo generici — i terminali `{fazione}`/`{luogo}`/`{nome}` pescano dalle note
  del mondo (helper `worldPool`, dal `mondo` della nota), con fallback alla generazione se il mondo
  è vuoto. Estende ai *contenuti* la contestualizzazione che il generatore aveva già sui *nomi*
  (via `stile_nomi`). Es.: «Corsari dell'Ombra sta per…», «…lo stesso volto ad Aster».
- **Libreria di tabelle casuali (Dice Roller)**: nota di riferimento `Tabelle casuali.md` con
  **lookup table NATIVE** del plugin (header `dice: 1dN`, righe a range, block-id `^id`) rollabili
  inline — `` `dice: [[Tabelle casuali#^id]]` `` → numero + esito, con UI/cronologia del Dice Roller.
  Sei tavole pronte: ninnoli, complicazioni di viaggio, voci di taverna, colpo di fato, e **incontri
  per terreno** (bosco, costa/mare). Copiabili ed estendibili con lo stesso formato.
- **Tabelle Dice Roller native — verificate a schermo + confine chiarito**: le lookup-table della
  libreria `[[Tabelle casuali]]` rendono e **scattano** (confermato in-app: `^ninnoli` 1d12 e
  `^viaggio` 1d10 ri-tirano a esiti diversi). L'opzione DR-native *dentro* l'entità `tabella` è stata
  **rimossa**: un block-id dentro il fence ````tabs non è indicizzato da Obsidian, quindi
  `dice: [[…#^id]]` resta codice grezzo (non risolve) anche col nome-nota giusto — lì non poteva
  funzionare. L'entità tiene il suo roller JS (Voci + bottone pesato + pannello, che funziona nei
  tab) e rimanda a `[[Tabelle casuali]]` per il roll nativo del plugin (a livello-radice, dove va).
- **Homebrew che alimenta l'automazione (`concede`)**: un **talento** homebrew può dichiarare nel
  frontmatter un blocco `concede:` — `caratteristica: {destrezza: 1}` (bonus al punteggio, cap 20),
  `abilita: [Furtività]` (competenze → `prof_<id>`), `armi`/`armature`/`strumenti` — e il motore lo
  **applica al PG** quando il talento è preso (al level-up), non più solo prosa. Helper condiviso
  `applyConcede` nel ponte homebrew (crea_pg/sali_pg, parity-enforced). Gli effetti non dichiarabili
  («hai vantaggio quando…») restano prosa.
- **Privilegi di classe homebrew per livello + `concede`**: una classe homebrew dichiara i privilegi
  per livello (frontmatter `privilegi:` con `{livello, nome, descrizione, concede}`, fuso col legacy
  `privilegi_l1`); **a creazione** (1º livello) e **a ogni level-up** il motore **mostra** la feature
  acquisita a quel livello e ne **applica il `concede`** (punteggi/competenze) — creazione e level-up
  coerenti. Prima i privilegi oltre il 1° erano solo prosa non applicata. Guida `privilegi`/`concede`
  nel template Classe; la nota-classe mostra una **tabella dei livelli** generata dai `privilegi`
  (competenza calcolata + effetti `concede` ⚙️). Demo: classe **Corsaro dell'Ombra** in Astaria.
- **Dadi tirabili negli incantesimi/oggetti/talenti SRD**: le espressioni-dado nella prosa
  (danno, cura, scaling — es. «3d8 danni psichici», «i danni aumentano di 1d8») diventano
  **cliccabili in-vault** via Dice Roller (avvolte in `` `dice: …` `` a build-time), come già
  negli statblock — potenza/automazione da VTT senza lasciare Obsidian. ~130 incantesimi + ~102
  oggetti. Gli statblock dei mostri restano gestiti da Fantasy Statblocks (non toccati).
- **La prosa-corpo raggiunge davvero il sito**: le sezioni `##` del wizard vivono dentro il
  blocco `tabs` (layout Obsidian), che `strip_body` scartava in blocco → sul sito dei giocatori
  non arrivava NIENTE (solo `player_safe`). Ora `wizard_body` marca la prosa con
  `%%prosa%%…%%/prosa%%` (commenti Obsidian invisibili) e il builder — `build_site.py` + gemello
  `genera_sito.js`, in parità — estrae **solo** quella, ovunque viva nel layout a tab; gli heading
  rimasti vuoti spariscono. *(Completa il «prosa→sezioni ##» del giro precedente, che lato-sito era inerte.)*
- **Demo *Astaria* con prosa vera sul sito**: il seed riempie le sezioni `##` (conflitto,
  obiettivi/metodi delle fazioni, atmosfera dei luoghi, carattere del PG) e i segreti gated.
- **🔎 Esplora il mondo** (`Indici/Esplora.base`, nei segnalibri): una vista **Bases** nativa su
  **tutto** il mondo — filtra, ordina, raggruppa **senza scrivere codice** dall'UI; prima il
  no-code c'era solo sui 6 indici-categoria.
- **Manuale separato dal benvenuto**: il `LEGGIMI` torna un benvenuto breve (da 287 a ~60 righe);
  il riferimento completo (setup plugin, mappe, statblock, sito…) vive in **`Manuale.md`** (nei segnalibri).
- **Pulsanti «Crea» sui cruscotti** che li nominavano ma non li offrivano: *Cronologia* → epoca;
  *Quest log* → missione/scena/indizio; *Geografia* → luogo/rotta; *Economia* → risorsa/rotta.
- **Prosa in sezioni `##` native**: i campi di prosa lunga (storia, obiettivo, descrizione…)
  non sono più textArea legate al frontmatter — diventano **sezioni `##` nel corpo nota**, con
  uno spunto pieghevole come hint; i segreti usano il callout `[!rivela|<tier>]`. Il sito legge
  la prosa dal corpo. Modello articolo + infobox (lo strutturato resta Meta Bind).
- **Dadi tirabili negli statblock**: regole `diceParsing` italiane nei layout (danno e «+N a
  colpire»→`1d20+N`); i layout vendorizzati ora si **aggiornano** sui vault esistenti, non solo
  sui nuovi. *(Serve il plugin Dice Roller attivo; Fantasy Statblocks rilegge i layout al riavvio.)*
- **Sincronizza pin → coordinate**: un'azione legge i segnaposto piazzati a mano sulla mappa
  (`<immagine>.markers.json`) e scrive le `coord` delle note linkate → la mappa diventa la fonte
  della geografia (distanze in linea d'aria e Dintorni si calcolano da sé).
- **Nota-guida «Inizia da qui»** nel mondo-esempio: una guida-lampo (solo-DM) che mostra il
  differenziatore in 3 sguardi (lore → Fronti che si auto-ordinano → tavolo) su entità reali di Astaria.
- **Campi più ricchi**: alcuni campi-testo vincolati diventano menu a tendina (ruolo ecologico,
  affidabilità d'indizio, pena/ambito d'editto, dottrina d'esercito) e «rituale» un sì/no.

### Migliorato
- **Generatore — liste molto più ampie**: le tabelle delle categorie-staple sono ~raddoppiate —
  **PNG** (ruolo 15→35, aspetto/tratto/manierismo/vuole/segreto), **gancio** (chi/cosa/cosa_capita/
  twist) e **diceria** (soggetto/fatto/fatto2) → molta più varietà, meno ripetizione. Stesso pattern
  estendibile alle altre categorie (taverna/dungeon/meteo/…).
- **Attacco da incantatore tirabile sulla scheda PG**: il pannello 🪄 *Incantesimi* mostrava
  «Attacco +X» come testo morto; ora è un tiro **Dice Roller cliccabile** (`1d20 + X`), come gli
  attacchi con arma e i tiri salvezza. La **CD** resta testo (è la soglia del TS del bersaglio).
- **Infobox editabile**: i campi-contenuto (clima, popolazione, genere…) si modificano
  direttamente nell'infobox; prima erano sola-lettura lì ed editabili solo in un form duplicato.
- **Relazioni dell'infobox come link nativi** (view type `[link]` di Meta Bind): cliccabili, e
  **vuote = vuote** — niente più «null» sulle relazioni non compilate.
- **Tab Mappa più chiaro**: da muro di 7 sezioni a 2 passi + nota **SVG vs PNG** (SVG = nitido a
  ogni zoom e crea i pin dai nomi; PNG = solo immagine, pin a mano) + import e pin in callout pieghevoli.
- **Segnalibri auto-pulenti**: `write_bookmarks` rimuove i bookmark morti (target inesistente) →
  niente più doppioni accumulati quando un indice si sposta.

### Corretto
- **Mondo-esempio sempre aggiornato nello zip**: `npm run dist` ora rigenera il demo da zero
  (`seed_example.js --force`) prima di confezionarlo; il seed resta idempotente quando lo lancia
  l'utente (`npm run seed-example` non tocca il suo mondo). Prima il seed saltava se Astaria
  esisteva → lo zip poteva spedire un demo stantio (le modifiche al seed non lo raggiungevano).
- **Tiro per colpire tirabile su TUTTI i layout statblock**: un layout Fantasy
  Statblocks privo della chiave `diceParsing` (es. «GDR — 5.5e (2024)», il default
  legacy) faceva ricadere FS sulle regole di **default in inglese** («+N to hit»),
  così in italiano («+N, portata») il **tiro per colpire** non era cliccabile (il
  danno «N (XdY)» sì, lo riconosce la regola default). Ora il build fa **backfill**
  delle regole `diceParsing` IT (danno + tiro per colpire) su ogni layout che ne è
  privo; un `diceParsing` esplicitamente vuoto resta una scelta dell'utente.
- **`sintonia` unificata**: gli oggetti SRD esponevano la chiave grezza `richiede_sintonia` mentre
  il modello (e la tabella del **Ponte**) usano `sintonia` → la colonna *Sintonia* era vuota per i
  256 oggetti SRD. Ora derivano `sintonia`.
- **Caveat del radar rimosso dal benvenuto**: il radar del *Carattere* **è reattivo** (si ridisegna
  live muovendo lo slider, confermato a schermo) — il `LEGGIMI` diceva il contrario, non più vero.
- **Esplora esclude le note-cartella vuote** (`categoria.isEmpty() == false`): solo le entità vere.
- **Etichette di stato disambiguate**: «Stato della missione» e «Stato cosmico» non
  collidono più con lo **Stato** (editoriale) nell'infobox — niente più due righe «Stato»
  sulla stessa nota. Campo-profilo `divinita_di_stato`→`divinita_stato` (coerente coi gemelli).
- **Callout di guida non più «incastrati»**: in 5 entità un callout di guida si fondeva nel
  precedente per una riga vuota mancante — ora rende come callout separato.

### Solidità
- **Test dell'estrazione-prosa** (Python + **parità** JS): marcatori `%%prosa%%`, heading vuoti
  droppati, tab non-prosa esclusi, callout-rivela svelati per tier; più un test della `sintonia` SRD. 445 test verdi.
- **Verifica a schermo in Obsidian** di tutte le modifiche del giro: radar reattivo, infobox
  editabile, Esplora no-code, tab mappa, relazioni-link — confermate renderizzate.
- **Guardia di copertura dei campi** (`validate_field_coverage` in `check()`): ogni campo
  che il wizard fa compilare deve comparire su almeno una superficie della nota
  (scheda/tavolo/relazioni/profilo) — un campo «settabile ma mai mostrato» è ora un errore
  di build, non un orfano silenzioso.

## [0.1.0] — 2026-06-08

Prima **release pubblica** (beta). Pipeline sorgenti `YAML/Jinja/JS` → `render.py` → vault
Obsidian + sito dei giocatori opzionale. Canali: **itch.io** (vault + sito) e **GitHub**.

### Aggiunto
- **Condivisione v2 — rivelazione progressiva** del sito dei giocatori: campo
  `rivelazione` (`pubblico` < `incontrato` < `segreto`), ortogonale a `visibilita`
  (il «mai»). Il build sceglie il livello — `npm run site -- --reveal <tier>` — e
  include una nota se il suo tier ≤ livello: il portale si svela per gradi.
- **Rivelazione per-sezione**: callout `> [!rivela|<tier>]` (player-facing, gated dal
  build) → una nota pubblica può celare una verità che emerge a un livello più alto.
- **Dashboard «Occhi del giocatore»**: anteprima in-vault di cosa vedono i giocatori
  per tier, senza dover generare il sito.
- **Auto-link incrociato delle schede SRD**: dove una scheda cita un'altra entità nella
  prosa (un incantesimo nomina una condizione, un mostro ne lancia un altro…), il nome
  diventa un `[[link]]` navigabile — condizioni declinate o/a/i/e, incantesimi, specie/
  classi/background/talenti, mostri, e **dentro gli statblock**. Conservativo (prima
  occorrenza, omonimi/self esclusi, termini comuni in stop-list): ~1270 link, zero falsi positivi.
- **Creazione PG più completa**: step opzionale «Mondo di appartenenza» (collega il PG al
  worldbuilding); tratti-scelta dell'Umano 2024 (*Versatile* = talento d'origine, *Skillful*
  = abilità, dedotti dal SRD); le **maestrie d'arma** scelte compaiono nel pannello Sistema.
- **Mondo-esempio *Astaria* vivo e giocabile**: ogni pin della mappa regionale porta a un
  luogo con lore; **mappa-città di Aster** (drill-down) con pin curato; **PG collegato**
  (Korbin Salmastro, RAW-completo) e **incontro** «Guardiani della Terza Porta» alla Ziggurat
  (budget 2024 + creature SRD). La demo copre entrambe le suite: worldbuilding e tavolo.
- **Pipeline asset del sito**: le immagini referenziate (mappe da `![[..]]`, ritratti
  da frontmatter) vengono copiate in `dist/GDR-site/media/` e rese come `<img>`.
- **`npm run dist`**: crea gli artefatti di release versionati in `dist/` — il vault
  Obsidian pronto all'uso (plugin inclusi) e il sito dei giocatori, zippati.
- **`THIRD-PARTY-LICENSES.md`** auto-generato (da `plugins.yaml`) e incluso nel vault:
  attribuzione di tutti i 18 plugin bundlati (autore/licenza/repo). Licenze verificate
  — tutte redistribuibili (12 MIT, 3 GPL-3.0, 3 AGPL-3.0), incluse come mera aggregazione.

### Corretto
- **Selettore immagini vuoto**: `imageSuggester()` senza `optionQuery` non interrogava
  nessuna cartella → il picker non mostrava NIENTE (sembrava «non trova le immagini / niente
  SVG»). Ora `optionQuery("")` lista ogni immagine del vault, **SVG inclusi**.
- **`placeholder` rompeva Meta Bind** (`MB_PARSINOM`): l'apostrofo dritto `'` (es. «l'URL»)
  spezzava il parser argomenti → testo con apostrofo tipografico `’`, e `validate` ora vieta
  gli apici dritti `'` `"`.
- **ASI/Dono epico del 19° mancante per TUTTE le 12 classi**: la regex che deriva i livelli
  di Aumento dei punteggi non intercettava il privilegio «Dono epico» → ora sì (extra di
  classe intatti: Ladro 10°, Guerriero 6/14).
- **Nomi-file luoghi/PG con spazi** come le fazioni (niente più underscore): link dei marker
  e suffisso di disambiguazione PG («Nome 2») allineati.
- **Parser toponimi mappe**: soglia di grouping `1.6→2.5` font → meno frammentazione delle
  label curve nelle piante-città. Competenza-strumento duplicata (classe+background) dedotta;
  campi-lista resi «a, b» nel sito (non col `repr` Python); schema marker dei pin allineato
  al plugin zoom-map.

### Worldbuilding
- 36+ categorie con classificazione `famiglia`+`tipo`, relazioni tipizzate con inversi
  auto-derivati, assi tematici 1-5 (radar/archetipi/coerenza), economia/risorse,
  geografia (coord/confini/distanza/viaggio), timeline causale, cronologia per-entità,
  alberi evolutivi, Fronti reattivi al grafo (econ/geo e cosmico) + cruscotto Stato del Mondo.

### Sistema D&D 5.5e (2024)
- PG SRD-completo 1→20 (level-up), statblock 5.5e (+5e), loop di sessione (Esaurimento,
  Dadi Vita, riposi, concentrazione), incantesimi/condizioni/maestrie, encounter budget
  2024 + alleati, ponte homebrew→motore (incl. classe/sottoclasse), scaffolder GS→statblock.

### Onboarding & condivisione
- Mondo-esempio *Astaria* (seme `seed-example`) + nota «Inizia da qui», on-ramp Home, LEGGIMI,
  sito dei giocatori statico spoiler-free.

### Solidità
- Suite di test (snapshot + e2e/headless JS + rules-engine), validazione del contratto
  YAML↔wizard, anti-drift byte-equal, merge `.obsidian` non distruttivo.
