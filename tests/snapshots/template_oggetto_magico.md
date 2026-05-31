<% await tp.user.crea_oggetto_magico(tp) %>
# `=this.nome`

> [!info] Oggetto Magico
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Scheda

> [!abstract] Scheda
> Rarità: `INPUT[rarita][:rarita]`
> Sintonia: `INPUT[text:sintonia]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Aspetto
> `INPUT[textArea:descrizione_oggetto]`

> [!note] Effetto
> `INPUT[textArea:effetto]`

> [!note] Provenienza
> `INPUT[textArea:provenienza]`


--- Collegamenti

> [!example] Relazioni
> **Proprietario**: `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`
> **Dove si trova**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):dove]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

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
````
