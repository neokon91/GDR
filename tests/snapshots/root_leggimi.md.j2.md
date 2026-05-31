# LEGGIMI — Vault GDR

Questa cartella è un vault Obsidian **generato**: aprila in Obsidian e tienila aperta;
rilancia `npm run build` nel repo per vedere i cambiamenti dal vivo. Le tue note in
`Mondi/`, `Inbox/`, ecc. e i plugin che installi qui **non vengono toccati** dai rebuild.

## 1. Plugin community richiesti
Apri *Impostazioni → Plugin della comunità* e installa/abilita:
- **Templater** (`templater-obsidian`)- **Dataview** (`dataview`)- **Meta Bind** (`obsidian-meta-bind-plugin`)- **JS Engine** (`js-engine`)- **Tab Panels** (`tab-panels`)- **Callout Manager** (`callout-manager`)- **Fantasy Statblocks** (`obsidian-5e-statblocks`)- **Metadata Menu** (`metadata-menu`)- **Iconize** (`obsidian-icon-folder`)- **Calendarium** (`calendarium`)- **Dice Roller** (`obsidian-dice-roller`)- **Tasks** (`obsidian-tasks-plugin`)- **Excalidraw** (`obsidian-excalidraw-plugin`)- **Zoom Map** (`zoom-map`)- **Fantasy Content Generator** (`fantasy-content-generator`)- **BRAT** (`obsidian42-brat`)- **Homepage** (`homepage`)- **Initiative Tracker** (`initiative-tracker`)
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
  `encounter` che raggruppa le creature per nome dal bestiario.

## 4. Creare e collegare
- **Crea** una nota dai bottoni in Home (o nell'indice di dominio): un wizard chiede
  l'essenziale; il resto lo rifinisci nei tab con i campi `INPUT`/slider.
- **Collega** due note quando vuoi (anche dopo): nel tab *Collegamenti* premi
  **`Collega`**, scegli il tipo di relazione e la nota — scrive il link tipizzato e
  quello inverso. Il pannello *Vista* mostra anche **"Citato da"** (chi ti referenzia).
- Preferisci il pannello **Proprietà** di Obsidian? I campi sono tipizzati (Metadata
  Menu): `stato`/`tipo` sono menu a tendina, le relazioni sono link.

## 5. Calendario in-game (Calendarium) — opzionale
Il calendario è specifico del tuo mondo, quindi va creato una volta a mano:
*Impostazioni → Calendarium → New Calendar* (parti da un preset o creane uno).
Poi gli **Eventi** (campo `quando`) e le **Sessioni** (`data`) possono essere mostrati
sul calendario aggiungendo `fc-date`. Intanto la pagina **Cronologia** ordina già gli
eventi per `quando`, senza configurazione.

## 6. Mappe (Zoom Map)
Per mappe grandi pannabili/zoomabili:
1. Metti l'immagine nel vault (es. una cartella `Mappe/` o tra gli allegati).
2. Nella nota, aggiungi un blocco:
   ````
   ```zoommap
   imageBases:
     - path: Mappe/continente.png
   ```
   ````
**Dove agganciare cosa:** la mappa del continente/regno va sul **Mondo**; la mappa
locale (città, regione) sul **Luogo** di tipo *regione/insediamento*; la pianta di un
dungeon sul **Luogo** di tipo *dungeon/struttura*. Collega poi i punti d'interesse con
i normali `[[link]]` alle note Luogo.

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
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesCompare(container, app, dv, page);
```
````

La logica vive in `z.automazioni/views.js` (radar SVG, niente plugin grafici): se la
aggiorni, tutti i blocchi si aggiornano senza ricreare le note.

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
