# Changelog

## Unreleased

### Aggiunto

- Percorso utente nuovo blindato da `check:user-path`: 17 superfici primarie e avanzate verificano workflow user-facing, deck semplice e pulsanti Meta Bind configurati.
- `check:release-quality` valida shape delle azioni Meta Bind, cartelle di creazione, comandi plugin reali e wrapper Templater richiamabili.
- `check:release-quality` blocca API DataviewJS fragili nei blocchi Markdown utente; la diagnostica plugin deve passare dal runtime `z.engine`.
- TemplateFactory genera anche il template Avventura, con wrapper Templater dedicato e profilo YAML gia esistente.
- `metabind_config.yaml` diventa fonte YAML completa per `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`, verificata da `check:metabind-config`.
- `generated_artifacts.yaml` dichiara MD/JSON generati da YAML/Jinja; `check:generation-contract` verifica preview, `z.modelli` e manifest.
- Le preview `Dev/TemplateFactory/examples/generated` non sono piu tracciate: restano output locale ignorato, mentre `z.modelli` e manifest sono verificati come artefatti finali.
- Workflow dichiarativi per dashboard DM, preparazione, live, post-sessione, fuori scena, worldbuilding, atlante, canone, compendium, Bibbia del mondo, economia, lore, motore mondo vivo e iniziativa.
- `npm run release:demo` genera una release pulita con demo utente inclusa nello ZIP.
- `generate_demo_world.js` crea `Demo Regno Di Prova.md` e uno scenario minimo con mondo, campagna, luogo, fazione, missione, sessione attiva, clock, incontro, creatura, oggetto, dispensa e conseguenza propagabile.
- `check:docs` verifica coerenza tra README, checklist release e contratto demo.
- M6 Continuity Engine: azioni Meta Bind per applicare conseguenze e propagare entita con stato esplicito, backlink, aggiornamenti richiesti, pressione e prossima mossa opzionale.
- Viste runtime riusabili `renderContinuityQueue`, `renderPropagationTargets` e `renderContinuityGaps` in `z.engine/session_views.js`.
- TemplateFactory genera schede con tabs logici e callout funzionali che contengono Meta Bind, Dataview, DataviewJS, riferimenti Bases ed Excalidraw.
- Scenario demo storico rimosso dal sorgente: la demo finale verrà generata da script quando template e runtime saranno stabili.
- [[Dev/Smoke Demo Finale]] come checklist manuale di collaudo visuale, sicurezza per i giocatori e raccolta evidenze screenshot/GIF.
- Gate statico M3 in `npm run check` per verificare presenza demo, recap pubblico, mappa/dispensa pubbliche, player-safe e controlli di [[Vista Giocatori]].
- `npm run check:smoke` come gate dedicato per la parte automatizzabile dello smoke demo finale.
- `npm run check:release` come gate dedicato per versione, changelog e verifica release pulita.
- La release non include più una demo manuale mantenuta nota per nota.
- `Dev/plugin_matrix.json` per mappare ogni plugin installato a funzione, guida, pagina operativa e smoke.
- Azioni Meta Bind generate per smistare e canonizzare bozze del Generatore di Contenuti Fantasy.
- [[z.bases/Fazioni.base]] per correggere rapidamente fazioni in movimento, pressione, relazioni, mondo e archivio.
- [[z.bases/Economia.base]] per lavorare in tabella su risorse, rotte, mercati e pressioni economiche.
- [[z.bases/Worldbuilding.base]] per modificare culture, religioni, societa e cosmologia senza toccare query Dataview.
- Roadmap 1.0.0 storica: aggiunta una fase dedicata a Tasks e Bases avanzate.
- [[Dev/Roadmap/1.0 Professionale]] come nuova roadmap attiva a Punto 0 per la vera 1.0.
- [[Dev/Confine Release Repository]] per chiarire cosa entra nella ZIP utente e cosa resta nel repository.
- [[Dev/Smoke 1.0 Professionale]] come checklist visuale completa dei flussi pre-release.
- [[Dev/Integrazioni Plugin]] ora classifica tutti i plugin/strumenti installati per la 1.0 professionale.
- Cartella `Dev/` per concentrare roadmap, changelog, audit, release notes, smoke, sviluppo e documentazione tecnica.
- `Dev/TemplateFactory/` con moduli YAML iniziali per generazione futura di template Jinja2 integrati con Templater e plugin.
- [[Dev/Plugin Technical Reference]] con riferimenti tecnici a funzioni, sintassi e configurazioni dei plugin installati.
- `import_watabou_city.js` e `import_watabou_dungeon.js` per importare JSON Watabou City/One Page Dungeon come bozze operative.
- `check:importers` con fixture dry-run per Azgaar e Watabou.
- `render:metadata` e `check:metadata` per generare e verificare anteprime fileClass/Bases da `frontmatter_profiles.yaml`.
- Disciplina zero-warning: `check_vault.js` ora tratta ogni warning come blocker di `npm run check`.
- Gate release-content: le note contenuto in `Mondi/` e `Campagne/` devono avere scheda plugin-native con tabs, callout, controlli dinamici e fallback Markdown.
- Gate pagine utente chiave: setup, aiuto, prima sessione, materiali al tavolo, import mappe e guida mappe devono restare plugin-native.
- Filtro navigazione release: cartelle tecniche `z.*` e compendio `SRD/` restano inclusi ma nascosti dal file explorer utente.
- M9 Riduzione Attrito: [[Inizia Qui]] espone un percorso minimo prima delle dashboard avanzate.
- Gate anti-segreti globale: ogni nota `pubblico: true` con campi DM evidenti blocca `npm run check`.
- Evidenze M9 raccolte su release rigenerata: `Dev/Evidenze Smoke M9/release-attiva/`.
- Proprietà collassate di default su dashboard e indici, con espansione su hover/focus per editing e screenshot più leggibili.
- Contratto architetturale consolidato in [[Dev/README]]: Markdown contenuto umano, YAML stato persistente, Dataview query layer, Meta Bind interfaccia, Templater generazione, `z.engine`/`z.automazioni` runtime.
- `workflows.yaml` ora documenta regole dichiarative di continuità con trigger, condizioni, effetti e propagazioni, eseguite dal runtime esistente.
- `prepara-recap-pubblico` non marca più pubblica l'intera nota sessione; il gate impedisce regressioni su questa azione.
- brief M11 consolidato poi rimosso ora e un brief operativo M11 con tre interventi concreti: entita vive end-to-end, pipeline homebrew D&D 5.5 collegata al mondo e simulazione narrativa leggera.
- handoff M11 consolidato poi rimosso punta a M11 invece di restare su M9, con priorita tecniche e vincoli coerenti con il sistema operativo narrativo in Obsidian.
- M11 avviata con runtime reale: `registra_scelta_mondo` registra scelta, conseguenza, bersagli, propagazione, pressione e avanzamento tracciati sui target collegati.
- `renderM11ContinuityChain` espone nelle viste operative la catena scelta -> conseguenza -> bersagli -> stato -> prossima apertura.
- `check_m11_fixture.js` valida la catena end-to-end M11 su fixture generata: sessione, conseguenza, propagazione, clock, D&D 5.5 e viste operative.
- `session_continuity.js` separa il runtime di continuita, propagazione e catena M11 dal bridge `session_views.js`.
- `session_runtime.js` separa viste sessione, live table e post-sessione; `session_views.js` resta bridge compatibile.
- `check_runtime_load.js` carica il runtime DataviewJS con adapter Obsidian simulato e verifica gli export principali.
- `player_safety.js` separa il gate anti-segreti/player-facing da `check_vault.js`.
- [[docs/FANTASYWORLD_INTEGRATION]] documenta cosa promuovere dal laboratorio FantasyWorld: SRD PG, test dati, macro Jinja, assi tematici, cosmologia e regole plugin.
- `import:map` come dispatch unico per Azgaar, Watabou City e Watabou Dungeon.
- `check:release-artifact` genera una release temporanea, verifica cartella/ZIP e ripulisce `dist/`.
- GitHub Actions esegue `npm run check` su push e pull request.
- Rimossa la demo manuale dal sorgente: i contenuti dimostrativi devono nascere da generatore dedicato a fine ciclo.
- Gate esperienza hub: `check_vault.js` verifica ruolo, classe visuale, callout, viste/input/azioni plugin-native e marker funzionali degli hub principali.
- Gate Plugin Surface YAML: TemplateFactory blocca input Meta Bind, bottoni, callout, runtime DataviewJS e Bases usati nei Jinja se non sono dichiarati nei moduli YAML.
- brief M11 consolidato poi rimosso prepara la prossima fase su profondita delle entita fantasy governata da YAML.
- `entity_depth.yaml` introduce contratti YAML per profondita fantasy di luogo, fazione, missione e tracciato: campi, prompt runtime, sezioni, tabs e superfici plugin obbligatorie.
- `taxonomy_depth.yaml` introduce contratti verificati per D&D 5.5 e worldbuilding: opzioni giocatore, magia/regole, encounter tools, societa/economia, religione/cosmologia e storia/geografia/ecologia.
- `dnd55_options.yaml` introduce valori D&D 5.5 localizzati in italiano per livelli incantesimo, scuole, tempi, componenti, classi, specie, tipi creatura, taglie, rarita, condizioni, CD, danni e proprieta equipaggiamento.
- `link_targets.yaml` e `tag_rules.yaml` introducono contratti per wikilink granulari nel frontmatter e tag italiani controllati.

