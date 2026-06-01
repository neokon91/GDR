<% await tp.user.crea_background(tp) %>
# `=this.nome`

> [!info] 📖 Background
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Caratteristiche** | `VIEW[{car_background} ?? "—"]` |
> | **Competenza in strumenti** | `VIEW[{strumento} ?? "—"]` |
> | **Talento d'origine** | `VIEW[{talento_origine} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Scheda

> [!abstract] Scheda
> Caratteristiche: `INPUT[text:car_background]`
> Competenza in strumenti: `INPUT[text:strumento]`
> Talento d'origine: `INPUT[text:talento_origine]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Descrizione
> `INPUT[textArea:descrizione]`

> [!note] Equipaggiamento
> `INPUT[textArea:equipaggiamento]`


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
