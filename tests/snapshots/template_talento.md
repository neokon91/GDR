<% await tp.user.crea_talento(tp) %>
# `=this.nome`

> [!infobox|talento] ⭐ Talento
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Prerequisito** | `VIEW[{prerequisito} ?? "—"]` |
> | **Ripetibile** | `VIEW[{ripetibile} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(origine), option(generale), option(stile di combattimento), option(epico)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Talento
> **Cos'è** · Un talento che un PG può prendere a creazione o salendo di livello, coi suoi benefici meccanici.
> **Campi chiave** · **Categoria** (Origine dal background; Generale richiede liv. 4+) e **Prerequisito**; segna **Ripetibile** se cumulabile.


````tabs
--- 📋 Scheda

> [!abstract] Scheda
> Prerequisito: `INPUT[text:prerequisito]`
> Ripetibile: `INPUT[text:ripetibile]`

--- 📖 Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Benefici
> `INPUT[textArea:benefici]`


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
