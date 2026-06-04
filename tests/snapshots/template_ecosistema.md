<% await tp.user.crea_ecosistema(tp) %>
# `=this.nome`

> [!infobox|ecosistema] 🌿 Ecosistema
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(naturale), option(magico), option(sacro), option(mutato), option(instabile), option(artificiale)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Ecosistema
> **Cos'è** · L'ecosistema è la rete vivente dentro un bioma: chi mangia chi, quali cicli lo reggono e cosa lo sta spezzando.
> **Campi chiave** · **Tipo** e la relazione **Bioma**; sul Carattere **Equilibrio** (autopoietico→collassante) ne misura la stabilità — l'asse che alimenta i Fronti ecologici.
> **Spunti** · Qual è l'anello debole della catena — la specie che, se sparisce, fa crollare tutto? Cosa lo sta spezzando proprio ora, e chi se ne accorgerà per primo? Cosa accade al mondo intorno se questo equilibrio salta?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

> [!note] Composizione
> `INPUT[textArea:composizione]`

> [!note] Equilibri
> `INPUT[textArea:equilibri]`

> [!note] Cicli
> `INPUT[textArea:cicli]`

> [!note] Minacce
> `INPUT[textArea:minacce]`

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
> **Equilibrio** `INPUT[slider(minValue(1), maxValue(5), addLabels):equilibrio]` → `VIEW[{equilibrio} == 5 ? "5 · Autopoietico" : ({equilibrio} == 4 ? "4 · Stabile" : ({equilibrio} == 3 ? "3 · Teso" : ({equilibrio} == 2 ? "2 · Fragile" : ({equilibrio} == 1 ? "1 · Collassante" : ("—")))))]`
> **Diversità** `INPUT[slider(minValue(1), maxValue(5), addLabels):diversita]` → `VIEW[{diversita} == 5 ? "5 · Esuberante" : ({diversita} == 4 ? "4 · Ricco" : ({diversita} == 3 ? "3 · Vario" : ({diversita} == 2 ? "2 · Povero" : ({diversita} == 1 ? "1 · Monocultura" : ("—")))))]`
> **Naturalezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):naturalezza]` → `VIEW[{naturalezza} == 5 ? "5 · Artificiale" : ({naturalezza} == 4 ? "4 · Ingegnerizzato" : ({naturalezza} == 3 ? "3 · Gestito" : ({naturalezza} == 2 ? "2 · Influenzato" : ({naturalezza} == 1 ? "1 · Selvatico" : ("—")))))]`

> [!note]- Equilibrio — Quanto la rete di specie è stabile o sul punto di crollare.
> **1 · Collassante** — In rovina; estinzioni a catena in corso.
> **2 · Fragile** — Squilibrato; un colpo basta a romperlo.
> **3 · Teso** — Equilibrio precario, mantenuto a fatica.
> **4 · Stabile** — Robusto; assorbe gli shock e si riprende.
> **5 · Autopoietico** — Si autoregola e rigenera; quasi indistruttibile.

> [!note]- Diversità — Quanto è vario il ventaglio di specie e ruoli.
> **1 · Monocultura** — Una o due specie dominano tutto.
> **2 · Povero** — Poche specie; ruoli ecologici scoperti.
> **3 · Vario** — Discreta varietà; catene complete.
> **4 · Ricco** — Molte specie e nicchie; rete fitta.
> **5 · Esuberante** — Biodiversità estrema; ruoli ridondanti e resilienti.

> [!note]- Naturalezza — Quanto l'ecosistema è naturale o plasmato/artificiale.
> **1 · Selvatico** — Del tutto naturale; nessuna mano intelligente.
> **2 · Influenzato** — Tracce di presenza civile, ai margini.
> **3 · Gestito** — Coltivato o regolato da una civiltà.
> **4 · Ingegnerizzato** — Progettato con magia o tecnica; funzionale a uno scopo.
> **5 · Artificiale** — Interamente costruito; vive solo per intervento esterno.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "ecosistema", component);
```

--- 🕰 Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- 🔗 Collegamenti

> [!example] Relazioni
> **Bioma**: `INPUT[suggester(optionQuery("Mondi/Biomi"), useLinks(partial), allowOther):bioma]`
> **Specie coinvolte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):specie]`
> **Dove si trova**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

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
