<% await tp.user.crea_ecosistema(tp) %>
# `=this.nome`

> [!info] Ecosistema
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore


> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

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


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Carattere

> [!abstract] Carattere
> **Equilibrio** `INPUT[slider(minValue(1), maxValue(5), addLabels):equilibrio]`
> **Diversità** `INPUT[slider(minValue(1), maxValue(5), addLabels):diversita]`
> **Naturalezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):naturalezza]`

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
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
```

--- Collegamenti

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
--- Vista

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(views.renderEntityPanel(dv, page));
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
