<% await tp.user.crea_classe(tp) %>
# `=this.nome`

> [!info] 🛡️ Classe
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Dado vita** | `VIEW[{dado_vita} ?? "—"]` |
> | **Caratteristica primaria** | `VIEW[{car_primaria} ?? "—"]` |
> | **TS competenti** | `VIEW[{ts_competenze} ?? "—"]` |
> | **Incantesimi** | `VIEW[{incantesimi} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Classe

> [!abstract] Scheda
> Dado vita: `INPUT[dado_vita][:dado_vita]`
> Caratteristica primaria: `INPUT[text:car_primaria]`
> TS competenti: `INPUT[text:ts_competenze]`
> Incantesimi: `INPUT[incantesimi][:incantesimi]`

--- Progressione

> [!note] Concept
> `INPUT[textArea:descrizione]`

> [!note] Progressione
> `INPUT[textArea:progressione]`


> [!example]- Tabella dei livelli
> | Liv | Comp. | Privilegi |
> |----|----|----|
> | 1 | | |
> | 2 | | |
> | 3 | | |
> | 4 | | |
> | 5 | | |
> | 6 | | |
> | 7 | | |
> | 8 | | |
> | 9 | | |
> | 10 | | |
> | 11 | | |
> | 12 | | |
> | 13 | | |
> | 14 | | |
> | 15 | | |
> | 16 | | |
> | 17 | | |
> | 18 | | |
> | 19 | | |
> | 20 | | |

--- Sottoclassi

La sottoclasse si sceglie al **livello 3**.
```dataview
list
from ""
where categoria = "sottoclasse" and classe = this.file.link
```

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
