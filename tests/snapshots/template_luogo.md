<% await tp.user.crea_luogo(tp) %>
# `=this.nome`

> [!info] Luogo
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Clima: `INPUT[clima][:clima]`
> Popolazione: `INPUT[text:popolazione]`

> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Funzione
> `INPUT[textArea:funzione]`

> [!note] Controllo
> `INPUT[textArea:controllo]`

> [!note] Atmosfera
> `INPUT[textArea:atmosfera]`

> [!note] Storia
> `INPUT[textArea:storia]`

> [!note] Tensione
> `INPUT[textArea:tensione]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


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
> **Sicuro** `INPUT[slider(minValue(0), maxValue(10), addLabels):sicuro_pericoloso]` **Pericoloso**
> **Prospero** `INPUT[slider(minValue(0), maxValue(10), addLabels):prospero_misero]` **Misero**
> **Noto** `INPUT[slider(minValue(0), maxValue(10), addLabels):noto_segreto]` **Segreto**

--- Collegamenti

> [!example] Relazioni
> **Regione**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regione]`
> **Controllata da**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`
> **Figure**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):abitanti]`

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
