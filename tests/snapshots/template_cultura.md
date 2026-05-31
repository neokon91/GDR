<% await tp.user.crea_cultura(tp) %>
# `=this.nome`

> [!info] Cultura
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore


> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Valori
> `INPUT[textArea:valori]`

> [!note] Vita
> `INPUT[textArea:vita]`

> [!note] Riti
> `INPUT[textArea:riti]`

> [!note] Tabù
> `INPUT[textArea:tabu]`

> [!note] Estetica
> `INPUT[textArea:estetica]`

> [!note] Tensione
> `INPUT[textArea:tensione]`


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Carattere

> [!abstract] Carattere
> **Tradizione** `INPUT[slider(minValue(0), maxValue(10), addLabels):tradizione_innovazione]` **Innovazione**
> **Aperta** `INPUT[slider(minValue(0), maxValue(10), addLabels):aperta_chiusa]` **Chiusa**
> **Gerarchica** `INPUT[slider(minValue(0), maxValue(10), addLabels):gerarchica_egualitaria]` **Egualitaria**

--- Collegamenti

> [!example] Relazioni
> **Regioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`
> **Lingua**: `INPUT[suggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):lingua]`

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
