<% await tp.user.crea_divinita(tp) %>
# `=this.nome`

> [!info] Divinità
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Scheda

> [!abstract] Scheda
> Dominio: `INPUT[text:dominio]`
> Allineamento: `INPUT[allineamento][:allineamento]`
> Simbolo: `INPUT[text:simbolo]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Dogmi
> `INPUT[textArea:dogmi]`

> [!note] Culto
> `INPUT[textArea:culto]`


--- Collegamenti


> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

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
````
