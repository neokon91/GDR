<% await tp.user.crea_cosmologia(tp) %>
# `=this.nome`

> [!info] Cosmologia
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore


> [!note]- Natura cosmica
> Cos'è questo principio, dove sta nella struttura del mondo, come lo percepiscono i mortali.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Natura
> `INPUT[textArea:natura]`

> [!note] Principio
> `INPUT[textArea:principio]`

> [!note] Influenza
> `INPUT[textArea:influenza]`

> [!note] Manifestazioni
> `INPUT[textArea:manifestazioni]`

> [!note] Abitanti
> `INPUT[textArea:abitanti]`

> [!note] Accesso
> `INPUT[textArea:accesso]`

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
> **Ordine** `INPUT[slider(minValue(0), maxValue(10), addLabels):ordine_caos]` **Caos**
> **Immanente** `INPUT[slider(minValue(0), maxValue(10), addLabels):immanente_trascendente]` **Trascendente**
> **Attiva** `INPUT[slider(minValue(0), maxValue(10), addLabels):attiva_silente]` **Silente**

```js-engine
const views = await engine.importJs("z.automazioni/views.js");
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
```

--- Collegamenti

> [!example] Relazioni
> **Divinita legate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Cosmologia"), useLinks(partial), allowOther):divinita]`
> **Luoghi che la manifestano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`

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
const views = await engine.importJs("z.automazioni/views.js");
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
