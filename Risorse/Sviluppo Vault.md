# Sviluppo Vault

Questa nota guida le modifiche future al vault. Il destinatario finale è un DM o worldbuilder che vuole preparare e giocare meglio, non una persona tecnica.

## Principio Guida
Ogni modifica deve rendere piu facile una di queste azioni:
- preparare una sessione o una campagna;
- trovare le informazioni utili facilmente durante il gioco;
- tenere traccia di cosa è successo;
- trasformare le idee grezze in strutture definite di un mondo giocabile;
- mantenere continuità tra sessioni.

## Utente Finale
Il vault deve funzionare per una persona che:
- non vuole leggere codice;
- non vuole comprendere Dataview, Templater o Meta Bind;
- ragiona da worldbuilder e DM;
- ha bisogno di trovare informazioni rapidamente durante il gioco;
- poter prendere appunti disordinati e sistemarli successivamente.

## Documentazione

- `README.md` deve restare una guida per l'utente finale: dove cliccare, dove scrivere, come usare il vault durante preparazione e gioco.
- [[Risorse/Guida DM]] deve spiegare il flusso operativo senza dettagli tecnici: preparazione, gioco, Inbox Live, post-sessione e canonizzazione.
- [[Risorse/Indice Connettore GPT]] deve restare un indice sintetico per code search e connettori GPT, marcato con `is_code_search_indexed: true`.
- Questa nota contiene la documentazione di sviluppo: campi, template, automazioni, test, import generati e criteri di modifica.
- Le istruzioni tecniche non vanno nel README se non sono necessarie per usare il vault al tavolo.

## Regole Di Progettazione
- Una schermata per Worldbuilding e una per DM.
- Usa parole da tavolo, non parole tecniche.
- Inserire pulsanti dove l'utente prende decisioni.
- Usare card per attenzione immediata.
- Usare tabelle per archivi e confronto.
- Usare liste per risorse semplici.
- Usare callout customizzati per testo da leggere, indizi, segreti, pericoli e ricompense.
- Lascia i dettagli tecnici in `z.modelli`, `z.automazioni` e CSS.

## Cosa Deve Essere Sempre Visibile
Nella dashboard DM devono esserci:
- campagne in corso;
- prossime sessioni;
- idee da smistare/completare;
- guida DM;
Nella dashboard Worldbuilder devono esserci:
- pulsanti di creazione;
- elenco dei mondi;
- note in stato bozza da completare;
- rapida visuale dei diversi mondi

## Stati delle Note Consigliati
Usa pochi stati e usali sempre nello stesso modo.
- `bozza`: esiste ma non e pronta.
- `pronto`: utilizzabile al tavolo.
- `archiviata`: non serve piu, ma va conservata.

Tutte le entità che lo richiedono avranno anche altri `stato_attuale` come, ad esempio, per PNG `morto`, `vivo` ecc.

## Convenzioni Dei Campi

Usa questi campi in modo coerente, perché alimentano Dataview, dashboard, Meta Bind e controlli:

