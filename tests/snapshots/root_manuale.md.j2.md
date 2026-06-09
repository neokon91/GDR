# 📖 Manuale — riferimento completo

> [!info] A cosa serve
> Il riferimento del vault: setup, plugin, mappe, statblock, sito dei giocatori, tassonomia.
> Per **iniziare** ti bastano **[[LEGGIMI]]** e **[[Home]]** — questo manuale è qui per quando
> ti serve un dettaglio. Falle una volta, poi puoi dimenticartene.

## 1. Plugin community (già inclusi)
Sono **già nel vault**: di norma basta accettare il *trust prompt* all'apertura (vedi i 3
passi del [[LEGGIMI]]). Se qualcosa non si rende, apri *Impostazioni → Plugin della comunità*,
assicurati che **Restricted mode** sia OFF e che questi siano **abilitati**:
- **Templater** (`templater-obsidian`)- **Dataview** (`dataview`)- **Meta Bind** (`obsidian-meta-bind-plugin`)- **JS Engine** (`js-engine`)- **Tab Panels** (`tab-panels`)- **Callout Manager** (`callout-manager`)- **Fantasy Statblocks** (`obsidian-5e-statblocks`)- **Metadata Menu** (`metadata-menu`)- **Iconize** (`obsidian-icon-folder`)- **Calendarium** (`calendarium`)- **Dice Roller** (`obsidian-dice-roller`)- **Tasks** (`obsidian-tasks-plugin`)- **Excalidraw** (`obsidian-excalidraw-plugin`)- **TTRPG Tools - Maps** (`zoom-map`)- **Hexmap World Creator** (`hexmaker`)- **BRAT** (`obsidian42-brat`)- **Homepage** (`homepage`)- **Initiative Tracker** (`initiative-tracker`)- **Folder Notes** (`folder-notes`)
> [!warning] Senza questi plugin
> Senza **Tab Panels** le note a schede appaiono come testo grezzo; senza
> **Fantasy Statblocks** non vedi gli statblock né il blocco `encounter`; senza
> **Meta Bind** i campi `INPUT`/`VIEW` (incluso il tab *Carattere*) restano testo grezzo;
> senza **JS Engine** il pannello *Vista* (card "pronto al tavolo?" + "Citato da") non si rende.
> **Controllo automatico**: apri **[[Diagnostica]]** — ti dice quali mancano e come riattivarli.

## 2. Impostazioni (già pronte)
La build imposta da sé le opzioni che servono — di norma **non devi toccare nulla**:
- **Fantasy Statblocks → "Parse Frontmatter in Notes"**: già ON (le note creatura e i
  mostri SRD entrano nel bestiario e sono richiamabili per nome con `monster:`/`encounter`).
- **Meta Bind → "Enable JS"**: già ON (pulsanti e viste calcolate `VIEW[...]`).
- **Templater → "Trigger Templater on new file creation"**: non serve; i bottoni `Crea`
  applicano già il template alla creazione.

Se qualcosa appare come *testo grezzo*, è quasi sempre un plugin del §1 non abilitato
(controlla *Impostazioni → Plugin della comunità*, **Restricted mode OFF**).

> [!tip] Vuoi una resa più "wiki"? Scegli un tema
> Il vault usa CSS *tema-safe* (si adatta a chiaro/scuro e a qualunque tema), ma la
> resa di tabelle, callout e tipografia dipende dal **tema di Obsidian**. Per la miglior
> resa: *Impostazioni → Aspetto → Temi → Gestisci* e prova **Minimal**, **Things** o
> **AnuPpuccin** — i `[!infobox]`, gli accenti-categoria e le dashboard "respirano" molto
> di più. Resta tutto leggibile anche col tema di default.

## 3. Come si usa
- Apri **Home.md**: bottoni `Crea` (i fondamentali; gli altri sotto *Altri tipi*) +
  cruscotti, e i collegamenti agli **Indici** (Atlante, Bestiario, Fazioni, Cast, Cronologia).
- Ogni indice esiste in due forme: la pagina `.md` (dashboard Dataview) e una vista
  **Bases** `.base` nativa accanto ad essa — usa quella che preferisci. Per filtrare **tutto**
  il mondo senza codice c'è **🔎 Esplora il mondo** (nei segnalibri).
- Le pagine di riferimento (Home + Indici) sono già nei **Bookmarks** (icona segnalibro a sinistra).
- Nelle schede PG e negli incontri il callout **Tiri** ha i `dice:` cliccabili (Dice Roller):
  d20 normale, con vantaggio e con svantaggio. Sulla **scheda PG**, inoltre, ogni
  caratteristica (Prova/TS), ogni abilità, l'iniziativa e il TS contro morte hanno un
  `dice:` 🎲 col **bonus già incluso** (legge i modificatori dalla scheda): clic = tiro pronto.
