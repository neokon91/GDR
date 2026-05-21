# Sviluppo Vault

Questa nota contiene convenzioni tecniche per mantenere il vault: campi, template, automazioni, plugin, controlli e release. La direzione prodotto e UX operativa attiva stanno in [[Dev/Roadmap/1.0 Professionale]].

## Documentazione

- `README.md` deve restare una guida per l'utente finale: dove cliccare, dove scrivere, come usare il vault durante preparazione e gioco.
- [[Dev/Repository]] deve restare la mappa tecnica della repo: cartelle, confini, comandi e cosa non spostare alla leggera.
- [[Risorse/Guida DM]] deve spiegare il flusso operativo senza dettagli tecnici: preparazione, gioco, Inbox Live, post-sessione e canonizzazione.
- [[Dev/Indice Connettore GPT]] deve restare un indice sintetico per code search e connettori GPT, marcato con `is_code_search_indexed: true`.
- Questa nota contiene la documentazione tecnica di sviluppo: campi, template, automazioni, test, import generati e criteri di modifica.
- [[Dev/Roadmap/1.0 Professionale]] contiene la direzione prodotto e UX operativa attiva. [[Dev/Roadmap/1.0.0]] resta fondazione storica. Se c'e conflitto, prevale la roadmap attiva.
- Le istruzioni tecniche non vanno nel README se non sono necessarie per usare il vault al tavolo.
- Il profilo regolamentare principale e D&D 5.5/SRD: i campi di creature, incontri, oggetti, ricompense, party e session prep devono restare compatibili con questo uso, mentre il Codex del mondo resta separato dal regolamento.
- La linea architetturale e vincolante: YAML dichiara contratti e profili, Jinja/TemplateFactory genera Markdown statico, JS del vault contiene runtime e automazioni. Non aggiungere logica fragile nel corpo dei template.
- [[Dev/README]] e l'indice canonico della documentazione di sviluppo: prima di creare una nuova nota tecnica, verifica se la modifica appartiene a roadmap, handoff, sviluppo, plugin layer, release o TemplateFactory.

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
- `categoria: risorsa` copre sia risorse economiche del mondo sia note di supporto del vault. I controlli distinguono i due gruppi tramite `tipo`, non tramite una nuova categoria tecnica.
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
- `progress_value`, `progress_max`, `innesco`, `posta`: alimentano clock e progress track. Usali su `categoria: tracciato` e, quando serve, sulle missioni.
- `causa`, `conseguenze`, `luoghi`, `fazioni`, `missioni`: alimentano Timeline Causale.
- `entita_impattate`, `propaga_a`, `applicata_a`, `propagato_da`, `aggiornamenti_richiesti`, `propagazione_stato`, `ultima_propagazione`: alimentano il motore di continuita. Sono il contratto YAML tra scelta dei giocatori, conseguenza, propagazione e dashboard operative.
- `vuole`, `sa`, `leva`, `segreto`, `segreti`, `indizi`, `voci`, `domande_aperte`, `tensione`, `funzione_narrativa`: campi di profondita lore. Devono restare brevi e giocabili, non saggi enciclopedici.
- `fonti`, `riferimenti_srd`, `riferimenti_regola`: usano wikilink precisi a note, sezioni o block id quando una scheda dipende da una fonte specifica.
- `sezioni_collegate`: usa solo link a sezioni, per esempio un wikilink a `Mondi/Sessioni/Nome Sessione#Apertura`.
- `blocchi_collegati` e `tabelle_collegate`: usano block id Obsidian, per esempio `[[Risorse/Tabelle/Tabelle#^complicazioni]]`.
- `tags`: opzionale e controllato. La tassonomia principale resta `categoria`, `tipo` e `stato`; i tag servono solo a marcatori trasversali semplici e italiani.

Per le note di categoria `mondo`, usa anche `tono`, `tema`, `tecnologia`, `magia`, `continenti`, `fazioni`, `religioni` e `campagne`.

Per i luoghi pronti, usa `mondo`, `luogo_padre` quando ha senso, `fazioni`, `pericolo`, `stabilita` e `pressione`. Per i PNG in gioco, usa `luogo` e almeno uno tra `fazioni` e `relazioni`.

Per i tracciati, usa `categoria: tracciato` e `tipo` tra `clock`, `progress track`, `fronte`, `rituale`, `minaccia`, `viaggio` e `progetto`. Un tracciato utile deve avere almeno un collegamento operativo tra `missioni`, `fazioni` e `luoghi`, un `innesco` chiaro e una `prossima_mossa`.

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
- per tracciati, chiedi almeno `mondo`, `missioni`, `fazioni`, `luoghi`, `progress_max`, `innesco`, `prossima_mossa`;
- i campi lore opzionali devono essere brevi: una frase per `vuole`, `sa`, `leva`, `tensione`, `segreto`, `prossima_mossa`, `scadenza_mondo`;
- non creare collegamenti reciproci modificando automaticamente note gia esistenti, a meno che l'utente lo chieda: e facile sovrascrivere lavoro manuale. Le viste Dataview devono ricostruire i backlink operativi leggendo i campi della nota nuova.

