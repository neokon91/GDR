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
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
