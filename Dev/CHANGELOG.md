# Changelog

## Unreleased

### Aggiunto

- M6 Continuity Engine: azioni Meta Bind per applicare conseguenze e propagare entita con stato esplicito, backlink, aggiornamenti richiesti, pressione e prossima mossa opzionale.
- Viste runtime riusabili `renderContinuityQueue`, `renderPropagationTargets` e `renderContinuityGaps` in `z.engine/session_views.js`.
- TemplateFactory genera schede con tabs logici e callout funzionali che contengono Meta Bind, Dataview, DataviewJS, riferimenti Bases ed Excalidraw.
- Scenario demo completo [[Brumafonda Demo]] con mondo, campagna, cultura, fazione, culto, luogo, economia, mappa, dispensa, missione, sessione e conseguenza.
- [[Dev/Smoke Demo Finale]] come checklist manuale di smoke visuale, player-safe e raccolta evidenze screenshot/GIF.
- Gate statico M3 in `npm run check` per verificare presenza demo, recap pubblico, mappa/dispensa pubbliche, player-safe e controlli di [[Vista Giocatori]].
- `npm run check:smoke` come gate dedicato per la parte automatizzabile dello smoke demo finale.
- `npm run check:release` come gate dedicato per versione, changelog e verifica release pulita.
- `Demo Brumafonda.md` generata solo nella release utente come indice demo, senza includere `Dev/`.
- [[Dev/Matrice Plugin 1.0]] e `Dev/plugin_matrix.json` per mappare ogni plugin installato a funzione, guida, pagina operativa e smoke.
- Azioni Meta Bind generate per smistare e canonizzare bozze del Generatore di Contenuti Fantasy.
- [[z.bases/Fazioni.base]] per correggere rapidamente fazioni in movimento, pressione, relazioni, mondo e archivio.
- [[z.bases/Economia.base]] per lavorare in tabella su risorse, rotte, mercati e pressioni economiche.
- [[z.bases/Worldbuilding.base]] per modificare culture, religioni, societa e cosmologia senza toccare query Dataview.
- [[Dev/Roadmap/1.0.0]] ora include una fase dedicata a Tasks e Bases avanzate.
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

### Migliorato

- [[Dev/NEXT_PHASE_HANDOFF]] chiarisce che M6 e completato e che la prossima fase deve concentrarsi su schede plugin-native, non su nuove dashboard.
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

### Verificato

- `npm run check` rieseguito dopo M6 Continuity Engine e rigenerazione TemplateFactory.
- `npm run check`
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
- [[Dev/Roadmap/1.0.0]] come roadmap completa e fonte unica per direzione prodotto, UX operativa e backlog attivo.

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
- [[Dev/Roadmap/0.8.0|Roadmap 0.8.0]] per completamento prodotto prima della release ZIP iniziale.
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
- [[Dev/Roadmap/0.7.0|Roadmap 0.7.0]] registra le decisioni di esperienza utente confermate.

## 0.6.0 - 2026-05-20

### Aggiunto

- [[Campagna da Ambientazione]] per trasformare regioni, culture e conflitti in campagne e archi narrativi.
- Generatore guidato "Campagna Da Regione".
- Generatore guidato "Arco Da Conflitto".
- [[Risorse/Opportunità Di Avventura]] per trovare elementi dell'ambientazione pronti a diventare missioni.
- [[Risorse/Fronti Di Campagna]] per pressioni, prossime mosse e scadenze.
- [[Risorse/Generare Campagna Da Ambientazione]] come guida non tecnica.
- [[Dev/Roadmap/0.7.0|Roadmap 0.7.0]] con proposta e domande sul comportamento atteso del vault.

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
- [[Dev/Roadmap/0.5.0|Roadmap 0.5.0]] completata e [[Dev/Roadmap/0.6.0|Roadmap 0.6.0]] preparata.

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
- [[Dev/Roadmap/0.4.0|Roadmap 0.4.0]] completata come tracciamento della versione.

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
- [[Dev/Roadmap/0.2.0|Roadmap 0.2.0]] per tracciare lo stato della roadmap Runtime + Lore Engine.
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