### Migliorato

- Le pagine utente principali usano `mode: "simple"` e non espongono diagnostica plugin nel percorso normale.
- La documentazione utente distingue setup normale, recupero strumenti e sviluppo tecnico.
- La demo finale resta artefatto generato in `dist/`, non contenuto sorgente da mantenere nota per nota.
- handoff M11 consolidato poi rimosso chiarisce che M6 e completato e che la prossima fase deve concentrarsi su schede plugin-native, non su nuove dashboard.
- handoff M11 consolidato poi rimosso aggiornato dopo M7 e chiusura warning: la prossima fase e M8 Release Evidence And Zero-Warning Discipline.
- Le note demo manuali storiche sono state eliminate dal sorgente per evitare manutenzione nota per nota.
- Le guide utente più esposte sono state portate a tab funzionali con controlli, azioni, Dataview/DataviewJS, Tasks e fallback leggibile.
- `release:clean` verifica che la release mantenga nascosti runtime, template, fileClass, Bases, bacheche tecniche e SRD dalla navigazione normale.
- [[Motore Mondo Vivo]] e [[Cosa Succede Fuori Scena]] mostrano coda di continuita, bersagli da verificare e buchi di propagazione senza duplicare dashboard.
- [[Risorse/Post Sessione Guidato]] e [[Durante il Gioco]] collegano scelta, conseguenza, bersagli, prossima mossa e recap.
- TemplateFactory ora valida simmetria tra profili runtime e frontmatter, campi core/plugin/dominio e copertura minima di fileClass/Bases.
- I generatori principali usano profili YAML per prompt e frontmatter, lasciando al JS solo raccolta input, calcolo valori e collegamenti note.
- Gli importer cartografici usano una base comune per parsing input, dry-run, frontmatter e scrittura note.
- [[Risorse/Importare Mappe]] ora guida Azgaar, Watabou City e Watabou One Page Dungeon.
- `frontmatter_profiles.yaml` ora e il centro leggibile anche per fileClass/Bases: le integrazioni dichiarano target e campi minimi, le anteprime metadata rendono il diff revisionabile.
- TemplateFactory ora copre i template generati, router, wizard e azioni operative materializzate in `z.modelli`.
- Calendarium e selezionabile per mondo/campagna con propagazione controllata verso `fc-calendar` nei template generati.
- [[Risorse/Smistamento Bozze Generate]] ora gestisce il ciclo bozza -> aggancio -> smistamento -> canonizzazione.
- [[Mondi/Calendario]] mostra calendari selezionati per mondo/campagna e segnala valori non configurati.
- `npm run release:clean` e stato verificato su artefatto reale: `dist/vault-gdr-clean` e `dist/vault-gdr-clean.zip`.
- Normalizzato il formato dei file `.base` esistenti e aggiunto un controllo che segnala `properties:` incollato alla riga precedente.
- [[Risorse/Task DM]] raggruppa le task operative per scadenza e ordina per urgenza/priorita.
- Le bacheche operative usano priorita Tasks solo su lavoro reale del DM e [[z.bacheche/Manutenzione Vault]] contiene ricorrenze mensili di manutenzione.
- Le basi Missioni, Fazioni, Worldbuilding ed Economia espongono formule leggere di stato operativo o prontezza.
- Le viste Bases prioritarie usano `groupBy` e `limit`, mentre gli archivi restano completi.
- Rimossi gli artefatti di release generati da `dist/` dal workspace locale.
- Spostato il materiale di sviluppo fuori da `Risorse/` e dalla root, aggiornando controlli e riferimenti.
- La demo finale sarà un artefatto generato, non contenuto sorgente stabile.
- `bases_views.yaml`, `callouts.yaml`, `dataview_blocks.yaml`, `metabind_buttons.yaml` e `frontmatter_profiles.yaml` ora coprono le superfici plugin-native usate dai template generati.
- I generatori `luogo`, `fazione`, `missione` e `tracciato` raccolgono profondita narrativa da prompt YAML e la scrivono nel frontmatter senza logica strutturale hardcoded.
- Aggiunti profili YAML minimi per incantesimi, classi, specie, background, talenti, regole, trappole, pericoli ambientali e tesori, così lo SRD puo diventare contenuto collegabile al mondo e non solo compendio statico.
- I profili runtime D&D 5.5 puntano a sorgenti opzioni italiane, mantenendo chiavi tecniche solo quando servono compatibilita con plugin e renderer.
- `npm run check` ora segnala tag non dichiarati e link granulari malformati nei campi `fonti`, `riferimenti_srd`, `riferimenti_regola`, `sezioni_collegate`, `blocchi_collegati` e `tabelle_collegate`.
- [[Dev/Roadmap/1.0 Professionale]] non mantiene piu aperto il blocker Templater runtime dopo il check zero-warning e punta esplicitamente a M8.
- `check:release` ora blocca anche una roadmap attiva obsoleta rispetto a handoff M8, evidenze release e disciplina zero-warning.
- Gli input Meta Bind con funzioni (`optionQuery`, `useLinks`, `allowOther`, suggester) ora usano blocchi `meta-bind` invece di codice inline.
- `check_vault.js` blocca gli input Meta Bind complessi lasciati in forma inline.
- Lo snippet `gdr-vault.css` riduce fusioni trasparenti, gradienti sovrapposti e accenti troppo saturi per una resa più pulita con temi chiari e scuri.
- Le guide utente principali usano termini italiani più chiari per vista giocatori, controllo qualità, versioni leggibili senza plugin e collaudo visuale.

