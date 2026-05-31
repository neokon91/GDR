<% await tp.user.create_entity(tp, "divinita") %>
# `=this.nome`

> [!info] Divinità
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Scheda

> [!abstract] Scheda
> Dominio: `INPUT[text:dominio]`
> Allineamento: `INPUT[allineamento][:allineamento]`
> Simbolo: `INPUT[text:simbolo]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Dogmi
> `INPUT[textArea:dogmi]`

> [!note] Culto
> `INPUT[textArea:culto]`


--- Collegamenti


> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`
--- Vista

```dataviewjs
const source = await dv.io.load("z.automazioni/views.js");
eval(source);
renderEntityPanel(dv, dv.current());
```
````
