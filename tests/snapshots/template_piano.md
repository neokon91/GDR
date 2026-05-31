<% await tp.user.crea_piano(tp) %>
# `=this.nome`

> [!info] Piano d'esistenza
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Accessibilità: `INPUT[accessibilita][:accessibilita]`

> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Natura
> `INPUT[textArea:natura]`

> [!note] Funzione cosmica
> `INPUT[textArea:funzione_cosmica]`

> [!note] Caratteristiche
> `INPUT[textArea:caratteristiche]`

> [!note] Accesso
> `INPUT[textArea:accesso]`

> [!note] Influenza
> `INPUT[textArea:influenza]`


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Collegamenti

> [!example] Relazioni
> **Leggi che lo governano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Dominio cosmico**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Abitanti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):abitanti]`
> **Soglie / accessi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):soglie]`

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