- Ogni nota lore ha il tab **Al tavolo** (uso al tavolo, gancio, pressione): è la
  superficie giocabile, il cuore del vault.
- Vuoi vedere uno **statblock 5.5e** subito? Apri un mostro SRD già pronto, es.
  **SRD/Mostri/Goblin guerriero** (Iniziativa, GS con PE+CB, azioni — entra nel bestiario).
- Per un **incontro**: *Crea → Incontro*, collega le creature (e gli eventuali **Alleati**:
  PNG/evocazioni) nel tab *Collegamenti* e premi **Aggiorna encounter** nel tab
  *Combattimento*: il blocco `encounter` si riscrive da solo (gli alleati col flag `ally`).
  Per far comparire i **PG** nel tracker, configurali una volta come **Party** nelle
  impostazioni di *Initiative Tracker* (puntandoli a `Mondi/Personaggi`).
- **Liste di consultazione** (Dice Roller): crea una nota con un **elenco** (incontri, bottino,
  meteo, voci) e richiamala dove ti serve con `dice: [[Nome della nota]]` — la mostra inline.
  Esempio già pronto (solo DM): *Incontri delle Marche*. *(Per il tiro casuale di una singola
  voce serve il formato tabella di Dice Roller — vedi la sua doc.)* I tiri `dice:` sono
  strumenti del DM: **non** finiscono nel sito dei giocatori.

## 4. Creare e collegare
- **Crea** una nota dai bottoni in Home (o nell'indice di dominio): un wizard chiede
  l'essenziale; il resto lo rifinisci nei tab con i campi `INPUT`/slider.
- **Collega** due note quando vuoi (anche dopo): nel tab *Collegamenti* premi
  **`Collega`**, scegli il tipo di relazione e la nota — scrive il link tipizzato e
  quello inverso. Il pannello *Vista* mostra anche **"Citato da"** (chi ti referenzia).
- Preferisci il pannello **Proprietà** di Obsidian? I campi sono tipizzati (Metadata
  Menu): `stato`/`tipo` sono menu a tendina, le relazioni sono link.

## 5. Linea del tempo e calendario
La pagina **[[Cronologia]]** mostra in cima una **Linea del tempo**: tutti i
tuoi **Eventi** raggruppati per **Epoca** e ordinati per data del mondo (campo `quando`),
in riquadri apribili — senza alcuna configurazione. Per far apparire un evento, basta crearlo
con un `quando` e, se vuoi, collegarlo a un'**Epoca**.

*Opzionale (Calendarium)*: se vuoi un **calendario** vero del tuo mondo, va creato una volta a
mano: *Impostazioni → Calendarium → New Calendar* (parti da un preset). Lo scan automatico degli
eventi è **già attivo**: una volta che il calendario esiste, le note con `fc-date` nel frontmatter
(o taggate `#cronologia`) vi compaiono da sole. Il calendario è per-mondo, quindi resta una tua
scelta — niente è imposto.

## 6. Immagini, ritratti e mappe — la cartella **Media**
C'è una cartella **🖼️ Media** dedicata ai tuoi file (ritratti, mappe, immagini). È anche la
**destinazione automatica degli allegati**: quando trascini un'immagine in una nota, Obsidian
la deposita in *Media* da sola — niente file sparsi. Per il **ritratto** di un personaggio/luogo
usa il campo *Ritratto* nell'infobox (sceglie tra le immagini del vault); per le **mappe** vedi
qui sotto. Puoi organizzare *Media* in sottocartelle a piacere.

Ogni **Luogo** e **Mondo** ha un tab **Mappa** già pronto. Nel campo *Mappa* colleghi:
- un **disegno Excalidraw** (disegni la mappa a mano dentro Obsidian), oppure
- un'**immagine** che hai trascinato nel vault, oppure
- un'altra **nota**.
La mappa appare subito embeddata nella scheda. Se il campo è vuoto, il tab ti spiega come
crearne una. Dentro un disegno **Excalidraw** puoi scrivere `[[Luogo]]` come **etichetta
cliccabile**: la zona sulla mappa diventa un link alla nota (con anteprima al passaggio del mouse).

**Dove agganciare cosa:** la mappa del continente/regno va sul **Mondo**; la mappa locale
(città, regione) sul **Luogo** di tipo *regione/insediamento*; la pianta di un dungeon sul
**Luogo** di tipo *dungeon/struttura*. Collega poi i punti d'interesse con i normali
`[[link]]` alle note Luogo.

*Per mappe grandi, pannabili/zoomabili con segnaposto* (plugin **TTRPG Tools - Maps**): metti
l'immagine in *Media* e usa il comando **«Insert new map…»** (o un blocco ` ```zoommap ` con
`image: Media/Mappe/continente.jpg`). Poi **Shift+clic** sulla mappa per piazzare un **segnaposto**
e collegarlo a una nota *Luogo*: avrà l'anteprima al passaggio del mouse. Il **righello** misura
distanze e **tempi di viaggio** sulla scala che imposti.

