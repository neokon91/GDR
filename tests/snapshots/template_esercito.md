<% await tp.user.crea_esercito(tp) %>
# `=this.nome`

> [!infobox|esercito] 🪖 Esercito
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Stato / regno** | `VIEW[{regno}][text(renderMarkdown)]` |
> | **Comandante** | `VIEW[{comandante}][text(renderMarkdown)]` |
> | **Consistenza** | `VIEW[{consistenza} ?? "—"]` |
> | **Morale** | `VIEW[{morale} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(esercito regolare), option(milizia), option(mercenari), option(orda), option(flotta), option(guardia)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Esercito
> **Cos'è** · Un esercito è una forza armata organizzata: il braccio bellico di un regno o di una fazione, che può marciare come Fronte verso una battaglia o una conquista.
> **Campi chiave** · **Tipo** (forma: regolare, mercenari, flotta…) e **Comandante**; **Consistenza** e **Morale** dicono quanto è grosso e quanto regge; con un **clock** marcia verso il suo obiettivo.


````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!abstract] Scheda
> Consistenza: `INPUT[consistenza][:consistenza]`
> Morale: `INPUT[morale][:morale]`

> [!note] Composizione
> `INPUT[textArea:composizione]`

> [!note] Tattica
> `INPUT[textArea:tattica]`

> [!note] Obiettivo
> `INPUT[textArea:obiettivo_militare]`


--- 🎲 Al tavolo

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
> **Pressione** = quanto scotta *adesso* (temperatura) · **Clock** = il countdown alla conseguenza. Pressione e spinte dal grafo *giustificano* di avanzare il clock; l'imminenza nei cruscotti le pesa entrambe.
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza e chiede se il fronte è *risolto* (si chiude, archiviato) o *ricorrente* (riparte, clock azzerato).

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

> [!abstract] Carattere
> **Disciplina** `INPUT[slider(minValue(1), maxValue(5), addLabels):disciplina]` → `VIEW[{disciplina} == 5 ? "5 · Ferrea" : ({disciplina} == 4 ? "4 · Salda" : ({disciplina} == 3 ? "3 · Addestrata" : ({disciplina} == 2 ? "2 · Irregolare" : ({disciplina} == 1 ? "1 · Sbandata" : ("—")))))]`
> **Ferocia** `INPUT[slider(minValue(1), maxValue(5), addLabels):ferocia]` → `VIEW[{ferocia} == 5 ? "5 · Spietata" : ({ferocia} == 4 ? "4 · Brutale" : ({ferocia} == 3 ? "3 · Risoluta" : ({ferocia} == 2 ? "2 · Misurata" : ({ferocia} == 1 ? "1 · Cavalleresca" : ("—")))))]`
> **Lealtà** `INPUT[slider(minValue(1), maxValue(5), addLabels):lealta]` → `VIEW[{lealta} == 5 ? "5 · Fanatica" : ({lealta} == 4 ? "4 · Devota" : ({lealta} == 3 ? "3 · Affidabile" : ({lealta} == 2 ? "2 · Volubile" : ({lealta} == 1 ? "1 · Venale" : ("—")))))]`
> **Mobilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):mobilita]` → `VIEW[{mobilita} == 5 ? "5 · Fulminea" : ({mobilita} == 4 ? "4 · Rapida" : ({mobilita} == 3 ? "3 · Manovriera" : ({mobilita} == 2 ? "2 · Lenta" : ({mobilita} == 1 ? "1 · Statica" : ("—")))))]`

> [!note]- Disciplina — Coesione e tenuta degli ordini sotto pressione, dalla massa sbandata al reparto che non si rompe.
> **1 · Sbandata** — Nessun ordine: al primo urto si disperde o si dà al saccheggio. Recluta grezza, plebaglia armata.
> **2 · Irregolare** — Combatte a sprazzi; tiene se vince, fugge se perde. Bande, leve raccogliticce.
> **3 · Addestrata** — Conosce le formazioni e gli ordini; regge un combattimento normale.
> **4 · Salda** — Tiene la linea anche in difficoltà; ufficiali competenti, manovre provate.
> **5 · Ferrea** — Macchina inarrestabile: esegue sotto qualsiasi fuoco, non si sfalda. Legioni, ordini d'élite.

> [!note]- Ferocia — Come tratta nemici, prigionieri e popolazione: dal codice cavalleresco alla guerra totale.
> **1 · Cavalleresca** — Rispetta resa, prigionieri e civili; la guerra ha regole sacre.
> **2 · Misurata** — Violenza proporzionata allo scopo; eccessi puniti.
> **3 · Risoluta** — Colpisce duro per vincere, ma non infierisce per sport.
> **4 · Brutale** — Terrore come arma: razzie, rappresaglie, poca pietà per i vinti.
> **5 · Spietata** — Guerra di sterminio: nessun prigioniero, terra bruciata, il massacro è il metodo.

> [!note]- Lealtà — A chi e a cosa risponde davvero la truppa: dalla paga al fanatismo.
> **1 · Venale** — Fedele all'ultimo pagamento; cambia bandiera per più oro o se la paga salta.
> **2 · Volubile** — Lealtà fragile: diserta sotto stress, tratta col nemico se conviene.
> **3 · Affidabile** — Serve il suo signore con normale fedeltà; non tradisce senza ragione grave.
> **4 · Devota** — Legata al comandante o alla causa; sopporta privazioni e sconfitte senza cedere.
> **5 · Fanatica** — Muore senza esitare per il capo, il dio o l'ideale; nessuna corruzione la piega.

> [!note]- Mobilità — Tempo strategico della forza: dalla massa d'assedio agli incursori fulminei.
> **1 · Statica** — Lenta e pesante: assedio, difesa fissa, treno logistico enorme. Domina un punto, non manovra.
> **2 · Lenta** — Marcia pesante; colpisce dove arriva, ma arriva tardi.
> **3 · Manovriera** — Si sposta e reagisce a velocità normale di campagna.
> **4 · Rapida** — Colonne veloci, cavalleria, sorpresa: arriva dove non l'aspetti.
> **5 · Fulminea** — Razzia e sparisce: incursori, predoni a cavallo, corsari. Inafferrabile, vive di colpi di mano.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "esercito", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderProfilo");
```

> [!tip] Profilo
> Assegna i tag coerenti derivati dagli assi: `BUTTON[applica-profilo]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCoerenza");
```

--- 🔗 Collegamenti

> [!example] Relazioni
> **Stato / regno**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`
> **Comandante**: `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):comandante]`
> **Fazione**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`
> **Schierato in**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):schierato_in]`
> **Nemici in campo**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eserciti"), useLinks(partial), allowOther):nemici]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
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
