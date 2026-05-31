<% await tp.user.crea_creatura(tp) %>
# `=this.nome`

> [!info] Creatura
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Statblock

```statblock
layout: D&D 5.5 Layout ITA - Compatibile 5e
name: <% tp.file.title %>
size: Medio
type: umanoide
subtype: ""
alignment: neutrale
ac: 10
hp: 10
hit_dice: 2d8
speed: 9 m
initiative: "+0"
stats: [10, 10, 10, 10, 10, 10]
saves: []
skillsaves: []
damage_vulnerabilities: ""
damage_resistances: ""
damage_immunities: ""
condition_immunities: ""
senses: Percezione passiva 10
languages: Comune
cr: "1"
traits: []
actions: []
bonus_actions: []
reactions: []
legendary_actions: []
```

--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Lore

> [!abstract] Scheda
> Taglia: `INPUT[taglia][:taglia]`
> Ruolo ecologico: `INPUT[text:ruolo_ecologico]`
> Dieta: `INPUT[dieta][:dieta]`

> [!note]- Aspetto e indole
> Com'è fatta, come si muove, che impressione dà. I numeri 5e sono nel tab Statblock.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Ecologia
> `INPUT[textArea:ecologia]`

> [!note] Aspetto
> `INPUT[textArea:aspetto]`

> [!note] Comportamento
> `INPUT[textArea:comportamento]`

> [!note] Tattiche
> `INPUT[textArea:tattiche]`

> [!note] Mito e reputazione
> `INPUT[textArea:mito]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


--- Carattere

> [!abstract] Carattere
> **Docile** `INPUT[slider(minValue(0), maxValue(10), addLabels):docile_ostile]` **Ostile**
> **Solitaria** `INPUT[slider(minValue(0), maxValue(10), addLabels):solitaria_gregaria]` **Gregaria**
> **Stanziale** `INPUT[slider(minValue(0), maxValue(10), addLabels):stanziale_migratoria]` **Migratoria**
> **Mondana** `INPUT[slider(minValue(0), maxValue(10), addLabels):mondana_magica]` **Magica**

```js-engine
const views = await engine.importJs("z.automazioni/views.js");
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
```

--- Collegamenti

> [!example] Relazioni
> **Habitat**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):habitat]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`
--- Vista

```js-engine
const views = await engine.importJs("z.automazioni/views.js");
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(views.renderEntityPanel(dv, page));
```
````