*Importare mappe da Azgaar o Watabou*: esporta la mappa come **immagine** (PNG hi-res o SVG) e
trascinala in *Media* — poi usala come `image:` nel blocco `zoommap`. Per le mappe-mondo grandi,
l'**SVG** è il formato migliore (TTRPG Tools - Maps lo rasterizza in WebP fino a 8k/12k); per Azgaar,
in alternativa, l'export *"tiles"* (.zip di chunk PNG). I **segnaposto** però si mettono **a mano**
(il plugin non importa i dati/pin del generatore): pianti i pin sulle città e li colleghi ai tuoi
*Luoghi* — così la mappa di Azgaar diventa il tuo atlante navigabile.

*Hexcrawl giocabile — a esagoni* (plugin **Hexmap World Creator**): per l'esplorazione
dell'**oltremondo** su griglia esagonale (contenuti per esagono, terreni, tabelle d'incontro coi
tiri). Aprilo dalla barra laterale (icona esagono) o col comando **«Hexmap World Creator: Open»**.
Le sue cartelle sono **già puntate alle tue entità**: gli esagoni-città e i punti d'interesse
linkano i tuoi *Luoghi*, le fazioni i *Fazioni*, le quest i *Missioni*, le regioni i *Regni*, le
tabelle casuali i *Tabelle* — e le note-esagono finiscono in *Mondi/Esagoni*. Così l'hexcrawl
**non crea un archivio parallelo**: pesca e scrive nel tuo grafo di mondo (una sola fonte di
verità). *Al primo avvio del suo wizard scegli «Don't show again».* È **complementare** alle mappe
disegnate/zoomabili: usa gli esagoni per il viaggio overland, le mappe-immagine per le piante
locali (città, dungeon). Il plugin è opzionale: senza, le note-Luogo restano comunque navigabili.

## 7. Callout GDR (Callout Manager)
I callout **Uso al tavolo**, **Gancio** e **Segreto** hanno colore/icona propri
(iniettati in Callout Manager). Se preferisci aspetti diversi: *Impostazioni →
Callout Manager*. Senza il plugin restano callout normali, leggibili lo stesso.

## 8. SRD ufficiale (5.2.1, italiano)
La cartella **`SRD/`** contiene il riferimento ufficiale 5.5e **in italiano** (incantesimi,
oggetti magici, talenti, specie, background, condizioni, glossario, regole, classi, **mostri**),
sotto licenza CC-BY-4.0 (vedi `SRD/LICENZA.md`, traduzione *massimobarbieri/DND-SRD-IT*).
**Sola lettura**: si rigenera a ogni build, non modificarla — il tuo homebrew va in `Mondi/`.
Parti da **`SRD/Indice.md`** (anche nei segnalibri). I **mostri** sono statblock già pronti:
con "Parse Frontmatter in Notes" ON entrano nel bestiario di **Fantasy Statblocks** e li
richiami con `monster: Nome` in qualunque incontro.

## 9. Statblock: 5.5e (2024) e 5e
Gli statblock usano di default `D&D 5.5 Layout ITA - Compatibile 5e`, una resa **fedele al 2024**:
mostra Iniziativa, la griglia caratteristiche, GS con **PE e bonus di competenza**, tiri
salvezza/abilità, equipaggiamento, azioni bonus/reazioni/leggendarie. I mostri SRD sono già
mappati su tutti questi campi.

Nel template **Creatura** trovi **due tab**: *Statblock 5.5e* (dove inserisci i numeri) e
*Statblock 5e* (la **stessa** creatura resa in stile classico `Basic 5e Layout ITA`,
via `monster:` — non riscrivi nulla). Per cambiare lo stile di un singolo blocco, modifica la
riga `layout:`. Entrambi i layout IT sono vendorizzati e installati in Fantasy Statblocks.

## 10. Radar degli assi + confronto fra entità (JS Engine)
Nel tab **Carattere** (entità con ≥3 assi) gli slider sono affiancati da un **radar**
che disegna gli assi tematici della nota corrente (richiede **JS Engine**).

Per **confrontare più entità** sullo stesso radar, incolla questo blocco in una nota
qualunque e aggiungi nel suo frontmatter `confronta: [[Entità A]], [[Entità B]]`
(stessa categoria — gli assi devono combaciare):

