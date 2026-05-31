<% await tp.user.crea_fazione(tp) %>
# `=this.nome`

> [!info] Fazione
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`
> Motto: `INPUT[text:motto]`
> Forma di governo: `INPUT[text:forma_governo]`
> Epoca di fondazione: `INPUT[text:fondazione]`

> [!note]- Identità
> Cosa rappresenta la fazione, simboli, reputazione e percezione pubblica.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Obiettivo
> `INPUT[textArea:obiettivo]`

> [!note] Metodi
> `INPUT[textArea:metodo]`

> [!note] Gerarchia
> `INPUT[textArea:gerarchia]`

> [!note] Influenza
> `INPUT[textArea:influenza]`

> [!note] Nel presente
> `INPUT[textArea:presente]`

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
> **Ordine** `INPUT[slider(minValue(0), maxValue(10), addLabels):ordine_caos]` **Caos**
> **Segreta** `INPUT[slider(minValue(0), maxValue(10), addLabels):segreta_palese]` **Palese**
> **Dottrina** `INPUT[slider(minValue(0), maxValue(10), addLabels):dottrina_pragmatismo]` **Pragmatismo**

--- Collegamenti

> [!example] Relazioni
> **Sede**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):sede]`
> **Fondatori**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):fondatori]`
> **Figure chiave**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Alleate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):alleati]`
> **Rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):rivali]`

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
eval(source);
renderEntityPanel(dv, dv.current());
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
