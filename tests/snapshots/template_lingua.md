<% await tp.user.crea_lingua(tp) %>
# `=this.nome`

> [!info] Lingua
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore


> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Parlanti
> `INPUT[textArea:chi_parla]`

> [!note] Suono
> `INPUT[textArea:suono]`

> [!note] Scrittura
> `INPUT[textArea:scrittura]`

> [!note] Lessico
> `INPUT[textArea:lessico]`


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
> **Parlata in**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):parlata_in]`
> **Culture**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`
--- Vista

```dataviewjs
const source = await dv.io.load("z.automazioni/views.js");
new Function("dv", source + "\n;return renderEntityPanel(dv, dv.current());")(dv);
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
