<% await tp.user.create_entity(tp, "mondo") %>
# `=this.nome`

> [!info] Mondo
> **Tipo**: `VIEW[{tipo} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Scala: `INPUT[scala][:scala]`
> Genere: `INPUT[genere][:genere]`
> Epoca: `INPUT[text:epoca]`
> Temi: `INPUT[temi][:temi]`

> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Tono
> `INPUT[textArea:tono]`

> [!note] Conflitto centrale
> `INPUT[textArea:conflitto]`

> [!note] Magia
> `INPUT[textArea:magia]`

> [!note] Poteri
> `INPUT[textArea:poteri]`

> [!segreto]- Verità nascosta
> `INPUT[textArea:verita_nascosta]`


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
> **Civilta** `INPUT[slider(minValue(0), maxValue(10), addLabels):civilta_natura]` **Natura**
> **Ordine** `INPUT[slider(minValue(0), maxValue(10), addLabels):ordine_caos]` **Caos**
> **Magia rara** `INPUT[slider(minValue(0), maxValue(10), addLabels):magia_rara_diffusa]` **Magia diffusa**

--- Collegamenti


> [!example] Collegamenti
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
