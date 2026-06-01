<% await tp.user.crea_talento(tp) %>
# `=this.nome`

> [!info] ⭐ Talento
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Prerequisito** | `VIEW[{prerequisito} ?? "—"]` |
> | **Ripetibile** | `VIEW[{ripetibile} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Scheda

> [!abstract] Scheda
> Prerequisito: `INPUT[text:prerequisito]`
> Ripetibile: `INPUT[text:ripetibile]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Benefici
> `INPUT[textArea:benefici]`


--- Collegamenti


> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(await views.renderConnessioni(app, dv, page));
```
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
