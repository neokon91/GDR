<% await tp.user.crea_mito(tp) %>
# `=this.nome`

> [!infobox|mito] 📖 Mito
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(mito di origine), option(leggenda), option(diceria), option(dottrina), option(sogno profetico)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Mito
> **Cos'è** · Un racconto tramandato (vero, falso o distorto) che dà senso e mistero al mondo — distinto dall'evento, che è fatto.
> **Campi chiave** · **Tipo** (leggenda, diceria, dottrina…); sul Carattere **Veridicità** (quanto è vero) e **Vitalità** (quanto agisce ancora) ne fissano la presa al tavolo.
> **Spunti** · Chi lo racconta, e a chi conviene che ci si creda? C'è un nocciolo di verità sotto la leggenda? Cosa succede se qualcuno scopre che è falso — o che è vero?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

> [!note] Narrazione
> `INPUT[textArea:narrazione]`

> [!note] Nucleo simbolico
> `INPUT[textArea:nucleo]`

> [!note] Interpretazioni
> `INPUT[textArea:interpretazioni]`

> [!note] Nel presente
> `INPUT[textArea:presente]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

> [!abstract] Carattere
> **Veridicità** `INPUT[slider(minValue(1), maxValue(5), addLabels):veridicita]` → `VIEW[{veridicita} == 5 ? "5 · Rivelato" : ({veridicita} == 4 ? "4 · Fedele" : ({veridicita} == 3 ? "3 · Romanzato" : ({veridicita} == 2 ? "2 · Distorto" : ({veridicita} == 1 ? "1 · Invenzione" : ("—")))))]`
> **Diffusione** `INPUT[slider(minValue(1), maxValue(5), addLabels):diffusione]` → `VIEW[{diffusione} == 5 ? "5 · Universale" : ({diffusione} == 4 ? "4 · Diffuso" : ({diffusione} == 3 ? "3 · Regionale" : ({diffusione} == 2 ? "2 · Esoterico" : ({diffusione} == 1 ? "1 · Perduto" : ("—")))))]`
> **Tono** `INPUT[slider(minValue(1), maxValue(5), addLabels):tono]` → `VIEW[{tono} == 5 ? "5 · Maledetto" : ({tono} == 4 ? "4 · Cupo" : ({tono} == 3 ? "3 · Ambiguo" : ({tono} == 2 ? "2 · Edificante" : ({tono} == 1 ? "1 · Luminoso" : ("—")))))]`
> **Vitalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):vitalita]` → `VIEW[{vitalita} == 5 ? "5 · Profetico" : ({vitalita} == 4 ? "4 · Operante" : ({vitalita} == 3 ? "3 · Vivo" : ({vitalita} == 2 ? "2 · Dormiente" : ({vitalita} == 1 ? "1 · Morto" : ("—")))))]`

> [!note]- Veridicità — Quanto il mito corrisponde a fatti reali del mondo.
> **1 · Invenzione** — Pura finzione; nessun nucleo di verità.
> **2 · Distorto** — Lontano dai fatti; un seme reale gonfiato fino all'irriconoscibile.
> **3 · Romanzato** — Vero a metà; fatti reali avvolti di leggenda.
> **4 · Fedele** — Aderente ai fatti, con poche aggiunte simboliche.
> **5 · Rivelato** — Letteralmente vero; verità sacra travestita da mito.

> [!note]- Diffusione — Quanto il mito è conosciuto nel mondo.
> **1 · Perduto** — Dimenticato; lo conosce forse un solo erudite o reliquia.
> **2 · Esoterico** — Noto solo a iniziati, culti o studiosi.
> **3 · Regionale** — Diffuso in un popolo o regione.
> **4 · Diffuso** — Conosciuto da molte culture, in varianti.
> **5 · Universale** — Lo conoscono tutti; fondamento culturale condiviso.

> [!note]- Tono — L'atmosfera morale del racconto.
> **1 · Luminoso** — Eroico, consolatorio; promette salvezza.
> **2 · Edificante** — Morale ed esemplare; insegna virtù.
> **3 · Ambiguo** — Tragico o a doppio taglio; nessuna lezione netta.
> **4 · Cupo** — Ammonitore; parla di colpa, caduta, perdita.
> **5 · Maledetto** — Sinistro; raccontarlo o crederci porta sventura.

> [!note]- Vitalità — Quanto il mito agisce ancora nel presente.
> **1 · Morto** — Curiosità d'archivio; nessun effetto sul presente.
> **2 · Dormiente** — Ricordato ma inerte; nessuno ci agisce sopra.
> **3 · Vivo** — Ispira riti, nomi, usanze ancora praticate.
> **4 · Operante** — Muove fazioni e culti; orienta scelte e conflitti.
> **5 · Profetico** — Si sta avverando; il mondo si muove sul suo copione.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "mito", component);
```

--- 🔗 Collegamenti

> [!example] Relazioni
> **Epoca raccontata**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoca_raccontata]`
> **Divinità coinvolte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luogo simbolico**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Culti che lo tramandano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`

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
