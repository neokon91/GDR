<% await tp.user.crea_incantesimo(tp) %>
# `=this.nome`

> [!info] Incantesimo
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Meccanica

> [!abstract] Scheda
> Livello: `INPUT[number:livello]`
> Tempo di lancio: `INPUT[text:tempo_lancio]`
> Gittata: `INPUT[text:gittata]`
> Componenti: `INPUT[text:componenti]`
> Durata: `INPUT[text:durata]`
> Classi: `INPUT[text:classi]`

--- Effetto

> [!note] Effetto
> `INPUT[textArea:effetto]`

> [!note] Ai livelli superiori
> `INPUT[textArea:a_livello_superiore]`


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