- `categoria`: tipo generale della nota, per esempio `sessione`, `personaggio`, `luogo`, `missione`.
- `tipo`: sottotipo utile al gioco, per esempio `pg`, `png`, `dungeon`, `oggetto magico`.
- `sottotipo`: specializzazione creata dai router quando serve distinguere una scelta guidata senza rompere le query basate su `tipo`.
- `famiglia_luogo`: macro-famiglia scelta da `Luogo Router`, per esempio `insediamento`, `luogo di interesse`, `regione naturale`, `geografia`, `politica`.
- `stato`: avanzamento operativo. Valori comuni validati: `bozza`, `preparazione`, `pronto`, `in corso`, `in gioco`, `giocata`, `da smistare`, `smistata`, `collegata`, `canonica`, `canonico`, `accettata`, `proposta`, `conclusa`, `archiviata`, `ignorata`.
- `stato_attuale`: stato fictionale nel mondo, da usare solo quando serve separarlo da `stato`. Esempi: PNG `vivo`, `scomparso`, `morto`; luogo `conteso`, `occupato`, `in rovina`; fazione `attiva`, `in crisi`, `nascosta`.
- `attiva`: booleano usato dalle sessioni. Deve essere `true` su una sola sessione alla volta. Se manca una sessione attiva, gli helper usano come fallback l'ultima sessione `pronto` o `preparazione`.
- `canonico`: `true` quando il contenuto e confermato nel mondo di gioco.
- `mondo`: collega una nota al mondo a cui appartiene.
- `luogo`, `luoghi`, `personaggi`, `fazioni`, `missioni`, `ricompense`, `relazioni`: usa link interni quando possibile.
- `data_mondo`: campo testuale unico per date leggibili al tavolo in sessioni, lore capture ed eventi storici.
- `pressione`, `prossima_mossa`, `leader`, `rivali`, `luoghi`, `missioni`: alimentano Poteri In Movimento e Buchi Di Mondo.
- `causa`, `conseguenze`, `luoghi`, `fazioni`, `missioni`: alimentano Timeline Causale.
- `vuole`, `sa`, `leva`, `segreto`, `segreti`, `indizi`, `voci`, `domande_aperte`, `tensione`, `funzione_narrativa`: campi di profondita lore. Devono restare brevi e giocabili, non saggi enciclopedici.

Per le note di categoria `mondo`, usa anche `tono`, `tema`, `tecnologia`, `magia`, `continenti`, `fazioni`, `religioni` e `campagne`.

Per i luoghi pronti, usa `mondo`, `luogo_padre` quando ha senso, `fazioni`, `pericolo`, `stabilita` e `pressione`. Per i PNG in gioco, usa `luogo` e almeno uno tra `fazioni` e `relazioni`.

## Router E Creazione Guidata

I router devono fare scegliere al DM una categoria comprensibile e poi includere il template corretto. Non devono esporre nomi di file o dettagli tecnici come scelta primaria.

Router principali:

- `z.modelli/Luogo Router.md` usa `z.automazioni/worldbuilding.js` e passa `famiglia_luogo` e `sottotipo` a `z.automazioni/luogo.js`.
- `z.modelli/Fazione Router.md` passa `tipoFazione` a `z.automazioni/fazione.js`.
- `z.modelli/Personaggio Router.md` crea un PNG generico tramite `z.automazioni/personaggio.js`.
- `z.modelli/dm/DM Router.md` passa `contentType` ai template DM.

Regole per le automazioni di creazione:

- chiedi sempre `mondo` prima delle altre connessioni, cosi i suggerimenti possono ordinare le note dello stesso mondo;
- crea connessioni nel frontmatter al momento della creazione, non solo nel corpo della nota;
- per luoghi, chiedi almeno `luogo_padre`, `fazioni`, `personaggi`, `missioni`;
- per fazioni, chiedi almeno `leader`, `luoghi`, `personaggi`, `missioni`, `alleati`, `rivali`;
- per PNG, chiedi almeno `luogo`, `fazioni`, `relazioni`, `missioni`;
- per missioni, chiedi almeno `committente`, `luoghi`, `personaggi`, `fazioni`, `ricompense`;
- i campi lore opzionali devono essere brevi: una frase per `vuole`, `sa`, `leva`, `tensione`, `segreto`, `prossima_mossa`, `scadenza_mondo`;
- non creare collegamenti reciproci modificando automaticamente note gia esistenti, a meno che l'utente lo chieda: e facile sovrascrivere lavoro manuale. Le viste Dataview devono ricostruire i backlink operativi leggendo i campi della nota nuova.

## Cartelle Di Servizio

- `z.modelli`: template Templater. Modifica con cautela.
- `z.automazioni`: script Templater usati dai template e script CLI di manutenzione. Se cambi un percorso qui, aggiorna anche dashboard e Dataview.
- `z.bacheche`: bacheche Kanban per preparazione e creature.

