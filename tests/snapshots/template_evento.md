<% await tp.user.crea_evento(tp) %>
# `=this.nome`

> [!info] Evento
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Cronologia
> Quando: `INPUT[text:quando]`
>
> Portata: `INPUT[portata][:portata]`

> [!note]- Descrizione
> Cosa accade, chi coinvolge e perche' conta al tavolo.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Cause
> `INPUT[textArea:cause]`

> [!note] Cosa accade
> `INPUT[textArea:cosa]`

> [!note] Conseguenza
> `INPUT[textArea:conseguenza]`

> [!note] Eredità
> `INPUT[textArea:eredita]`


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti
```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderClock(container, app, page);
```

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Scatena
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
--- Cronologia mondo

```dataview
table without id file.link as Evento, quando as Quando, mondo as Mondo
from ""
where categoria = "evento"
sort quando asc
```

--- Collegamenti

> [!example] Relazioni
> **Epoca**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoca]`
> **Luogo**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Coinvolti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):coinvolti]`
> **Fazioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Miti generati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):miti]`

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
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(views.renderEntityPanel(dv, page));
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
