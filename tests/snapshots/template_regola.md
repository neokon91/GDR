<% await tp.user.crea_regola(tp) %>
# `=this.nome`

> [!infobox|regola] 📕 Regola
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(regola della casa), option(regola variante)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Regola
> **Cos'è** · Una regola della casa o variante che modifica il regolamento al tuo tavolo, scritta per non doverla ricordare a memoria.
> **Campi chiave** · **Cosa** regola, **Come** funziona in pratica e le **Eccezioni**; lega al **Mondo** se vale solo per una campagna.
> **Spunti** · Quale frustrazione del regolamento standard risolve? Rende qualcosa più rischioso o più fluido? Vale per tutti o solo in certe scene?

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
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