## Runtime Live E Session Context

La logica comune di runtime sta in `z.automazioni/session_context.js`.

Responsabilita:

- trovare la sessione attiva tramite `attiva: true`;
- applicare fallback a sessioni `pronto` o `preparazione`;
- esporre helper DataviewJS condivisi come `escapeHtml`, `isReal`, `linkKey`, `internalLink`, `sessionCandidates` e `linkedPages`;
- ridurre duplicazione nei blocchi DataviewJS delle dashboard.

Le automazioni Templater usano invece `z.automazioni/helpers.js`. Per la creazione live sono disponibili `getActiveSessionFile()` e `getActiveSessionContext()`, usati per precompilare mondo e sessione nelle note create durante il gioco.

## Template Live

I template live sono pensati per catturare contenuto al tavolo senza costringere il DM a decidere subito la struttura definitiva:

- `z.modelli/Live Evento.md`
- `z.modelli/Live Conseguenza.md`
- `z.modelli/Live PNG.md`
- `z.modelli/Live Luogo.md`
- `z.modelli/Live Nota Grezza.md`

Automazioni corrispondenti:

- `z.automazioni/live_evento.js`
- `z.automazioni/live_conseguenza.js`
- `z.automazioni/live_png.js`
- `z.automazioni/live_luogo.js`
- `z.automazioni/live_nota.js`

Regola: questi template creano note in `Inbox` e devono provare a collegare automaticamente la sessione attiva e il mondo della sessione. La canonizzazione avviene dopo, da [[z.bacheche/Post Sessione]] e [[Mondi/Stato del Mondo]].

## Import SRD

Lo script `z.automazioni/import_srd.js` importa il System Reference Document 5.2.1 in italiano dalla fork `neokon91/DND-SRD-IT` e genera note dentro `SRD`.

Regole:

- le note generate devono avere `generato_da: import_srd`;
- i mostri SRD devono restare parsabili da Fantasy Statblocks come creature: mantieni `statblock: true` e i campi YAML completi nel frontmatter;
- il fatto che Obsidian Properties mostri alcune proprieta annidate come difficili da editare e accettato per mostri e creature, perche quel frontmatter alimenta Fantasy Statblocks e Initiative Tracker;
- per note SRD non mostro, preferisci frontmatter semplice e leggibile da Properties;
- una nota generata viene sovrascritta solo se contiene ancora quel campo;
- se una nota SRD viene modificata a mano, rimuovere o cambiare `generato_da` prima di rigenerare;
- `SRD` resta separato dal contenuto canonico del mondo.

Comando:

```bash
node z.automazioni/import_srd.js
```

## Smoke Test Locale

Prima di una release o dopo modifiche a template, script e plugin, esegui:

```bash
node z.automazioni/check_vault.js
```

Il controllo verifica JSON di configurazione, plugin obbligatori inclusi e abilitati, wikilink rotti o ambigui, percorsi `templateFile` usati dai pulsanti Meta Bind, helper Templater con script esistente in `z.automazioni`, target di Icon Folder, riferimenti Obsidian obsoleti, sessioni multiple attive, indice GPT, frontmatter operativo, categorie/stati/tipi ragionevoli, note live senza sessione o mondo e campi minimi per categoria. SRD e note indice sono esclusi dai controlli che produrrebbero falsi positivi.

## Release

Per pubblicare una copia del vault:

1. aggiorna [[VERSION]];
2. aggiorna [[CHANGELOG]];
3. segui [[RELEASE]];
4. esegui `node z.automazioni/check_vault.js`;
5. apri manualmente [[Inizia Qui]], [[1. DM Dashboard]], [[Durante il Gioco]] e [[Worldbuilder Dashboard]].

La cartella `.obsidian/plugins` fa parte del prodotto: i plugin sono inclusi perche dashboard, template, campi e viste dipendono dalle loro configurazioni.

### Mostri E Fantasy Statblocks