### Corretto

- I pulsanti Meta Bind del Generatore di Contenuti Fantasy richiamano il comando reale `fantasy-content-generator:open-fantasy-generator`.
- `Inizia Qui` e `Setup Guidato` non leggono più direttamente `app.plugins` dai blocchi DataviewJS, ma usano `renderVaultReadiness`.
- Il router DM non punta più a un template Avventura mancante; il gate release-quality blocca riferimenti `z.modelli/...` inesistenti negli script Templater.

### Verificato

- `npm run check:user-path`
- `npm run check:docs`
- `npm run release:demo`
- `npm run check` rieseguito dopo M6 Continuity Engine e rigenerazione TemplateFactory.
- `npm run check`
- `npm run check:m11`
- `npm run check:release-artifact`
- `npm run check:smoke`
- `npm run check:release`
- `npm run check:importers`
- `npm run check:metadata`
- `npm run release:clean`
- Gate statico M3 demo/player-safe rieseguito il 2026-05-21.
- `dist/vault-gdr-clean.zip` creato localmente come artefatto ignorato da Git.

## 1.0.0 - 2026-05-20

### Aggiunto

- Wizard [[z.modelli/wizard/Nuovo Mondo Homebrew]] con preset creativi, promessa, tono, magia, scala, conflitto, vincoli, temi da evitare e spina dorsale iniziale.
- Registro tassonomico profondo in `z.automazioni/world_taxonomy.js` per geografia, societa, cultura, religione, magia, economia, ecologia e storia.
- Router creativi per societa, cultura, religione, economia, magia, storia ed ecologia, più template generico [[z.modelli/worldbuilding/Entita Worldbuilding]].

