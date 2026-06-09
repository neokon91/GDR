<% await tp.user.crea_talento(tp) %>
# `=this.nome`

> [!infobox|talento] ⭐ Talento
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Prerequisito** | `INPUT[text(placeholder(es. Forza 13 oppure competenza in Atletica)):prerequisito]` |
> | **Ripetibile** | `INPUT[toggle:ripetibile]` |
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


--- 📖 Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

%%prosa%%
## Benefici
> [!question]- 💡 Benefici del talento

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.


> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

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
