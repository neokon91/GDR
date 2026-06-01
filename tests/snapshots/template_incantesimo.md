<% await tp.user.crea_incantesimo(tp) %>
# `=this.nome`

> [!info] ✨ Incantesimo
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Livello** | `VIEW[{livello} ?? "—"]` |
> | **Tempo di lancio** | `VIEW[{tempo_lancio} ?? "—"]` |
> | **Gittata** | `VIEW[{gittata} ?? "—"]` |
> | **Componenti** | `VIEW[{componenti} ?? "—"]` |
> | **Durata** | `VIEW[{durata} ?? "—"]` |
> | **Classi** | `VIEW[{classi} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Meccanica

> [!abstract] Scheda
> Livello: `INPUT[number:livello]`
> Tempo di lancio: `INPUT[text:tempo_lancio]`
> Gittata: `INPUT[text:gittata]`
> Componenti: `INPUT[text:componenti]`
> Durata: `INPUT[text:durata]`
> Classi: `INPUT[text:classi]`

--- Effetto

> [!note] Effetto
> `INPUT[textArea:effetto]`

> [!note] Ai livelli superiori
> `INPUT[textArea:a_livello_superiore]`


--- Collegamenti

> [!example] Relazioni
> **Sistema magico**: `INPUT[suggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistema_magico]`

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
