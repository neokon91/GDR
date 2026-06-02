<% await tp.user.crea_mondo(tp) %>
# `=this.nome`

> [!infobox] 🌍 Mondo
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Scala** | `VIEW[{scala} ?? "—"]` |
> | **Genere** | `VIEW[{genere} ?? "—"]` |
> | **Epoca** | `VIEW[{epoca} ?? "—"]` |
> | **Temi** | `VIEW[{temi} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Lore

> [!abstract] Scheda
> Scala: `INPUT[scala][:scala]`
> Genere: `INPUT[genere][:genere]`
> Epoca: `INPUT[text:epoca]`
> Temi: `INPUT[temi][:temi]`

> [!note]- Premessa
> L'idea in una frase: il pitch del mondo, cosa lo rende unico, che storie ci si giocano.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Tono
> `INPUT[textArea:tono]`

> [!note] Conflitto centrale
> `INPUT[textArea:conflitto]`

> [!note] Geografia
> `INPUT[textArea:geografia]`

> [!note] Popoli
> `INPUT[textArea:popoli]`

> [!note] Magia
> `INPUT[textArea:magia]`

> [!note] Poteri
> `INPUT[textArea:poteri]`

> [!note] Storia
> `INPUT[textArea:storia]`

> [!segreto]- Verità nascosta
> `INPUT[textArea:verita_nascosta]`


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti
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
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
--- Carattere

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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "mondo", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCoerenza");
```

--- Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- Mappa

> [!info] Mappa
> Collega una mappa: `INPUT[mappa][:mappa]`
>
> Disegnala con **Excalidraw** (scrivi `[[Luogo]]` per zone cliccabili), oppure usa **TTRPG Tools - Maps** (comando «Insert new map…») per una mappa con **segnaposto** collegati alle note, o trascina un'immagine nel vault e collegala qui.
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMap");
```

> [!info] Scala e viaggio
> Scala mappa (km per unità): `INPUT[number:scala_mappa]` — km per unità di coordinata. Imposta i `coord` sui **Luoghi**: la tab *Dintorni* mostrerà le distanze in linea d'aria in km.
>
> Passo di viaggio (km/giorno): `INPUT[number:passo_viaggio]` — km al giorno a piedi (default 30): la tab *Viaggio* dei luoghi stima i tempi.
--- Collegamenti

> [!example] Relazioni
> **Cosmologia**: `INPUT[suggester(optionQuery("Mondi/Cosmologia"), useLinks(partial), allowOther):cosmologia]`
> **Sistemi magici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Regni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regni]`
> **Culture**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

> [!example] Collegamenti
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