### Migliorato

- [[Inizia Qui]], [[Worldbuilder Dashboard]], [[Bibbia del Mondo]] e [[Risorse/Guida DM]] ora partono da Crea Il Mondo e trattano sessioni e campagne come derivati del Codex.
- `npm run check` controlla il layer 1.0.0, il nuovo wizard mondo, i file tassonomici e l'ordine worldbuilding-first di [[Inizia Qui]].
- `release:clean` include anche `z.engine`, cosi le viste JS usate dal vault restano nella release utente.

### Verificato

- `npm run check`
- `git diff --check`
- `npm run release:clean`
- `unzip -tq dist/vault-gdr-clean.zip`

### Aggiunto

- [[Hub/Party Control]] per PG, HP, missioni, inventario e flags durante la sessione.
- [[Risorse/Quality Report]] come dashboard analytics per copertura, buchi operativi, sicurezza pubblicazione e materiale screenshot-ready.
- Roadmap 1.0.0 storica usata come fonte unica per direzione prodotto, UX operativa e backlog attivo.

### Migliorato

- Correzione strutturale Obsidian-native: i wizard Templater di luogo, fazione, missione e PNG cercano connessioni vive tra note esistenti e i template core espongono sezioni Meta Bind modificabili dal corpo nota per gancio, uso al tavolo, player-safe, pressione, prossima mossa e connessioni.
- Eliminato `docs/UX_OPERATIVA.md`: le regole UX sono state incorporate nella roadmap attiva e `Risorse/Sviluppo Vault` resta solo documentazione tecnica.
- Chiuso il flusso sessione: la nota sessione genera una scaletta giocabile dai cinque campi, le viste operative mostrano la sessione attiva e [[Durante il Gioco]] apre come cockpit con Fine sessione visibile.
- [[Risorse/Post Sessione Guidato]] ora e un flusso unico con appunti live della sessione, canone da confermare, conseguenze, prossime mosse, prossima sessione e recap pubblico/DM separati.
- [[Bibbia del Mondo]] e il template mondo sono stati rafforzati come Codex locale: home mondo, indice per categoria/pubblico e controlli su articoli senza gancio, collegamenti o uso al tavolo.
- Gli articoli core di luogo, fazione, PNG, cultura, religione e timeline separano meglio contenuto player-safe e note DM.
- [[Vista Giocatori]] e stata ripulita come portale player-facing con recap ordinati, mappa pubblica centrale, card per mondo conosciuto e controllo anti-segreti.
- [[Hub/Party Control]] ora concentra HP, condizioni, risorse rapide, inventario, loot non assegnato, quest personali, legami e spotlight.
- Polish UX mirato per pagine operative: primo schermo piu leggibile, pulsanti compatti, card/empty state piu chiari e strumenti secondari meno rumorosi.
- [[Vista Giocatori]] ora funziona come portale player-facing con recap, diario visibile, atlante condiviso, handout e controllo anti-segreti.
- [[Inizia Qui]] e stato ridotto al flusso principale Prepara -> Gioca -> Aggiorna il mondo, con strumenti avanzati separati.
- [[Risorse/Preparazione Sessione]] ora richiede cinque blocchi concreti: obiettivo, prima scena, scelta, pressione e materiale.
- Il template [[z.modelli/dm/Sessione]] ora apre subito con i cinque campi compilabili e un controllo che dice cosa manca senza rimandare ad altre note.
- Il template [[z.modelli/Mondo]] ora apre con un Codex in 6 campi e [[Bibbia del Mondo]] diventa un Codex consultabile tipo World Anvil locale.
- [[Atlante del Mondo]] include una tab mappa con mappe pubbliche/DM, luoghi con coordinate/layer e rotte.
- README e checklist release evidenziano player portal, party control, quality report, screenshot e GIF.
- `release:clean` genera un `LEGGIMI.md` utente piu completo e la documentazione include una pagina release pubblica pronta.
- Roadmap, strategia prodotto e sviluppo vault ora mettono la riduzione della navigazione sopra nuove feature.
- README, Repository, Release e Risorse/Release Pulita non linkano piu documenti superflui.

