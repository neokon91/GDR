---
cssclasses:
  - indice
---

# Integrazioni Plugin

Questa pagina decide quali plugin integrare per primi nel vault. Non e una lista di installazione: e una coda di lavoro per trasformare plugin gia scelti in funzioni utili al DM.

Per il contratto verificato della 1.0, vedi `Dev/TemplateFactory/modules/plugin_matrix.yaml` e `Dev/TemplateFactory/modules/plugin_contracts.yaml`; `Dev/plugin_matrix.json` e solo output locale generato da `npm run sync:sources`. `npm run check` fallisce se un plugin abilitato non ha funzione, guida, pagina operativa, smoke e contratto release.

## Fonti Ufficiali Consultate

- [Calendarium](https://plugins.javalent.com/calendarium) e [eventi Calendarium](https://plugins.javalent.com/calendarium/events)
- [Initiative Tracker](https://plugins.javalent.com/it) e [inline encounters](https://plugins.javalent.com/it/encounters/inline)
- [Fantasy Statblocks](https://plugins.javalent.com/statblocks)
- [Dice Roller](https://plugins.javalent.com/dice) e [table rollers](https://plugins.javalent.com/dice/rollers/table)
- [Obsidian Excalidraw Plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin)
- [Obsidian Canvas](https://obsidian.md/help/plugins/canvas)
- Advanced Canvas 6.1.6 e Linter 1.31.2 verificati dai manifest locali del vault.
- [Media Extended](https://github.com/aidenlx/media-extended)
- [Meta Bind](https://www.moritzjung.dev/obsidian-meta-bind-plugin-docs/), [JS Engine](https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/) e [Metadata Menu](https://mdelobelle.github.io/metadatamenu/)
- [Folder Notes](https://lostpaul.github.io/obsidian-folder-notes/), [Kanban](https://publish.obsidian.md/kanban/Obsidian+Kanban+Plugin), [Tabs](https://xhuajin.github.io/obsidian-tabs/) e [TTRPG Tools: Maps](https://ttrpg-tools-obsidian.org/)
- [Obsidian Bases](https://obsidian.md/help/bases), [Maps per Bases](https://community.obsidian.md/plugins/maps), [Tasks](https://community.obsidian.md/plugins/obsidian-tasks-plugin), [QuickAdd](https://community.obsidian.md/plugins/quickadd), [Commander](https://community.obsidian.md/plugins/cmdr) e [Leaflet](https://community.obsidian.md/plugins/obsidian-leaflet-plugin)

## Criterio

Integra un plugin solo quando aggiunge una cosa visibile in una dashboard, in una pagina di preparazione o durante il gioco.

Prima di lavorarci, controlla:

- quale azione del DM rende piu veloce;
- quale nota o dashboard deve mostrarlo;
- quali campi servono davvero;
- quale controllo automatico o smoke manuale verifica che funzioni;
- cosa succede se il plugin non e installato.

## Stato Reale

| Plugin | Stato | Dove si vede | Prossimo passo |
| --- | --- | --- | --- |
| Dataview | integrato | dashboard, indici, controllo vault | mantenere query semplici e senza filtri fittizi |
| Templater | integrato | pulsanti di creazione e `z.modelli` | non aumentare i template senza controllo automatico |
| Meta Bind | integrato | dashboard e template con campi interattivi | uniformare i campi piu usati |
| JS Engine | integrato indiretto | viste DataviewJS e Meta Bind avanzati | usarlo solo dove evita lavoro manuale |
| Metadata Menu | integrato | gestione campi | FileClass presenti per sessioni, missioni, tracciati, PNG, luoghi, fazioni, incontri, mappe, media, economia e compendium; mantenere allineati YAML, Bases e Meta Bind |
| Folder Notes | integrato | note indice di cartella | mantenere indici brevi e utili |
| Homepage | integrato | avvio su dashboard | nessun lavoro urgente |
| Kanban | integrato | `z.bacheche` | collegare meglio post-sessione a missioni e sessioni |
| Callout Manager | integrato | template e note operative | mantenere pochi callout riconoscibili |
| Fantasy Statblocks | integrato | creature e mostri SRD | verificare rendering visuale in Obsidian dopo import |
| Initiative Tracker | supportato | incontri pronti, [[Risorse/Iniziativa e Combattimenti]] | mantenere `encounter` solo sui combattimenti preparati |
| Dice Roller | supportato | template e tabelle rapide | mantenere tabelle brevi, richiamabili e stabili |
| Calendarium | integrato | sessioni, missioni, dashboard, controllo vault | usare `Calendario Del Mondo` come calendario neutro predefinito |
| Excalidraw | integrato | `Risorse/Mappe`, Worldbuilder Dashboard, Durante il Gioco, [[Risorse/Excalidraw Per GDR]] | usare per fronti, indizi e scene; nuove mappe in `Risorse/Mappe` con template dedicato |
| Workspaces | supportato | configurazione `.obsidian` | salvare layout DM, worldbuilding e manutenzione |
| Bookmarks | supportato | barra laterale Segnalibri | accesso rapido a pagine vive, non archivio parallelo |
| Media Extended | supportato leggero | indici audio/video, Durante il Gioco | usare timestamp e scene solo per materiali pronti |
| Hex Cartographer | opzionale guidato | Risorse/Mappe | usare per regioni, viaggi e hexcrawl quando le distanze contano |
| TTRPG Tools: Maps | opzionale guidato | Risorse/Mappe, Durante il Gioco | usare per mappe zoomabili con base locale e pin |
| Generatore di Contenuti Fantasy | integrato base | `Inbox/Generati`, comando plugin | usare le note generate come bozze, mai come canonico automatico |
| Iconize | minimo | orientamento visuale | secondario, non deve sostituire indici chiari |
| Tabs | parziale | template lunghi | applicare solo dove riduce scrolling reale |
| Advanced Tables | supporto | tabelle markdown | sfruttato indirettamente nelle tabelle casuali |
| Emoji Toolbar | non incluso | nessuna dipendenza | non integrare nel flusso base |
| Style Settings | supporto | tema/snippet | documentare solo se si stabilizza un tema del vault |
| Iron Vault | non incluso | nessuna pagina GDR D&D | tenere fuori dal bundle; usare solo come studio di design |
| BRAT | manutenzione essenziale | gestione plugin non ufficiali | tenere attivo ma fuori dal flusso utente finale |

## Classificazione 1.0 Professionale

Nessun plugin installato e candidato alla rimozione senza prova concreta. Ogni plugin deve essere core, supporto, opzionale guidato o manutenzione.

| Plugin installato | Classe 1.0 | Uso obbligatorio prima della release |
| --- | --- | --- |
| Dataview | core | Dashboard, controlli, indici decisionali. |
| Templater | core | Wizard e creazione guidata senza YAML manuale. |
| Meta Bind | core | Pulsanti, input e campi editabili nel corpo nota. |
| JS Engine | core tecnico | Helper riusabili per viste complesse. |
| Metadata Menu | core dati | FileClass e campi guidati per contenuti principali. |
| Folder Notes | core navigazione | Ogni cartella importante deve aprire un indice utile. |
| Homepage | core onboarding | Apertura non tecnica su [[Inizia Qui]]. |
| Callout Manager | core lettura | Callout stabili e riconoscibili per gioco e worldbuilding. |
| Fantasy Statblocks | core combattimento | Creature e mostri pronti per schede al tavolo. |
| Excalidraw | core mappe visuali | Fronti, territori, indizi, scene e mappe linkate. |
| Kanban | supporto DM | Bacheche operative, non archivio lore. |
| Tasks | supporto DM | Task operative con priorita, scadenze e manutenzione. |
| Bases core | supporto editing | Correzione tabellare di metadati stabili. |
| Maps per Bases | supporto mappe | Marker e viste mappa da campi `coordinates`, `icon`, `color`. |
| Initiative Tracker | supporto tavolo | Combattimenti preparati con creature linkate. |
| Dice Roller | supporto tavolo | Tabelle e tiri immediatamente giocabili. |
| Calendarium | supporto tempo | Calendari selezionabili per mondo/campagna. |
| Advanced Canvas | supporto reti vive | Reti navigabili di note, gruppi, archi e fronti. |
| Media Extended | supporto tavolo | Media pronti con timestamp e scene collegate. |
| Fantasy Content Generator | opzionale guidato | Bozze da smistare, mai canone automatico. |
| Iconize | supporto orientamento | Icone coerenti per navigazione, non sostituto degli indici. |
| Tabs | supporto UX | Riduzione scrolling solo in note lunghe. |
| Style Settings | supporto visuale | Opzioni visuali stabili e documentate. |
| Advanced Tables | supporto editing | Tabelle manuali e tabelle casuali leggibili. |
| TTRPG Tools: Maps | opzionale guidato mappe tavolo | Mappe zoomabili con pin linkati alle note, solo quando una mappa reale ne giustifica l'uso. |
| Hex Cartographer | opzionale guidato esplorazione | Hexcrawl collegato a territori, incontri e conseguenze, solo per campagne dove le distanze contano. |
| Linter | manutenzione | Pulizia manuale controllata, mai lint on save distruttivo. |
| BRAT | manutenzione | Gestione plugin beta/non ufficiali, invisibile al DM. |

## Riesame Valore Quotidiano

Questa sezione prevale sulla semplice domanda "il plugin e presente?". Un plugin produce valore 1.0 solo se riduce tempo, errori o spaesamento in un flusso reale.

| Area | Valore quotidiano atteso | Dove deve vedersi | Decisione |
| --- | --- | --- | --- |
| Mappe | Trovare territori, rotte, scene e pin senza leggere liste lunghe. | [[Risorse/Mappe/Mappe]], [[Risorse/Mappe Bases]], `z.bases/Atlante Mappe.base` | Core per esplorazione e tavolo; ogni mappa deve avere fallback testuale. |
| Canvas / Excalidraw | Vedere relazioni, fronti, indizi e scene come rete navigabile. | [[Risorse/Canvas Per GDR]], [[Risorse/Excalidraw Per GDR]] | Utile quando mostra causalita o posizione; evitare disegni decorativi. |
| Calendarium | Sapere cosa scade, quando avviene una sessione e quale evento futuro reagisce. | [[Mondi/Calendario]], missioni con `fc-date`, dashboard operative | Supporto tempo; resta utile solo se le scadenze alimentano preparazione e post-sessione. |
| Fantasy Content Generator | Produrre bozze da smistare, non canone automatico. | [[Risorse/Smistamento Bozze Generate]], `Inbox/Generati` | Opzionale guidato; valore nullo se le bozze non vengono collegate a mondo/sessione. |
| Media | Portare audio, immagini o video gia contestualizzati in sessione. | [[Risorse/Media Scene]], [[Hub/Durante il Gioco]] | Supporto leggero; non va riempito con asset generici. |
| Tasks / Kanban | Tenere preparazione, post-sessione e manutenzione fuori dalla memoria del DM. | [[Risorse/Task DM]], `z.bacheche` | Supporto DM; non trasformare missioni, clock o lore in checklist. |

Gate pratico: se un plugin non accelera Crea -> Prepara -> Gioca -> Aggiorna, deve restare invisibile o in manutenzione. La matrice resta il registro di presenza; questa sezione decide il valore operativo.

## Estensioni Non Installate Da Valutare

Questa non e una lista di rimozione. I 27 plugin installati vanno sfruttati. Questa sezione riguarda solo estensioni non installate o alternative sovrapposte: entrano solo se migliorano una pagina operativa gia esistente o riducono complessita per l'utente non tecnico.

| Candidato | Priorita | Decisione provvisoria | Dove avrebbe senso | Motivo |
| --- | --- | --- | --- | --- |
| Bases core | alta | integrare senza sostituire Dataview | dashboard di controllo, elenchi missioni, PNG, luoghi, materiali | E gia abilitato tra i core plugin e puo offrire viste modificabili piu accessibili dei blocchi Dataview. Dataview resta necessario per query complesse, aggregazioni e viste gia mature. |
| Maps per Bases | media | installato e supportato | [[z.bases/Atlante Mappe.base]], [[Risorse/Mappe Bases]] | Plugin ufficiale Obsidian per viste mappa basate su Bases. Utile solo per note con `coordinates`; non sostituisce mappe fantasy visuali. |
| Tasks | supportato | lavoro DM, non lore | preparazione sessione, post-sessione, backlog manutenzione | Installato con global filter `#task`. Forte per task con scadenze, ricorrenze, filtri e completamento da vista. Da evitare per missioni narrative: quelle restano note strutturate, non checkbox. |
| QuickAdd | bassa | non installato, evitare per ora | catture rapide e macro | Potente, ma sovrappone Templater, Meta Bind e gli script `z.automazioni`. Entra solo se risolve una cattura che oggi richiede troppi click. |
| Commander | bassa | non installato, opzionale UX | toolbar comandi per DM e mobile | Utile per esporre comandi senza far aprire la command palette. Non aggiunge contenuto o modello dati, quindi non e core. |
| Leaflet | bassa | non installato, alternativa mappe | mappe fantasy con immagine e marker | Funzionalmente vicino a TTRPG Tools: Maps. Ha senso solo per compatibilita con vault esistenti o mappe gia scritte in sintassi Leaflet. |

Il dettaglio operativo e consolidato nel contratto plugin YAML e nei check `check:release-quality`.

### Prova Consigliata Per Bases

Prima integrazione a basso rischio, avviata in `z.bases`:

- fatto: creare una vista Bases per `Mondi/Missioni` filtrata per `stato`, `mondo`, `pressione` e `scadenza_mondo`;
- fatto: creare una vista Bases per worldbuilding (`Mondi/Culture`, `Mondi/Religioni`, `Mondi/Societa`, `Mondi/Cosmologia`);
- fatto: creare una vista Bases per `Mondi/Personaggi` con `tipo: png`, filtrata per `stato`, `fazione`, `luogo` e prossima mossa;
- fatto: creare viste Bases per `Mondi/Fazioni` e per economia (`Mondi/Risorse`, `Mondi/Rotte`, `Mondi/Mercati`);
- fatto: creare viste Bases pilota per `Mondi/Luoghi` e `Mondi/Incontri`;
- fatto: aggiungere viste tabellari multiple per pressione, archivio, campagna, mondo, sessione, completamento dati e marker mappa;
- linkare le viste da [[1. DM Dashboard]] come alternativa leggibile, non come sostituzione delle query Dataview;
- verificare che una release senza uso diretto di Bases continui a funzionare.

Fatto bene quando: un DM non tecnico puo correggere stato, urgenza o collegamenti da una vista tabellare senza toccare una query.

### Prova Consigliata Per Tasks

Tasks e installato nel vault. La preparazione usa `#task` sulle sole checklist operative in `z.bacheche`.

Configurazione:

- global filter impostato su `#task`;
- usare [[Risorse/Task DM]] come vista operativa Tasks, con fallback Dataview;
- query Tasks ordinate per scadenza, urgenza e priorita;
- [[z.bacheche/Manutenzione Vault]] usa ricorrenze solo per controlli periodici del vault;
- non taggare checklist narrative, checklist di pubblicazione o checklist guida;
- non convertire missioni, clock o conseguenze in task.

## Verifica 2026-05-20

| Area | Esito | Azione |
| --- | --- | --- |
| Dashboard e automazioni | ben sfruttate | Dataview, DataviewJS, Meta Bind e Templater sono la spina dorsale del vault. |
| Metadata Menu | migliorato | Aggiunte FileClass per `incontro`, `rotta`, `risorsa`, `mercato`, `compendium`, `ricorrenza`, `mappa` e `media`. |
| Calendarium | integrato con default neutro | Configurato un calendario generico unico, senza ambientazioni protette o contenuti proprietari. |
| Statblocks | base funzionante | Creature con `statblock: true`; ora il flusso incontro -> creatura -> iniziativa e documentato. |
| Media Extended | leggero | Audio/video/immagini sono indicizzati; usarlo meglio solo con media reali di campagna. |
| Kanban | base | Le bacheche esistono; prossimo passo utile: collegare task a sessioni e missioni reali. |
| BRAT | tecnico | Tenere fuori dal percorso DM e dalla release pulita come funzione di manutenzione. |
| Linter | supporto sviluppo | Configurato manuale e prudente; niente lint on save, SRD e mappe ignorati. |
| Workspaces/Bookmarks | supportato | Workspaces core abilitato, tre layout salvati e segnalibri pronti per tavolo, worldbuilding e manutenzione. |

## Prossime Integrazioni

### 1. Calendarium

Stato: integrazione Markdown rifinita e configurazione plugin attiva.

Obiettivo: collegare le date del mondo alle sessioni, alle missioni e agli eventi futuri.

Da fare:

- fatto: definire in [[Mondi/Calendario]] le regole minime del calendario;
- fatto: usare `data_mondo` nelle sessioni come campo leggibile e coerente;
- fatto: usare `scadenza_mondo` nelle missioni come campo leggibile al tavolo;
- fatto: aggiungere nelle missioni una scadenza narrativa quando serve usando i campi Calendarium `fc-calendar`, `fc-date`, `fc-category`, `fc-display-name` e, se serve, `fc-end`;
- fatto: usare categorie semplici per gli eventi: `sessione`, `scadenza`, `festa`, `pericolo`, `conseguenza`;
- valutare eventi inline con `span` solo dentro note di sessione o resoconti, dove possono servire piu eventi nella stessa nota;
- fatto: mostrare nella DM Dashboard le prossime scadenze narrative.
- fatto: mostrare in [[Mondi/Calendario]] e [[Risorse/Controllo Vault]] le note con data leggibile ma senza `fc-date`.
- fatto: sostituiti i calendari di ambientazioni protette con `Calendario Del Mondo`, default neutro rinominabile dal DM.
- fatto: impostato `Calendario Del Mondo` come calendario predefinito per `Mondi` e `Campagne`.
- fatto: [[Mondi/Calendario]] legge la configurazione Calendarium e mostra calendari, categorie, eventi interni e data corrente.
- fatto: [[Risorse/Controllo Vault]] segnala note `fc-date` con `fc-calendar` non presente nella configurazione plugin.

Fatto bene quando: il DM sa che giorno e nel mondo, cosa sta per scadere e quale sessione arriva dopo.

### 2. Initiative Tracker E Fantasy Statblocks

Stato: integrazione supportata per combattimenti pronti.

Obiettivo: rendere gli incontri pronti davvero giocabili al tavolo.

Da fare:

- fatto: completare il template incontro con blocchi per creature, iniziativa, terreno, round e condizioni;
- fatto: collegare le creature di [[Mondi/Creature/Creature]] agli incontri;
- fatto: usare Fantasy Statblocks per le creature con `statblock: true` e campi YAML nel frontmatter, cosi il plugin puo parsarle nel bestiario;
- fatto: usare Initiative Tracker per combattimenti veri, dato che gestisce iniziativa, turni, PF, CA, condizioni, stati a durata e creature da Fantasy Statblocks;
- fatto: usare blocchi `encounter` nelle note incontro/sessione quando il combattimento e preparato;
- usare incontri inline `encounter:` nelle note di sessione solo per gruppi semplici o incontri casuali;
- mantenere i nomi creature identici tra frontmatter `name`, blocchi `statblock` e blocchi `encounter`;
- distinguere incontri sociali, esplorativi e combattimenti;
- fatto: coprire il flusso incontro con template, controlli e vista operativa.
- fatto: aggiungere [[Risorse/Iniziativa e Combattimenti]] per controllare incontri di combattimento e missing `encounter_creatures`.
- fatto: configurare Initiative Tracker per usare Dice Roller e preferire link Statblocks.

Fatto bene quando: aprendo un incontro pronto il DM puo iniziare la scena senza cercare schede altrove.

### 3. Dice Roller

Obiettivo: rendere tabelle e procedure casuali usabili senza uscire dal vault.

Da fare:

- fatto: creare tabelle riutilizzabili in [[Risorse/Tabelle/Tabelle]] con block id stabili;
- fatto: aggiungere tiri rapidi inline con sintassi `dice:`, per esempio `dice: 1d20`;
- fatto: usare table rollers con block id, per esempio `dice: [[Risorse/Tabelle/Tabelle#^umore-png]]`;
- fatto: usare lookup table a due colonne quando il risultato dipende da un tiro specifico, per esempio `1-2`, `3-4`, `15-20`;
- fatto: collegare tabelle utili a viaggio, esagoni, reazioni di fazione e post-sessione;
- usare risultati annidati solo quando rimandano a tabelle gia leggibili;
- evitare tabelle troppo grandi prima che siano utili al tavolo.

Fatto bene quando: durante preparazione o gioco il DM puo generare un risultato e usarlo subito.

### 4. Excalidraw, Canvas E Mappe

Obiettivo: rendere visibili relazioni, fronti, mappe e geografia senza duplicare note.

Da fare:

- fatto: usare [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]] come prova base per relazioni tra PNG, luoghi e fazioni;
- fatto: configurare Excalidraw per salvare nuove mappe in `Risorse/Mappe` e usare il template `z.modelli/mappe/Mappa Excalidraw Fronti.excalidraw.md`;
- fatto: attivare rendering degli embed Excalidraw in Markdown reading mode e hover preview senza Ctrl;
- fatto: creare una convenzione per mappe di regione, dungeon e fronti;
- fatto: aggiungere viste integrate politica, commerciale, religiosa e conflitti in [[Risorse/Mappe/Mappe]];
- usare Excalidraw quando servono disegno libero, annotazioni visuali, embed, link tra disegni e note o riferimenti `area=`/`group=` a parti del disegno;
- usare Canvas quando serve una mappa relazionale fatta di note, media, gruppi e connessioni leggibili;
- ricordare che Canvas salva file `.canvas` in formato JSON Canvas, quindi e adatto a mappe strutturate e durevoli;
- fatto: mostrare in Worldbuilder Dashboard le mappe principali.

Fatto bene quando: una mappa aiuta a capire il mondo e rimanda alle note canoniche, invece di diventare un archivio parallelo.

### 5. Linter

Stato: supporto sviluppo configurato.

Obiettivo: pulire note selezionate senza produrre diff enormi o rompere metadati speciali.

Da fare:

- fatto: mantenere `lintOnSave` e `lintOnFileChange` disattivati;
- fatto: attivare solo regole a basso rischio: riga vuota dopo YAML, righe vuote consecutive, newline finale e trailing spaces;
- fatto: ignorare `SRD`, `Risorse/Mappe` e `.obsidian`;
- fatto: documentare uso e limiti in [[Dev/Sviluppo Vault]].

Fatto bene quando: il manutentore usa Linter su singole note o cartelle piccole e controlla sempre il diff.

### 6. Media Extended

Obiettivo: preparare audio, video e immagini da usare al tavolo senza interrompere la sessione.

Nota: la documentazione ufficiale indica che Media Extended puo accedere a media fuori dal vault e puo usare rete per servizi online configurati o linkati. Inoltre segnala che le future release v4 saranno closed source, mentre il codice v3 resta MIT. Integrare solo funzioni davvero utili al tavolo.

Da fare:

- fatto: ordinare [[Risorse/Audio/Audio]], [[Risorse/Video/Video]] e [[Risorse/Immagini/Immagini]] per uso pratico;
- fatto: aggiungere campi come `uso`, `tono`, `campagna`, `scena`, `timestamp` e `stato` dove servono;
- fatto: usare timestamp e link a momenti precisi per video, audio e registrazioni;
- usare screenshot da video solo quando diventano dispense o riferimenti di scena;
- evitare dipendenze da URL remoti per materiale indispensabile alla sessione;
- fatto: mostrare materiale pronto in [[Durante il Gioco]];
- collegare dispense e scene ai media collegati.
- da fare solo con materiale reale: usare timestamp precisi e media locali per scene ricorrenti.

Fatto bene quando: il DM apre Durante il Gioco e trova subito atmosfera, immagini o dispense pronte.

### 7. Generatore di Contenuti Fantasy

Stato: flusso bozze -> smistamento -> canonizzazione completato.

Obiettivo: generare spunti rapidi in italiano e salvarli come bozze Markdown senza interrompere la preparazione.

Fatto:

- tradotta l'interfaccia principale del plugin e le impostazioni;
- sostituite le tabelle base con contenuti italiani per citta, locande, voci, bevande, bottino, gruppi e dungeon;
- aggiunto il pulsante `Crea nota` nella modale del generatore;
- le note generate finiscono in `Inbox/Generati` con frontmatter compatibile con i template del vault;
- dungeon, locande e insediamenti producono bozze `categoria: luogo`;
- gruppi producono bozze `categoria: fazione`;
- bottini, bevande, navi, metalli e artefatti producono bozze `categoria: oggetto`;
- nomi fantasy producono bozze `categoria: personaggio` e `tipo: png`;
- religioni producono bozze `categoria: religione`;
- ogni nota conserva il testo generato in `contenuto_generato`, oltre a `plugin`, `generatore`, `stato`, `canonico` e `creato`;
- ogni nota generata mostra i pulsanti `Smista Bozza`, `Canonizza Bozza` e `Archivia`;
- `Smista Bozza` sposta la nota nella cartella canonica suggerita e la lascia non canonica;
- `Canonizza Bozza` sposta la nota nella cartella canonica suggerita, imposta `canonico: true`, `stato_canonico: canonico` e registra `canonizzato_il`;
- le azioni rifiutano bozze senza aggancio a `mondo`, `luogo`, `campagne` o `sessioni`;
- il comando continua a offrire anche `Copia`, utile quando il risultato deve essere incollato in una nota gia aperta.

Regola: il plugin non esegue Templater e non sposta note nelle cartelle canoniche. Produce bozze compatibili con i template esistenti; tutto resta `stato: bozza` e `canonico: false` finche il DM non lo rivede e lo collega a campagna, mondo, luogo o sessione.

Prossimi potenziamenti:

- aggiungere preset di tono: classico, oscuro, fiabesco, urbano, marittimo;
- rifinire gli adapter dei singoli generatori quando cambiano i template ufficiali del vault;
- spostare il plugin da bundle patchato a sorgenti TypeScript mantenibili.

Fatto bene quando: durante preparazione o gioco il DM puo generare una bozza, salvarla nel vault e ritrovarla senza dover copiare contenuti a mano.

## In Attesa

Questi plugin restano secondari o fuori dal flusso base della release ZIP:

- **Iconize**: migliora orientamento visivo, ma non sostituisce indici e dashboard chiare.
- **BRAT**: manutenzione plugin essenziale per strumenti non ufficiali o beta; resta attivo ma non entra nel percorso del DM.
- **Emoji Toolbar**: opzionale, non incluso nella release base.

## Import Mappe Esterne

Stato: base avviata e mantenuta come import controllato.

Decisione:

- non importare direttamente `.map` di Azgaar nella release iniziale;
- usare `.map` come salvataggio da riaprire in Azgaar;
- usare GeoJSON/CSV/SVG/PNG come sorgenti per il vault;
- importare dati come bozze, mai come canone automatico.

Implementato:

- [[Risorse/Importare Mappe]];
- `npm run import:azgaar`;
- creazione di bozze in `Mondi/Luoghi` con `fonte: azgaar`.

## Integrazione Trasversale: Tabs

Stato: integrazione base consolidata.

Uso: migliorare la navigazione nei template lunghi senza cambiare i campi o la logica delle note.

Applicato a:

- [[z.modelli/dm/Sessione]]
- [[z.modelli/dm/Incontro]]
- [[z.modelli/dm/Missione]]
- [[z.modelli/dm/Campagna]]
- [[z.modelli/Mondo]]
- [[z.modelli/personaggio/PNG]]
- [[z.modelli/fazione/Fazione]]
- [[z.modelli/luogo/Insediamento]]
- [[Risorse/Mappe/Mappe]]
- [[Worldbuilder Dashboard]]
- [[Lore Hub]]
- [[Economia E Rotte]]

Regola: usare Tabs solo per raggruppare sezioni gia esistenti. Se il plugin non e attivo, il contenuto resta comunque leggibile come blocco markdown.

## Regola Di Priorita

Prima integra cio che si usa durante una sessione reale. Poi cio che accelera la preparazione. Solo dopo cio che abbellisce o organizza.
