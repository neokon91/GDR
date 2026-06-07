<% await tp.user.crea_mondo(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|mondo] 🌍 Mondo
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Genere** | `VIEW[{genere} ?? "—"]` |
> | **Temi** | `VIEW[{temi} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(mondo)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Mondo
> **Cos'è** · Il mondo è il contenitore-radice della campagna: ne fissa genere, tono e conflitto, e da qui agganci tutti i componenti (regni, culture, cosmologia…).
> **Campi chiave** · **Genere** e **Temi** danno il sapore; sul Carattere imposta **Tono** e **Diffusione della magia** — definiscono atmosfera e quanto conta l'arcano.
> **Spunti** · Qual è la tensione centrale che muove tutto? (chi vuole cosa, e perché proprio ora) Cosa rende questo mondo diverso da una terra qualunque? Genere e tono in una frase (dark fantasy di frontiera, eroico, weird…).

````tabs
--- 📖 Lore

> [!abstract] Scheda
> Genere: `INPUT[genere][:genere]`
> Temi: `INPUT[temi][:temi]`

> [!note]- Premessa
> L'idea in una frase: il pitch del mondo, cosa lo rende unico, che storie ci si giocano.

> [!quote]- Versione player-safe
> `INPUT[text(placeholder(cosa possono sapere i giocatori)):player_safe]`

> [!note] Conflitto centrale
> `INPUT[textArea:conflitto]`

> [!segreto]- Verità nascosta
> `INPUT[textArea:verita_nascosta]`


--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text(placeholder(es. il barone raddoppia le guardie)):prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti · scadenza (opz.) `INPUT[number:scadenza]` giri
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderClock");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderPressioni");
```

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Avanza / scatena
> **Pressione** = quanto scotta *adesso* (temperatura) · **Clock** = il countdown alla conseguenza. Pressione e spinte dal grafo *giustificano* di avanzare il clock; l'imminenza nei cruscotti le pesa entrambe.
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza e chiede se il fronte è *risolto* (si chiude, archiviato) o *ricorrente* (riparte, clock azzerato).

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "mondo", component);
```

> [!abstract] Carattere
> **Diffusione della Magia** `INPUT[slider(minValue(1), maxValue(5), addLabels):diffusione_magia]` → `VIEW[{diffusione_magia} == 5 ? "5 · Onnipresente" : ({diffusione_magia} == 4 ? "4 · Diffusa" : ({diffusione_magia} == 3 ? "3 · Presente" : ({diffusione_magia} == 2 ? "2 · Rara" : ({diffusione_magia} == 1 ? "1 · Assente" : ("—")))))]`
> **Tono** `INPUT[slider(minValue(1), maxValue(5), addLabels):tono]` → `VIEW[{tono} == 5 ? "5 · Grimdark" : ({tono} == 4 ? "4 · Cupo" : ({tono} == 3 ? "3 · Ambiguo" : ({tono} == 2 ? "2 · Avventuroso" : ({tono} == 1 ? "1 · Luminoso" : ("—")))))]`
> **Ordine Politico** `INPUT[slider(minValue(1), maxValue(5), addLabels):ordine_politico]` → `VIEW[{ordine_politico} == 5 ? "5 · Caos" : ({ordine_politico} == 4 ? "4 · Turbolento" : ({ordine_politico} == 3 ? "3 · Conteso" : ({ordine_politico} == 2 ? "2 · Ordinato" : ({ordine_politico} == 1 ? "1 · Stabile" : ("—")))))]`
> **Civiltà e Natura** `INPUT[slider(minValue(1), maxValue(5), addLabels):civilta_natura]` → `VIEW[{civilta_natura} == 5 ? "5 · Incontaminato" : ({civilta_natura} == 4 ? "4 · Selvaggio" : ({civilta_natura} == 3 ? "3 · In equilibrio" : ({civilta_natura} == 2 ? "2 · Coltivato" : ({civilta_natura} == 1 ? "1 · Urbanizzato" : ("—")))))]`
> **Età Storica** `INPUT[slider(minValue(1), maxValue(5), addLabels):eta_storica]` → `VIEW[{eta_storica} == 5 ? "5 · Rovina" : ({eta_storica} == 4 ? "4 · Declino" : ({eta_storica} == 3 ? "3 · Apogeo" : ({eta_storica} == 2 ? "2 · Ascesa" : ({eta_storica} == 1 ? "1 · Aurora" : ("—")))))]`

> [!note]- Diffusione della Magia — Quanto la magia è presente e accessibile nel mondo.
> **1 · Assente** — Mondo mondano; la magia è mito o non esiste affatto.
> **2 · Rara** — Esiste ma è rarissima e temuta; pochi la padroneggiano.
> **3 · Presente** — Conosciuta e usata da specialisti; parte della società.
> **4 · Diffusa** — Pervade la vita quotidiana; tecnomagia, mercati arcani.
> **5 · Onnipresente** — La realtà stessa è magia; ogni cosa ne è intrisa.

> [!note]- Tono — L'atmosfera emotiva dominante del mondo.
> **1 · Luminoso** — Eroico e speranzoso; il bene tende a trionfare.
> **2 · Avventuroso** — Pericoli e meraviglie; il coraggio paga.
> **3 · Ambiguo** — Zone grigie; scelte difficili senza risposte nette.
> **4 · Cupo** — Mondo duro; la sopravvivenza ha un prezzo, la fiducia è rara.
> **5 · Grimdark** — Disperato e spietato; la speranza è un lusso, vince chi cede meno.

> [!note]- Ordine Politico — Quanto il mondo è stabile o nel caos.
> **1 · Stabile** — Imperi saldi, pace duratura; l'ordine è la norma.
> **2 · Ordinato** — Tensioni gestite; le istituzioni reggono.
> **3 · Conteso** — Equilibri fragili; potenze rivali, conflitti latenti.
> **4 · Turbolento** — Guerre, crisi, troni vacillanti; il futuro è incerto.
> **5 · Caos** — Collasso o anarchia; nessuna autorità regge davvero.

> [!note]- Civiltà e Natura — Equilibrio tra mondo civilizzato e natura selvaggia.
> **1 · Urbanizzato** — Città ovunque; la natura è marginale o addomesticata.
> **2 · Coltivato** — Civiltà estesa con frontiere selvagge ai margini.
> **3 · In equilibrio** — Insediamenti e natura selvaggia si bilanciano.
> **4 · Selvaggio** — Natura dominante; la civiltà è isole sparse e fragili.
> **5 · Incontaminato** — Natura primordiale; la civiltà è quasi assente o perduta.

> [!note]- Età Storica — A che punto del suo arco storico si trova il mondo.
> **1 · Aurora** — Mondo giovane; popoli nascenti, terre inesplorate.
> **2 · Ascesa** — Civiltà in espansione; scoperte, conquiste, crescita.
> **3 · Apogeo** — Picco di splendore; grandi potenze al culmine.
> **4 · Declino** — Decadenza; antichi splendori che si sgretolano.
> **5 · Rovina** — Dopo un cataclisma; rovine di un'era perduta tra i sopravvissuti.

--- 🕰 Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- 🧩 Componenti

> [!tip] Un mondo è fatto dei suoi pezzi — costruiscili qui
> Non descrivere la geografia/i popoli/la magia a parole: **creali come componenti veri**.
> Nel wizard scegli **questo mondo** e si agganciano da soli al grafo.
>
> **Cosmo & sacro**: `BUTTON[crea-cosmologia]` `BUTTON[crea-sistema_magico]` `BUTTON[crea-divinita]`
>
> **Geografia & poteri**: `BUTTON[crea-regno]` `BUTTON[crea-luogo]` `BUTTON[crea-fazione]`
>
> **Popoli & tempo**: `BUTTON[crea-cultura]` `BUTTON[crea-specie]` `BUTTON[crea-epoca]`

**I componenti di questo mondo** *(si popolano man mano che li crei)*
```dataview
table rows.file.link as "Voci"
from "Mondi"
where mondo = this.file.link
group by categoria as "Tipo"
```

--- 🗺 Mappa

> [!info] Mappa
> Pesca l'**immagine** della mappa: `INPUT[mappa][:mappa]`
>
> **Origine** (URL del generatore, per rigenerarla): `INPUT[text(placeholder(incolla l’URL Watabou o Azgaar col seed)):mappa_origine]`
>
> Diventa **interattiva** sotto — zoom/pan e righello distanze→tempi (TTRPG Tools - Maps); aggiungi i **segnaposto** con *Shift+clic* e linkali ai `[[Luoghi]]` (restano salvati accanto all'immagine).
>
> **Importare da Watabou** (esporta, trascina in `Media/`, pescala sopra):
> - **Realm / Perilous Shores** (regione, continente) e **City / Village** (insediamento) → l'**SVG** è la mappa; dal **JSON** copia nome e URL (incollalo in *Origine*).
> - **One Page Dungeon** → esporta in **Markdown**: incollalo nel corpo di un `[[Luogo]]`-dungeon (descrizioni stanza-per-stanza) e usa l'**SVG/PNG** come sua mappa.
>
> **Import automatico:**
> - **Watabou** (SVG regionale coi toponimi): `BUTTON[importa-mappa]` — imposta mappa+origine e crea un `[[Luogo]]` per toponimo coi segnaposto.
> - **Azgaar** (esporta **Export → Full JSON**, trascinalo in `Media/`): `BUTTON[importa-azgaar]` — import PROFONDO: crea `[[Cultura]]`/`[[Culto]]`/`[[Regno]]`/`[[Luogo]]` (burgs+marker) collegati, e i segnaposto a coordinate-pixel. *Controlla la posizione dei pin dopo l'import.*
>
> Alternative: `BUTTON[disegna-mappa]` (Excalidraw → `![[nome]]`) · `BUTTON[inserisci-mappa]` (blocco avanzato con overlay/livelli).
>
> **Hexcrawl giocabile?** Apri **Hexmap World Creator** (griglia esagonale, contenuti per esagono, sottomappe, tiri incontri). Le cartelle sono pre-puntate alle tue note (Towns/Dungeons→`Mondi/Luoghi`, Factions→`Mondi/Fazioni`, Quests→`Mondi/Missioni`, Tables→`Mondi/Tabelle`, Regions→`Mondi/Regni`) → gli esagoni linkano il tuo grafo, una sola fonte di verità. *Al primo avvio il suo wizard propone sottocartella di default: scegli «Don't show again», oppure nello step cartelle attiva «Configure each folder path individually» e reimposta quei path.*
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMap");
```

> [!tip] World Board — il mondo a colpo d'occhio
> Genera un **Canvas** di questo mondo: una card per ogni nota, una linea per ogni relazione tipizzata. Vista visiva alternativa alla *Rete del mondo*. `BUTTON[world-board]`
> Ripremi per **aggiornarlo** dopo aver creato note o collegamenti.

> [!info] Scala e viaggio
> Scala mappa (km per unità): `INPUT[number:scala_mappa]` — km per unità di coordinata. Imposta i `coord` sui **Luoghi**: la tab *Dintorni* mostrerà le distanze in linea d'aria in km.
>
> Passo di viaggio (km/giorno): `INPUT[number:passo_viaggio]` — km al giorno a piedi (default 30): la tab *Viaggio* dei luoghi stima i tempi.
--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Cosmologia**: `INPUT[suggester(optionQuery("Mondi/Cosmologia"), useLinks(partial), allowOther):cosmologia]`
> **Sistemi magici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Regni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regni]`
> **Culture**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

> [!example] Collegamenti
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
