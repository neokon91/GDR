<% await tp.user.create_entity(tp, "sottoclasse") %>
# `=this.nome`

> [!info] Sottoclasse
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Privilegi

I privilegi di sottoclasse si ottengono ai livelli **3 / 6 / 10 / 14**.

> [!note] Privilegi
> `INPUT[textArea:privilegi]`


--- Collegamenti

> [!example] Relazioni
> **Classe**: `INPUT[suggester(optionQuery("Mondi/Classi"), useLinks(partial), allowOther):classe]`

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