## 0.9.0 - 2026-05-20

### Aggiunto

- [[Motore Mondo Vivo]] come dashboard per propagazione eventi, dinamiche di fazione, relationship graph, causalita storica e continuita narrativa.
- [[Geopolitical Dashboard]] per territori politici, confini, vassalli, risorse strategiche, relazioni diplomatiche e buchi geopolitici.
- [[Bibbia del Mondo]], [[Revisione Lore]] e [[Controllo Canone]] per mantenere coerenza narrativa, fonte, canone e retcon.
- Nuova area [[Mondi/Relazioni/Relazioni]] con template [[z.modelli/worldbuilding/Relazione]] e automazione `relazione`.
- Template e automazioni per lore persistence, event propagation, stato del mondo e causalita storica.
- [[Risorse/Guida Lore Professionale]] e [[Risorse/Checklist Lore Professionale]].

### Migliorato

- [[Worldbuilder Dashboard]], [[Atlante del Mondo]], [[Mondi/Stato del Mondo]], [[Risorse/Preparazione Sessione]] e [[Risorse/Post Sessione Guidato]] ora leggono anche propagazione, relazioni e geopolitica.
- I template politici sono operativi: regni, imperi, repubbliche, oligarchie, ducati, contee, baronie e regioni tracciano confini, legittimita, risorse e crisi.
- Cultura e religione producono scelte, tabu, autorita, rituali, eresie, luoghi sacri e propagazione.
- Il controllo vault segnala geopolitica debole, relazioni senza conseguenze, religioni senza luoghi sacri, culture senza tensioni, eventi senza causa e lore non propagata.