````
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderAxesCompare");
```
````

La logica vive in `z.automazioni/views.js` (radar SVG, niente plugin grafici), caricata
dal guscio unico `z.automazioni/boot.mjs`: se le aggiorni, tutti i blocchi si aggiornano
senza ricreare le note.

## 11. Tassonomia: quale categoria quando
Le categorie sono stratificate dal metafisico al tavolo. Quando non sei sicuro su quale
usare, queste sono le distinzioni che contano:

**Strato cosmico (il "perché" del mondo)**
- **Cosmologia** — il quadro d'insieme/concetto cosmico generale (usala come panoramica).
- **Legge fondamentale** — un principio-polarità che regola la realtà (Vita↔Morte, Forma↔Distorsione).
- **Dominio** — una sfera ontologica che *connette* leggi, magie, entità e piani (il nodo-hub).
- **Entità primordiale** — un essere *pre-divino* che incarna una legge; le divinità ne discendono.
- **Divinità** — un'entità *venerata*, attiva nel culto (distinta dalla primordiale, che è cosmica).
- **Piano** — un livello di realtà con proprie leggi e abitanti (≠ Luogo, che è nel mondo materiale).
- **Sistema magico** — *come* funziona la magia (fonte/metodo/costo); ≠ Incantesimo (l'effetto singolo).
- **Mito** / **Profezia** — un racconto/leggenda · un presagio con condizioni d'avveramento.

**Strato sociopolitico (chi comanda / chi si aggrega)** — il cluster più confondibile:
- **Cultura** — un popolo e i suoi valori/lingua/riti (l'identità condivisa, non l'organizzazione).
- **Regno** — un'entità *politica con territorio e sovranità* (sopra le fazioni).
- **Fazione** — un *gruppo d'interesse* con un'agenda (gilda, casata, cospirazione, esercito).
- **Istituzione** — un *corpo formale* duraturo (accademia, ordine, corte, tribunale).
- **Culto** — una *religione organizzata* (clero, dottrina, riti); venera una o più Divinità.

**Altri confini utili**
- **Luogo** è il centro di gravità: quasi tutto vi si collega. Un **Piano** non è un Luogo.
- **Creatura** = essere del mondo (lore + statblock); **Specie** = ascendenza/razza (sistema 5.5e).
- **Evento** accade nel tempo (legalo a un'**Epoca**); diventando leggenda genera un **Mito**.

Tutte le categorie hanno il tab *Collegamenti* con relazioni *tipizzate*: usalo per
intrecciarle (es. un Regno → le sue Istituzioni e Fazioni; una Divinità → i suoi Culti).

## 12. Condividere col gruppo — il sito dei giocatori
Genera un **sito statico, in sola lettura e senza spoiler** da dare ai giocatori:
```
npm run site                      # solo ciò che è noto da subito
npm run site -- --reveal incontrato   # + ciò che i PG hanno scoperto
npm run site -- --reveal segreto      # + i colpi di scena già svelati
```
Il sito esce in `dist/GDR-site/` (apri `index.html` o pubblica la cartella). Restano
**sempre fuori**: le note `visibilita: dm`, gli strumenti del DM (incontri, tiri `dice:`)
e i callout *Segreto*.

**Rivelazione progressiva** — ogni nota ha, nel tab *Al tavolo*, un selettore 👁 *Condivisione*:
- **pubblico** — noto ai personaggi da subito (default);
- **incontrato** — compare quando i PG lo scoprono;
- **segreto** — un colpo di scena, da svelare al momento giusto.

Costruisci il sito al **livello a cui è arrivata la campagna** (`--reveal`): una nota entra
nel portale solo se il suo tier è ≤ il livello scelto. Man mano che i giocatori scoprono il
mondo, alzi il livello e rigeneri. Per non condividere **mai** una nota (appunti, meta),
usa `visibilita: dm`.

**Rivelazione per-sezione** — vuoi una nota *pubblica* con dentro una verità nascosta? Scrivi
nel corpo un callout `> [!rivela|<tier>] Titolo`: compare nel portale solo a quel livello.
```
> [!rivela|segreto] Cosa c'è davvero sotto la rocca
> Una cripta sigillata, e ciò che vi dorme conosce il tuo nome.
```
Così una nota pubblica (es. un forte che i giocatori conoscono) può comunque nascondere una
sezione — «cosa dorme sotto le cantine» — svelata solo a `--reveal segreto`.

**Anteprima** — la dashboard **[[Occhi del giocatore]]** (in Home) ti mostra, dentro Obsidian,
cosa vedono i giocatori a ogni livello, senza dover generare il sito.
