<% await tp.user.crea_luogo(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|luogo] 🗺️ Luogo
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Regione** | `VIEW[{regione}][link]` |
> | **Controllata da** | `VIEW[{controllata_da}][link]` |
> | **Clima** | `INPUT[clima][:clima]` |
> | **Popolazione** | `INPUT[text(placeholder(es. 5.000 o «poche centinaia»)):popolazione]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(insediamento), option(sito di interesse), option(struttura), option(dungeon), option(rovina), option(landmark naturale), option(regione), option(continente)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(mondano), option(santuario), option(confine), option(selvaggio), option(onirico), option(interdimensionale), option(simbolico)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **mondano** — Luogo ordinario del mondo materiale: abitato, coltivato o di passaggio, senza carica metafisica particolare.
> **santuario** — Spazio con forte carica spirituale, usato per riti, culti o contatto con entità superiori.
> **confine** — Punto di transizione tra realtà, epoche o stati dell'essere: soglia, varco, non-luogo.
> **selvaggio** — Spazio non civilizzato, primordiale, vivo: natura pura o ambiente magico incontaminato.
> **onirico** — Luogo tra sogno, memoria e inconscio: sognato, astrale o condiviso psichicamente.
> **interdimensionale** — Nodo tra piani, crocevia metafisico o intersezione ontologica; instabile o multistrato.
> **simbolico** — Non ha senso fisico: rappresenta concetti, leggi o archetipi. Esiste per significato.

> [!info]- ℹ️ Guida — Luogo
> **Cos'è** · Un luogo è dove succede qualcosa: lo collochi nel mondo, lo leghi a chi lo controlla e ai luoghi confinanti, e gli dai una tensione presente.
> **Campi chiave** · **Tipo** (forma) e **Mondo** per primi; poi **Controllata da** e **Confina con** per inserirlo nel grafo; **Clima**/**Popolazione** per il colore.
> **Spunti** · Cosa c'è di sbagliato o di teso qui, proprio adesso? Chi lo controlla — e chi vorrebbe strapparglielo? Cosa sta per succedere? (la pressione, la prossima mossa)

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

> [!tip]- Genera nome/spunto
> `BUTTON[genera-locale]` (italiano, a tema) — scegli **cosa generare**: nomi (persona/luogo/fazione), PNG, taverne, bevande, ganci, dicerie, tesori (SRD), insediamenti, oggetti, meteo, stanze di dungeon… — dallo *stile* della cultura/specie collegata. Inserisce al cursore.

> [!note]- Colpo d'occhio
> Cos'è il luogo, che impressione dà entrandoci, perché conta nella storia.

> [!quote]- Versione player-safe
> `INPUT[text(placeholder(cosa possono sapere i giocatori)):player_safe]`

%%prosa%%
## Geografia
> [!question]- 💡 Geografia: dov'e', com'e' fatto, cosa lo circonda

## Funzione
> [!question]- 💡 Cos'e' / a cosa serve, perche' importa

## Atmosfera
> [!question]- 💡 Atmosfera: cosa si vede, sente, odora

## Abitanti
> [!question]- 💡 Chi o cosa lo abita (popolo, fazioni, creature)

## Storia
> [!question]- 💡 Cosa è successo qui (passato che pesa)

## Tensione
> [!question]- 💡 Tensione o pericolo presente

> [!rivela|segreto]- Segreto
> 💡 *Segreto del luogo*
>

%%/prosa%%

--- 🧭 Spazio

> [!info] Mappa
> **1.** Pesca l'**immagine**: `INPUT[mappa][:mappa]` — compare interattiva qui sotto (zoom/pan, righello distanze→tempi).
> **2.** Aggiungi i **segnaposto** con *Shift+clic* e linkali ai `[[Luoghi]]` (restano salvati accanto all'immagine).
>
> *Quale formato? **SVG** (Watabou/Azgaar) = resta nitido a ogni zoom **e** crea i pin dai nomi sulla carta. **PNG/JPG** = solo l'immagine, pin a mano (nessun nome da leggere). Con **Azgaar** i pin arrivano dal Full JSON, qualunque sia l'immagine.*

> [!tip]- 📥 Importa da un generatore — crea Luoghi e pin da solo
> Esporta dal generatore, trascina in `Media/`, poi:
> - **Watabou** (Realm/Perilous Shores, City, Village → **SVG**): `BUTTON[importa-mappa]` — imposta mappa+origine e crea un `[[Luogo]]` per ogni toponimo, coi segnaposto.
> - **Azgaar** (Export → **Full JSON**): `BUTTON[importa-azgaar]` — import PROFONDO: `[[Cultura]]`/`[[Culto]]`/`[[Regno]]`/`[[Luogo]]` (burgs+marker) collegati + pin a coordinate. *Controlla la posizione dei pin dopo.*
> - **One Page Dungeon** → esporta in **Markdown** e incollalo nel corpo di un `[[Luogo]]`-dungeon; usa l'SVG/PNG come sua mappa.

> [!tip]- 🧭 Pin a mano, disegno e hexcrawl
> - **Immagine caricata da te:** piazza i pin (*Shift+clic*), linkali ai `[[Luoghi]]`, poi `BUTTON[sincronizza-pin]` riscrive le **coordinate** delle note dai pin → distanze in linea d'aria e *Dintorni* si calcolano da sé.
> - **Disegna tu:** `BUTTON[disegna-mappa]` (Excalidraw → `![[nome]]`) · `BUTTON[inserisci-mappa]` (blocco avanzato con livelli/overlay).
> - **Hexcrawl giocabile:** apri **Hexmap World Creator** (griglia esagonale, contenuti per esagono, tiri incontri). Le cartelle sono già puntate alle tue note (Towns/Dungeons→`Mondi/Luoghi`, Factions→`Mondi/Fazioni`, Quests→`Mondi/Missioni`, Regions→`Mondi/Regni`). *Al 1° avvio del suo wizard scegli «Don't show again».*
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMap");
```