## 0.8.0 - 2026-05-20

### Aggiunto

- `CONTRIBUTING.md` e issue template GitHub per bug e feature request.
- [[Risorse/Importare Mappe]] e import GeoJSON Azgaar verso bozze di luoghi.
- Roadmap 0.8.0 storica per completamento prodotto prima della release ZIP iniziale.
- Tabelle Dice Roller per viaggio, scoperte esagono, reazioni fazione e conseguenze post-sessione.

### Migliorato

- README riposizionato come pagina prodotto e non solo guida interna al vault.
- Checklist release aggiornata per ZIP pulito e documentazione community.
- TTRPG Tools: Maps e Hex Cartographer sono guidati ma non bloccano il percorso base.
- BRAT resta attivo come strumento essenziale di manutenzione per plugin non ufficiali; Iron Vault ed Emoji Toolbar restano fuori dal flusso base.
- Aggiunta nota di studio su Iron Vault per replicare nel vault funzioni utili senza imporre il plugin.
- `npm run release:clean` ora genera l'unico ZIP di release, destinato agli utenti e senza materiali di sviluppo repository.

## 0.7.0 - 2026-05-20

### Aggiunto

- [[Vista Giocatori]] per materiale condivisibile: recap, obiettivi, PNG, luoghi e dispense note.
- [[Giocatori/Giocatori]] come indice dell'area giocatori.
- [[Dev/Release Pulita]] per preparare una copia consegnabile del vault.
- Script `npm run release:clean` per creare `dist/vault-gdr-clean` e, se disponibile, `dist/vault-gdr-clean.zip`.

### Migliorato

- [[Inizia Qui]] resta la pagina introduttiva all'apertura e mostra una prossima azione senza creare contenuti automaticamente.
- Roadmap 0.7.0 storica registra le decisioni di esperienza utente confermate.

## 0.6.0 - 2026-05-20

### Aggiunto

- [[Campagna da Ambientazione]] per trasformare regioni, culture e conflitti in campagne e archi narrativi.
- Generatore guidato "Campagna Da Regione".
- Generatore guidato "Arco Da Conflitto".
- [[Risorse/Opportunità Di Avventura]] per trovare elementi dell'ambientazione pronti a diventare missioni.
- [[Risorse/Fronti Di Campagna]] per pressioni, prossime mosse e scadenze.
- [[Risorse/Generare Campagna Da Ambientazione]] come guida non tecnica.
- Roadmap 0.7.0 storica con proposta e domande sul comportamento atteso del vault.

### Migliorato

- [[1. DM Dashboard]], [[Inizia Qui]], [[Risorse/Risorse]] e README collegano il nuovo percorso da ambientazione a gioco.
- Le campagne generate da regione includono profilo, culture, fazioni, conflitti e domande di campagna.
- Gli archi da conflitto collegano conflitti, campagne, luoghi, fazioni, ricompense e fronti.

## 0.5.0 - 2026-05-20

### Aggiunto

- [[Atlante del Mondo]] per worldbuilding tassonomico e ambientazioni grandi.
- Nuove aree per [[Mondi/Culture/Culture]], [[Mondi/Lingue/Lingue]], [[Mondi/Storia/Storia]], [[Mondi/Conflitti/Conflitti]] e [[Mondi/Cosmologia/Cosmologia]].
- Modelli guidati per cultura, lingua, era storica, conflitto e cosmologia.
- [[Risorse/Worldbuilding Tassonomico]] come guida non tecnica alla costruzione di mondi ricchi.
- Roadmap 0.5.0 storica completata e roadmap 0.6.0 storica preparata.

### Migliorato

- [[Worldbuilder Dashboard]] collega l'Atlante e mostra conteggi per culture, lingue, conflitti e cosmologia.
- [[Inizia Qui]] porta il worldbuilding avanzato su [[Atlante del Mondo]].
- Controllo qualità aggiornato per le nuove categorie di ambientazione.

## 0.4.0 - 2026-05-20