## Wikilink Granulari E Tag

Il vault deve sfruttare il frontmatter come grafo Obsidian, non solo come tabella. I link a nota intera restano il default per `connessioni`, `entita_impattate` e `propaga_a`; quando serve precisione, usare link a sezione o block id nei campi dedicati.

Regole:

- link a nota intera: wikilink a `Mondi/Luoghi/Nome Luogo`;
- link a sezione: wikilink a `Mondi/Sessioni/Nome Sessione#Apertura`;
- link a blocco: `[[Risorse/Tabelle/Tabelle#^complicazioni]]`;
- non mettere link granulari casuali in campi generici se esiste un campo dedicato;
- i tag devono essere pochi, italiani, minuscoli e dichiarati in `Dev/TemplateFactory/modules/tag_rules.yaml`;
- non usare i tag per sostituire `categoria`, `tipo`, `stato`, `fileClass` o campi wikilink.

I contratti vivono in:

- `Dev/TemplateFactory/modules/link_targets.yaml`;
- `Dev/TemplateFactory/modules/tag_rules.yaml`.

`npm run check` blocca tag non previsti e link granulari malformati nei campi dedicati.

## Cartelle Di Servizio

- `z.modelli`: template Templater. Modifica con cautela.
- `z.modelli/azioni`: template sottili usati dai pulsanti Meta Bind operativi. La logica deve stare in `z.automazioni/meta_actions.js`.
- `z.modelli/wizard`: wizard centralizzati. La logica deve stare in `z.automazioni/wizard_layer.js`.
- `z.automazioni`: script Templater usati dai template e script CLI di manutenzione. Se cambi un percorso qui, aggiorna anche dashboard e Dataview.
- `z.engine`: componenti JS riusabili per viste operative. Nuova logica complessa va qui, non copiata in blocchi DataviewJS sparsi.
- `z.bacheche`: bacheche Kanban per preparazione e creature.

## Plugin Layer Interno

Il vault usa un layer interno sopra Meta Bind, Templater, JS Engine e Metadata Menu. Non e un plugin Obsidian separato: e un contratto di file e configurazioni verificato da `npm run check`.

Componenti:

- Meta Bind Design System: input template globali in `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`.
- Meta Bind Action Library: pulsanti globali che chiamano template in `z.modelli/azioni`.
- Templater Wizard Layer: wizard in `z.modelli/wizard` e logica in `z.automazioni/wizard_layer.js`.
- JS Engine Views: componenti riusabili in `z.engine/gdr_views.js`.
- Metadata Menu/fileClass: preset field in `.obsidian/plugins/metadata-menu/data.json` e schema operativo in `z.fileclass`.

Regole:

- non mettere logica lunga dentro un pulsante Meta Bind;
- non duplicare azioni di canone, propagazione, clock o recap nei template;
- quando un campo diventa ricorrente, aggiungilo a Meta Bind input template, Metadata Menu preset e fileClass rilevanti;
- quando una vista DataviewJS supera poche righe, spostala in `z.engine`;
- ogni nuovo file essenziale del layer va aggiunto a `REQUIRED_LAYER_FILES` in `z.automazioni/check_vault.js`.

## Runtime Live E Session Context

La logica comune di runtime viene richiamata da `z.engine/session_views.js`. Il file `z.automazioni/session_context.js` resta come implementazione legacy dietro il bridge, per non rompere le funzioni esistenti durante la migrazione.

Responsabilita:

- trovare la sessione attiva tramite `attiva: true`;
- applicare fallback a sessioni `pronto` o `preparazione`;
- esporre helper DataviewJS condivisi come `escapeHtml`, `isReal`, `linkKey`, `internalLink`, `sessionCandidates` e `linkedPages`;
- ridurre duplicazione nei blocchi DataviewJS delle dashboard.

Le automazioni Templater usano invece `z.automazioni/helpers.js`. Per la creazione live sono disponibili `getActiveSessionFile()` e `getActiveSessionContext()`, usati per precompilare mondo e sessione nelle note create durante il gioco.

### Debito Runtime

`z.engine/session_views.js` e il runtime stabile da non spezzare durante M11, ma ha superato la dimensione in cui aggiungere viste senza criterio resta sostenibile.

Primo taglio eseguito:

- `z.engine/session_maps.js`: viste mappe per atlante, luoghi e sessione;
- `z.engine/session_dnd.js`: pipeline D&D 5.5 e readiness combattimenti;
- `z.engine/session_player.js`: vista giocatori, recap pubblico, mappe pubbliche e controlli anti-segreti;
- `z.engine/session_views.js`: bridge pubblico compatibile con le chiamate DataviewJS esistenti.

Prima di aggiungere nuova logica, valutare un taglio per famiglie con compatibilita esplicita:

| Famiglia | Funzioni candidate | Regola di estrazione |
| --- | --- | --- |
| Sessione | banner, ancore, materiali, live, post-sessione | Prima estrazione possibile, perche e il flusso piu stabile. |
| Player view | portale giocatori, recap, sicurezza pubblica | Estratto in `session_player.js`; mantenere identici i controlli anti-segreti. |
| Continuita | queue, propagation targets, M11 chain, closable continuity | Estrarre insieme a test M11 e azioni Meta Bind. |
| Mappe | mappe sessione, asset visuali, marker | Estratto in `session_maps.js`; mantenere bridge pubblico in `session_views.js`. |
| D&D material pipeline | incontri, creature, oggetti, ricompense, combat readiness | Estratto in `session_dnd.js`; mantenere `renderDnd55MaterialPipeline` come bridge pubblico. |

La regola di migrazione e conservativa: mantenere le funzioni esportate attuali o aggiungere bridge, aggiornare i riferimenti DataviewJS solo dopo `npm run check`, e non spostare percorsi usati da TemplateFactory, Meta Bind o release senza smoke Obsidian.

Gate temporaneo: `session_views.js` non deve crescere oltre 1600 righe prima del taglio. Se serve superare la soglia, prima creare moduli famiglia in `z.engine/` e lasciare bridge compatibili.

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
npm run check
```

Il controllo verifica JSON di configurazione, plugin obbligatori inclusi e abilitati, wikilink rotti o ambigui, percorsi `templateFile` usati dai pulsanti Meta Bind, helper Templater con script esistente in `z.automazioni`, target di Iconize, riferimenti Obsidian obsoleti, sessioni multiple attive, indice GPT, frontmatter operativo, categorie/stati/tipi ragionevoli, note live senza sessione o mondo, campi minimi per categoria, file essenziali del plugin layer interno, input template Meta Bind, button template operativi, preset Metadata Menu, igiene repository e sintassi JS in `z.automazioni` e `z.engine`. SRD e note indice sono esclusi dai controlli che produrrebbero falsi positivi.

Se `npm` non e disponibile, il comando equivalente e:

```bash
node z.automazioni/check_vault.js
node z.automazioni/repo_hygiene.js
node z.automazioni/check_js.js
```

Per rimuovere solo file locali ignorati, come `.DS_Store` o temporanei editor, usa:

```bash
npm run clean:repo
```

## Release

Per pubblicare una copia del vault:

1. aggiorna [[VERSION]];
2. aggiorna [[Dev/CHANGELOG]];
3. segui [[Dev/RELEASE]];
4. esegui `npm run check`;
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
 - Lupo
```
````

Sintassi inline utile per tabelle casuali o note rapide:

```markdown
`encounter: 3: Goblin, 1d4: Scheletro, 1: Lupo`
```

Usa il blocco `encounter` per incontri preparati; usa inline `encounter:` solo per gruppi semplici o risultati generati da Dice Roller.

### Dice Roller

Dice Roller usa codice inline `dice:` per tiri e tabelle casuali. Le tabelle casuali del vault devono avere block id stabili se vengono richiamate da altre note.

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

Meta Bind ha due ruoli separati nel vault. Gli input (`INPUT[...]`) modificano rapidamente il frontmatter nelle note già create. I pulsanti (`BUTTON[...]`) servono per navigare, creare nuove note, aprire dashboard o portare l'utente a un wikilink utile.

La logica dei pulsanti vive in `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`, dentro `buttonTemplates`. Le note devono richiamare i pulsanti per id, non duplicare blocchi `meta-bind-button` completi.

Non usare pulsanti Meta Bind per cambiare campi YAML come `stato`, `canonico`, `progress_value` o `attiva`: per quello usa input, slider, toggle e select. Gli input semplici possono restare in riga dentro backtick; gli input con funzioni Meta Bind (`optionQuery`, `useLinks`, `allowOther`, suggester) devono usare un blocco `meta-bind`. Questa forma evita errori di parsing nelle versioni del plugin che non supportano funzioni dentro input inline.

Sintassi corretta:

````markdown
`INPUT[toggle:attiva]`
`INPUT[mondo][:mondo]`
`INPUT[canonico][:canonico]`
`INPUT[stato base][:stato]`
`INPUT[text:data_mondo]`
`INPUT[inlineList:condizioni]`

```meta-bind
INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]
```
````

Pulsanti inline:

````markdown
`BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
````

Non cambiare `templateFile`, `folderPath` o il nome dei campi scritti dagli input senza aggiornare anche `z.automazioni/check_vault.js`, dashboard, template e helper Templater. Evita input Meta Bind per campi complessi dei mostri SRD se rischiano di semplificare o riscrivere il frontmatter usato da Fantasy Statblocks.

## Collaudo Senza Note Fittizie

Il vault sorgente non deve contenere note fittizie di collaudo nelle cartelle operative. Il controllo dei template passa da:

- `npm run check`, `npm run check:repo` e `npm run check:js`;
- smoke manuale delle viste principali in Obsidian;
- aggiornamento di un contenuto reale solo quando serve al tavolo.

Se una modifica richiede fixture tecniche, tienile fuori dal vault consegnabile o genera dati temporanei in una copia locale, poi rimuovili prima del check finale.

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
