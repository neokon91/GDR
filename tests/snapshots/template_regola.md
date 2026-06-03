<% await tp.user.crea_regola(tp) %>
# `=this.nome`

> [!infobox|regola] 📕 Regola
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- 📖 Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Cosa
> `INPUT[textArea:cosa_regola]`

> [!note] Come
> `INPUT[textArea:come_funziona]`

> [!note] Eccezioni
> `INPUT[textArea:eccezioni]`


--- 🔗 Collegamenti


> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