### Aggiunto

- [[Risorse/Setup Guidato]] per verificare lo stato del vault senza leggere impostazioni interne.
- [[Risorse/Post Sessione Guidato]] per chiudere la partita con passaggi leggibili.
- [[Risorse/Consegna Nuovo DM]] per consegnare il vault senza spiegazioni tecniche.
- [[Risorse/Profili Campagna]] per fantasy classico, investigativo, sandbox e one-shot.
- [[Risorse/Materiali Al Tavolo]] per controllare dispense, mappe, media, incontri e creature della sessione attiva.
- [[Risorse/Preset Calendario]] per usare date del mondo senza spiegare configurazioni interne.
- Roadmap 0.4.0 storica completata come tracciamento della versione.

### Migliorato

- [[Mondi/Calendario]] ora parte da oggi nel mondo, prossime sessioni, missioni con pressione e date da sistemare.
- [[Inizia Qui]] e [[Risorse/Risorse]] collegano il percorso di consegna, preparazione, gioco e post-sessione.

## 0.3.0 - 2026-05-20

### Aggiunto

- Template live dedicati per evento, conseguenza, PNG improvvisato, luogo improvvisato e nota grezza.
- Automazioni live che provano a collegare automaticamente mondo e sessione attiva.
- Checklist post-sessione guidata per chiudere sessione, canonizzare lore e preparare la prossima apertura.
- Validazione frontmatter per categorie, stati e campi operativi minimi.

### Migliorato

- [[1. DM Dashboard]] e [[Worldbuilder Dashboard]] usano gli helper condivisi del Session Context.
- [[Durante il Gioco]] e [[Inbox/Inbox]] creano note live piu specifiche invece di usare sempre template generici.
- `z.automazioni/check_vault.js` distingue meglio warning utili da rumore su note indice o risorse.

## 0.2.0 - 2026-05-19

### Aggiunto

- [[Durante il Gioco]] come runtime DM con sessione attiva esplicita, contesto mondo, lore collegata e quick create.
- [[z.modelli/Lore Capture]] per catturare eventi, dialoghi, luoghi, PNG improvvisati e conseguenze dalla sessione.
- [[Mondi/Timeline/Timeline]] e [[z.modelli/Evento Storico]] per storicizzare eventi canonici, rumor, leggende, segreti e fatti dimenticati.
- [[Mondi/Stato del Mondo]] per vedere conseguenze da applicare, PNG cambiati, luoghi in crisi, fazioni in movimento e missioni influenzate.
- Roadmap 0.2.0 storica per tracciare lo stato della roadmap Runtime + Lore Engine.
- Import SRD esteso a Background, Equipaggiamento, Talenti, Lingue e Specie dalla fonte JSON aggiornata.
- Filtri opzionali per mondo e campagna su [[Worldbuilder Dashboard]] e [[Mondi/Stato del Mondo]].

### Migliorato

- Template sessione con campo `attiva`, stato `in corso` e missioni vive.
- Template e automazioni per PNG, luoghi e fazioni con stati utili allo stato dinamico del mondo.
- [[Worldbuilder Dashboard]], [[Mondi/Mondo]] e [[Inbox/Inbox]] con viste per timeline, lore da canonizzare e stato canonico.
- [[Durante il Gioco]] piu compatta nella vista tavolo.

### Corretto

- Import SRD ora gestisce anche `sezioni[].descrizione`, presente nelle nuove tipologie JSON.

## 0.1.0 - 2026-05-19

### Aggiunto

- Nota [[Inizia Qui]] come onboarding non tecnico.
- [[Risorse/FAQ]] per supporto non tecnico.
- Smoke test tecnico `node z.automazioni/check_vault.js`.
- Documentazione di release in [[Dev/RELEASE]].
- File [[VERSION]] con versione corrente del vault.

### Migliorato

- [[Durante il Gioco]] come schermata da tavolo con quadro di regia, missioni della sessione e comandi rapidi.
- Configurazione Templater, Meta Bind e Metadata Menu per separare meglio aree operative, tecniche e generate.
- Snippet `gdr-vault.css`: wrapping, focus visibile, tabelle larghe, griglie responsive e movimento ridotto.
- Documentazione utente per primo avvio, plugin, aiuto e aspetto del vault.

### Corretto

- Icon Folder aggiornato sui percorsi `Mondi/...`.
- Workspace e Homepage puntano all'ingresso corretto del vault.
