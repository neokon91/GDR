# 👋 Benvenuto — il tuo mondo e il tuo tavolo

Questo è il tuo **vault di gioco di ruolo**: un posto solo per *costruire un mondo*
(luoghi, popoli, divinità, segreti) e *giocarci* a D&D 5.5e (personaggi, incontri,
dadi, regole). Non serve essere tecnici: si lavora a **bottoni** e **menù**.

> [!tip] Le tue cose sono al sicuro
> Tutto quello che crei vive nella cartella **`Mondi/`** ed è **tuo**: non viene mai
> sovrascritto. La cartella **`SRD/`** sono le regole ufficiali (sola lettura). Le
> cartelle che iniziano con `z.` sono "il motore": puoi ignorarle.

## ▶️ Per iniziare in 3 passi
1. **Apri questo vault in Obsidian** (*Apri cartella come vault*). La prima volta
   Obsidian chiede di **fidarti dell'autore e abilitare i plugin**: clicca
   **«Trust author and enable plugins»**. I plugin sono già inclusi nel vault — non
   devi installare niente. *(Se una scheda appare come testo grezzo: §1 qui sotto.)*
2. **Apri `Home`**: è la tua plancia. Da lì crei tutto e raggiungi gli indici.
3. **Crea il tuo primo mondo**: in Home premi **Crea → Mondo**, rispondi a poche
   domande e parti. Poi popolalo (luoghi, personaggi, fazioni…) sempre da Home.

## 🧭 Come si usa, in breve
- **Creare**: ogni bottone **Crea** apre un *aiutante* che ti fa qualche domanda (il
  minimo necessario); il resto lo scrivi con calma nella nota, nei campi e negli slider.
- **Collegare**: nel tab *Collegamenti* di una nota premi **Collega**, scegli il tipo
  di legame e l'altra nota: il collegamento si scrive nei due sensi, da solo.
- **Il "carattere" delle cose** (tab *Carattere*): gli **slider** descrivono l'indole
  (es. un culto più *dogmatico* o più *anarchico*). Sotto, il **Profilo** ti suggerisce
  etichette coerenti (es. *Teocrazia di stato*) e il bottone **Applica profilo** le salva
  come tag. Quando crei, puoi anche partire da un **archetipo** già pronto.
- **Un personaggio giocante**: **Crea → PG**, scegli classe/specie/background e
  l'aiutante riempie la scheda (punti ferita, tiri salvezza, abilità, incantesimi).
- **Mappe e linea del tempo**: ogni *Luogo* e *Mondo* ha un tab **Mappa** — colleghi un
  disegno o un'immagine e la vedi dentro la nota. La pagina **Cronologia** mostra i tuoi
  **eventi su una linea del tempo**, raggruppati per epoca e ordinati nel tempo.
- **Al tavolo**: in Home c'è il riquadro *Al tavolo*; ogni incontro ha i tiri di dado
  cliccabili e il combattimento con l'iniziativa. Nel tab *Combattimento* il bottone
  **Aggiorna encounter** riempie la lista delle creature dalle note che hai collegato.
- **Fili narrativi**: scrivi in qualunque nota un promemoria con `- [ ] …` e un tag:
  `#gancio` (da seminare) o `#trama` (filo aperto). Compaiono in Home → *Al tavolo* →
  **🧵 Fili narrativi**. Nel template *Sessione* trovi una **checklist di prep** già pronta.
- **Dove trovo le cose**: **Home** (plancia), **Indici** (Atlante/Bestiario/Cast/…),
  **Ponte Mondo↔Sistema** (cosa del mondo ha già statistiche di gioco), **SRD** (regole
  ufficiali). Sono tutte nei segnalibri, a sinistra. **Clicca una cartella** (es. *Divinità*)
  per aprire il suo **indice** automatico di tutte le voci di quella categoria.

> [!question]- Ho sbagliato qualcosa, si rompe?
> No. Le note sono testo semplice: puoi modificarle o cancellarle liberamente. Se una
> scheda sembra "testo grezzo", quasi sempre manca un plugin del *Setup iniziale*.

---
## 🔧 Setup iniziale (una volta sola)
Le sezioni numerate qui sotto servono a preparare il vault la prima volta e come
riferimento. Falle una volta, poi puoi dimenticartene.

## 1. Plugin community (già inclusi)
Sono **già nel vault**: di norma basta accettare il *trust prompt* all'apertura (vedi i 3
passi). Se qualcosa non si rende, apri *Impostazioni → Plugin della comunità*, assicurati
che **Restricted mode** sia OFF e che questi siano **abilitati**:
- **Templater** (`templater-obsidian`)- **Dataview** (`dataview`)- **Meta Bind** (`obsidian-meta-bind-plugin`)- **JS Engine** (`js-engine`)- **Tab Panels** (`tab-panels`)- **Callout Manager** (`callout-manager`)- **Fantasy Statblocks** (`obsidian-5e-statblocks`)- **Metadata Menu** (`metadata-menu`)- **Iconize** (`obsidian-icon-folder`)- **Calendarium** (`calendarium`)- **Dice Roller** (`obsidian-dice-roller`)- **Tasks** (`obsidian-tasks-plugin`)- **Excalidraw** (`obsidian-excalidraw-plugin`)- **Zoom Map** (`zoom-map`)- **Fantasy Content Generator** (`fantasy-content-generator`)- **BRAT** (`obsidian42-brat`)- **Homepage** (`homepage`)- **Initiative Tracker** (`initiative-tracker`)- **Folder Notes** (`folder-notes`)
> [!warning] Senza questi plugin
> Senza **Tab Panels** le note a schede appaiono come testo grezzo; senza
> **Fantasy Statblocks** non vedi gli statblock né il blocco `encounter`; senza
> **Meta Bind** i campi `INPUT`/`VIEW` (incluso il tab *Carattere*) restano testo grezzo;
> senza **JS Engine** il pannello *Vista* (card "pronto al tavolo?" + "Citato da") non si rende.

