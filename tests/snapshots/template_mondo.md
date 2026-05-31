<% await tp.user.crea_mondo(tp) %>
# `=this.nome`

> [!info] Mondo
> **Tipo**: `VIEW[{tipo} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

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


--- Carattere

> [!abstract] Carattere
> **Civilta** `INPUT[slider(minValue(0), maxValue(10), addLabels):civilta_natura]` **Natura**
> **Ordine** `INPUT[slider(minValue(0), maxValue(10), addLabels):ordine_caos]` **Caos**
> **Magia rara** `INPUT[slider(minValue(0), maxValue(10), addLabels):magia_rara_diffusa]` **Magia diffusa**

```js-engine
const views = await engine.importJs("z.automazioni/views.js");
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
```

--- Collegamenti


> [!example] Collegamenti
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