> [!info] Posizione
> Coordinate sulla mappa: `INPUT[text:coord]` — `x, y` (per la distanza in linea d'aria; la scala è sul **Mondo**).

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderDintorni");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderViaggio");
```
--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Regione**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regione]`
> **Controllata da**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`
> **Figure**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Bioma**: `INPUT[suggester(optionQuery("Mondi/Biomi"), useLinks(partial), allowOther):bioma]`
> **Cultura dominante**: `INPUT[suggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):cultura]`
> **Piano**: `INPUT[suggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piano]`
> **Confina con**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):confina_con]`
> **Produce**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):produce]`
> **Dipende da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):dipende_da]`
> **Rotta commerciale con**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):rotta_con]`
> **Editti in vigore**: `INPUT[inlineListSuggester(optionQuery("Mondi/Editti"), useLinks(partial), allowOther):editti]`
> **Miti del luogo**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):miti]`
> **Incontri qui**: `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial), allowOther):incontri]`
> **Insidie qui**: `INPUT[inlineListSuggester(optionQuery("Mondi/Insidie"), useLinks(partial), allowOther):insidie]`
> **Ecosistemi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Ecosistemi"), useLinks(partial), allowOther):ecosistemi]`
> **Rotte che vi passano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Rotte"), useLinks(partial), allowOther):rotte]`
> **Calamità in corso**: `INPUT[inlineListSuggester(optionQuery("Mondi/Calamita"), useLinks(partial), allowOther):calamita]`
> **Conteso da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):conteso_da]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
````

> [!tip] ＋ Componenti
> Aggiungi ciò che ti serve, quando ti serve — **Al tavolo**, **Clock del fronte**, **Carattere**, **Cronologia**, **Vista**…
> `BUTTON[aggiungi-componente]`
>
> `BUTTON[marca-canonico]` · `BUTTON[archivia-nota]`