## 2. Impostazioni da abilitare una volta
- **Fantasy Statblocks → "Parse Frontmatter in Notes"**: ON. Serve perché le note
  creatura (`statblock: inline`) entrino nel bestiario e siano richiamabili per nome
  nel blocco `encounter` degli incontri.
- **Meta Bind → "Enable JS"**: ON (lo imposta la build). Necessario per i pulsanti e le
  viste calcolate (`VIEW[...]`).
- **Templater → "Trigger Templater on new file creation"**: opzionale; i bottoni `Crea`
  applicano già il template alla creazione.

## 3. Come si usa
- Apri **Home.md**: bottoni `Crea` (i fondamentali; gli altri sotto *Altri tipi*) +
  cruscotti, e i collegamenti agli **Indici** (Atlante, Bestiario, Fazioni, Cast, Cronologia).
- Ogni indice esiste in due forme: la pagina `.md` (dashboard Dataview) e una vista
  **Bases** `.base` nativa accanto ad essa — usa quella che preferisci.
- Le pagine di riferimento (Home + Indici) sono già nei **Bookmarks** (icona segnalibro a sinistra).
- Nelle schede PG e negli incontri il callout **Tiri** ha i `dice:` cliccabili (Dice Roller):
  d20 normale, con vantaggio e con svantaggio.
- Ogni nota lore ha il tab **Al tavolo** (uso al tavolo, gancio, pressione): è la
  superficie giocabile, il cuore del vault.
- Apri **Mondi/Creature/Goblin**: esempio di statblock 5.5e (entra nel bestiario).
- Apri **Mondi/Incontri/Imboscata sulla Strada**: il tab *Combattimento* usa il blocco
  `encounter` che raggruppa le creature per nome dal bestiario. Collega le creature (tab
  *Collegamenti*) e premi **Aggiorna encounter**: il blocco si riscrive da solo.

## 4. Creare e collegare
- **Crea** una nota dai bottoni in Home (o nell'indice di dominio): un wizard chiede
  l'essenziale; il resto lo rifinisci nei tab con i campi `INPUT`/slider.
- **Collega** due note quando vuoi (anche dopo): nel tab *Collegamenti* premi
  **`Collega`**, scegli il tipo di relazione e la nota — scrive il link tipizzato e
  quello inverso. Il pannello *Vista* mostra anche **"Citato da"** (chi ti referenzia).
- Preferisci il pannello **Proprietà** di Obsidian? I campi sono tipizzati (Metadata
  Menu): `stato`/`tipo` sono menu a tendina, le relazioni sono link.

## 5. Linea del tempo e calendario
La pagina **Cronologia** (nei segnalibri) mostra in cima una **Linea del tempo**: tutti i
tuoi **Eventi** raggruppati per **Epoca** e ordinati per data del mondo (campo `quando`),
in riquadri apribili — senza alcuna configurazione. Per far apparire un evento, basta crearlo
con un `quando` e, se vuoi, collegarlo a un'**Epoca**.

*Opzionale (Calendarium)*: se vuoi un **calendario** vero del tuo mondo, va creato una volta a
mano: *Impostazioni → Calendarium → New Calendar* (parti da un preset). Lo scan automatico degli
eventi è **già attivo**: una volta che il calendario esiste, le note con `fc-date` nel frontmatter
(o taggate `#cronologia`) vi compaiono da sole. Il calendario è per-mondo, quindi resta una tua
scelta — niente è imposto.

## 6. Mappe
Ogni **Luogo** e **Mondo** ha un tab **Mappa** già pronto. Nel campo *Mappa* colleghi:
- un **disegno Excalidraw** (disegni la mappa a mano dentro Obsidian), oppure
- un'**immagine** che hai trascinato nel vault, oppure
- un'altra **nota**.
La mappa appare subito embeddata nella scheda. Se il campo è vuoto, il tab ti spiega come
crearne una.

**Dove agganciare cosa:** la mappa del continente/regno va sul **Mondo**; la mappa locale
(città, regione) sul **Luogo** di tipo *regione/insediamento*; la pianta di un dungeon sul
**Luogo** di tipo *dungeon/struttura*. Collega poi i punti d'interesse con i normali
`[[link]]` alle note Luogo.

*Per mappe molto grandi, pannabili/zoomabili* (Zoom Map): metti l'immagine nel vault e usa un
blocco `zoommap` con `imageBases: [{ path: Mappe/continente.png }]`.

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

## 9. Layout statblock (2024)
Di default gli statblock usano `D&D 5.5 Layout ITA - Compatibile 5e`. La build installa anche
un layout **"GDR — 5.5e (2024)"** in Fantasy Statblocks (non attivo, per sicurezza).
Per provarlo: *Impostazioni → Fantasy Statblocks → Layouts* e selezionalo come predefinito.
Se ti convince, dimmelo e lo imposto di default nella pipeline (`statblock.layout` in
`Dev/Source/YAML/core.yaml`).

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