I mostri importati e le creature create dal vault devono avere frontmatter compatibile con Fantasy Statblocks oltre ai campi italiani usati da Dataview. La documentazione del plugin indica che una nota con `statblock: true` puo essere parsata dal frontmatter quando l'opzione o il comando di parse frontmatter e attivo; non spostare i campi dello statblock solo nel corpo Markdown se la creatura deve entrare nel bestiario del plugin.

Campi minimi per lo statblock:

- `statblock: true`
- `name`
- `type`
- `size`
- `alignment`
- `ac`
- `hp`
- `hit_dice`
- `speed`
- `cr`
- `stats`
- `saves`
- `skillsaves`
- `senses`
- `languages`
- `traits`
- `actions`
- `bonus_actions`
- `reactions`
- `legendary_actions`
- `lair_actions`

I campi italiani come `nome`, `categoria`, `tipo`, `tipo_creatura`, `dimensione`, `classe_armatura`, `iniziativa` e `bonus_competenza` vanno mantenuti per dashboard, indici e leggibilita del vault.

Sintassi da preservare:

```yaml
---
statblock: true
name: "Nome creatura"
type: bestia
size: media
alignment: neutrale
ac: 13
hp: 18
speed: 9 m.
cr: 1/2
stats: [12, 14, 12, 3, 12, 6]
traits: []
actions: []
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
---
```

Nel corpo della nota usa un blocco `statblock` che richiama il nome della creatura gia parsata:

````markdown
```statblock
monster: Nome creatura
```
````

### Initiative Tracker

Initiative Tracker usa blocchi `encounter` per lanciare combattimenti direttamente dalle note. Il plugin puo lavorare con creature sincronizzate da Fantasy Statblocks, quindi i nomi usati negli encounter devono corrispondere ai nomi del bestiario.

Sintassi base:

````markdown
```encounter
name: Ponte delle Campane
creatures:
 - 3: Goblin
 - Prova - Creatura
```
````

Sintassi inline utile per tabelle casuali o note rapide:

```markdown
`encounter: 3: Goblin, 1d4: Scheletro, Prova - Creatura`
```

Usa il blocco `encounter` per incontri preparati; usa inline `encounter:` solo per gruppi semplici o risultati generati da Dice Roller.

### Dice Roller

Dice Roller usa inline code `dice:` per tiri e table roller. Le tabelle casuali del vault devono avere block id stabili se vengono richiamate da altre note.

Esempi da preservare:

```markdown
`dice: 1d20`
`dice: [[Risorse/Tabelle/Tabelle#^umore-png]]`
`dice: 1d4[[Risorse/Tabelle/Tabelle#^complicazioni]]`
```

Per lookup table, la prima colonna deve contenere la formula o gli intervalli del tiro e la tabella deve avere due colonne.

### Tabs

Tabs usa code block `tabs`; ogni `tab:` apre una sezione. Poiche il contenuto resta dentro un code block dal punto di vista Markdown, non usarlo per task che devono essere indicizzati come checklist da plugin esterni. E invece adatto per dashboard, archivi lunghi, mostri SRD e viste con Dataview.

````markdown
````tabs
tab: Scheda
Contenuto

tab: Archivio
Contenuto
````
````

### Excalidraw

Excalidraw salva disegni come Markdown e permette frontmatter, link, embed e riferimenti a parti del disegno. Nel vault va usato per mappe vive e relazioni, non come immagine decorativa.

Regole pratiche:

- una mappa Excalidraw deve avere frontmatter con `categoria: risorsa`, `tipo: mappa`, `uso`, `stato` e, quando serve, `mondo`, `luogo`, `fazioni`, `personaggi`, `missioni`;
- usa embed standard come `![[Risorse/Mappe/Schema Relazioni GDR.excalidraw]]` nelle dashboard operative;
- usa link interni nel disegno verso note canoniche quando la mappa rappresenta fronti, PNG, luoghi o missioni;
- usa riferimenti `area=` o `group=` solo quando serve incorporare una porzione specifica del disegno in una nota.

### Calendarium

Calendarium legge campi `fc-*` dal frontmatter. Nel vault i campi Calendarium non sostituiscono `data_mondo`: servono a far apparire sessioni, scadenze e conseguenze nel calendario fantasy.

Campi da mantenere:

- `data_mondo`: testo leggibile al tavolo, usato da dashboard e timeline.
- `scadenza_mondo`: testo leggibile per pressioni, missioni e fazioni.
- `fc-calendar`: calendario Calendarium di riferimento, vuoto se si usa quello predefinito.
- `fc-date`: data parsabile dal calendario fantasy.
- `fc-end`: fine evento, solo se serve.
- `fc-category`: categoria operativa, per esempio `sessione`, `scadenza`, `festa`, `pericolo`, `conseguenza`.
- `fc-display-name`: nome breve dell'evento nel calendario.

Non rinominare i campi `fc-*` e non usare `fc-date` come unica data narrativa: senza `data_mondo` o `scadenza_mondo` le viste operative restano meno leggibili durante il gioco.

### Meta Bind

Meta Bind alimenta pulsanti, input e toggle nelle dashboard e nei template. Le query e gli helper presuppongono che questi input scrivano negli stessi campi YAML documentati sopra.

Sintassi usata nel vault:

```markdown
`INPUT[toggle:attiva]`
`INPUT[text:data_mondo]`
`INPUT[inlineList:condizioni]`
`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
```

Pulsanti di creazione:

````markdown
```meta-bind-button
label: Nuova Sessione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Sessione.md"
    folderPath: "Mondi/Sessioni"
    open: true
```
````

Non cambiare `templateFile`, `folderPath` o il nome dei campi scritti dagli input senza aggiornare anche `z.automazioni/check_vault.js`, dashboard, template e helper Templater. Evita input Meta Bind per campi complessi dei mostri SRD se rischiano di semplificare o riscrivere il frontmatter usato da Fantasy Statblocks.

## Note Di Prova

Le note di prova sono contenuti finti usati per controllare che template, automazioni, Dataview, callout e CSS funzionino insieme.

Regole:

- nome con prefisso `Prova -`;
- `stato: archiviata`, quando il campo esiste;
- `canonico: false`, quando il campo ha senso;
- collegamenti realistici tra mondo, PNG, luoghi, fazioni, missioni, incontri e oggetti;
- raccolta centrale in [[Risorse/Prove Entità]];
- esclusione da dashboard, indici operativi e controlli di preparazione.

Le prove non devono guidare il gioco. Devono solo mostrare se una modifica rompe qualcosa o se un template produce note leggibili.

Quando aggiungi o cambi un template importante:

- crea una nota reale solo se serve al tavolo;
- crea o aggiorna una nota `Prova - ...` per collaudare il formato;
- controlla che la nota di prova non compaia nelle viste operative;
- controlla che compaia invece in [[Risorse/Prove Entità]].

## Test Con CLI Obsidian

Usa la CLI di Obsidian per controlli ripetibili prima di consegnare o pubblicare modifiche al vault.

Prerequisiti:

- Obsidian aggiornato con installer recente;
- interfaccia CLI attiva in `Impostazioni > Generale > Avanzate`;
- vault `GDR` aperto almeno una volta in Obsidian.

Comandi consigliati:

```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian version vault=GDR
/Applications/Obsidian.app/Contents/MacOS/Obsidian vault vault=GDR
/Applications/Obsidian.app/Contents/MacOS/Obsidian plugins:enabled vault=GDR filter=community versions format=tsv
/Applications/Obsidian.app/Contents/MacOS/Obsidian unresolved vault=GDR total
```

Controlli di rendering e plugin:

```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian open vault=GDR path='1. DM Dashboard.md'
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:debug vault=GDR on
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:dom vault=GDR selector='.workspace-leaf-content[data-type="markdown"]' text
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:dom vault=GDR selector='.dataview-error, .dataviewjs-error, .block-language-dataview .error' total
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:errors vault=GDR
/Applications/Obsidian.app/Contents/MacOS/Obsidian dev:console vault=GDR level=error limit=50
```

Smoke test Meta Bind non distruttivo:

```bash
/Applications/Obsidian.app/Contents/MacOS/Obsidian eval vault=GDR code='(() => { const btn=[...document.querySelectorAll("button")].find(b => b.textContent.includes("Durante Il Gioco")); if (!btn) return "button-not-found"; btn.click(); return "clicked"; })()'
/Applications/Obsidian.app/Contents/MacOS/Obsidian tabs vault=GDR ids
```

Esito atteso:

- `unresolved` deve restituire `0`;
- `dev:errors` deve indicare che non ci sono errori catturati;
- `dev:console level=error` non deve mostrare errori;
- la dashboard deve contenere i pulsanti Meta Bind e i riepiloghi Dataview;
- lo smoke test deve aprire [[Durante il Gioco]].

## Dove Vanno Le Cose
- Idee vaghe: [[Inbox/Inbox]]
- Appunti live: [[Durante il Gioco]]
- Conseguenze dopo sessione: [[z.bacheche/Post Sessione]]
- Contenuto confermato del mondo: `Mondi`
- Campagne, party e avanzamento al tavolo: `Campagne`
- Avventure e one-shot legate a una campagna: dentro la campagna
- Avventure, one-shot, mappe, tabelle e dispense riutilizzabili: `Risorse`
- Strumenti e template: `z.modelli`, `z.automazioni`, `z.bacheche`

## Cartelle

Le cartelle non sono vietate. Se una funzione, una categoria o una automazione ha bisogno di una cartella chiara per funzionare bene, la cartella va creata.

Prima di creare una cartella, controlla solo che:

- abbia un nome italiano e comprensibile al DM;
- non dupli una cartella o un concetto già esistente;
- sia usata da template, automazioni, dashboard o pagine indice;
- aiuti a trovare contenuti durante preparazione o gioco.

Se la cartella serve, creala insieme alla nota indice quando ha senso. Evita solo cartelle speculative che non vengono ancora usate.

## Mondo e Campagna

- `Mondo` è il contenitore canonico dell'ambientazione.
- `Campagna` è l'esperienza di gioco dentro uno o più mondi.
- Ogni nota di worldbuilding dovrebbe avere il campo `mondo` quando appartiene a una ambientazione precisa.
- Le risorse riutilizzabili restano in `Risorse`, anche se possono essere usate in più campagne.

## Checklist Per Ogni Nuova Funzione

Prima di aggiungere una funzione, chiedi:

- Il DM capisce a cosa serve dal nome?
- Si usa dalla dashboard o da una pagina indice?
- Funziona anche se ci sono poche note?
- Non richiede spiegazioni tecniche?
- Ha uno stato chiaro?
- Appare in una vista utile?
- Crea nuove cartelle solo quando servono davvero?
- Non crea doppioni di cartelle o concetti?
- Esiste una nota di prova se la funzione cambia un template o una vista importante?
- Le note di prova sono filtrate fuori da dashboard e indici operativi?

## Cosa Evitare

- Campi obbligatori che il DM non sa compilare.
- Pagine piene di query ma senza scopo.
- Template lunghi prima che il contenuto serva davvero.
- Nomi misti italiano/inglese.
- Automatismi invisibili che sorprendono l'utente.
- Note di prova visibili nelle viste di gioco.

## Priorita Future
1. Integrazioni plugin che aiutano davvero al tavolo: [[Risorse/Integrazioni Plugin]].
2. Worldbuilding.
3. Gestione sessione.
4. Abbellire.

## Definizione Di Fatto Bene
Una modifica e riuscita quando il DM puo usarla senza chiedersi:
- dove devo cliccare?
- dove devo scrivere?
- questa cosa è canonica?
- cosa devo preparare adesso?
- cosa devo aggiornare dopo la sessione?
