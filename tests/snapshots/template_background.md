<% await tp.user.crea_background(tp) %>
# `=this.nome`

> [!infobox] 📖 Background
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Caratteristiche** | `VIEW[{car_background} ?? "—"]` |
> | **Competenze in abilità** | `VIEW[{abilita_background} ?? "—"]` |
> | **Competenza in strumenti** | `VIEW[{strumento} ?? "—"]` |
> | **Talento d'origine** | `VIEW[{talento_origine} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Scheda

> [!abstract] Scheda
> Caratteristiche: `INPUT[text:car_background]`
> Competenze in abilità: `INPUT[text:abilita_background]`
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
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
