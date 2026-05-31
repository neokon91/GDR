<% await tp.user.crea_classe(tp) %>
# `=this.nome`

> [!info] Classe
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Classe

> [!abstract] Scheda
> Dado vita: `INPUT[dado_vita][:dado_vita]`
> Caratteristica primaria: `INPUT[text:car_primaria]`
> TS competenti: `INPUT[text:ts_competenze]`
> Incantesimi: `INPUT[incantesimi][:incantesimi]`

--- Progressione

> [!note] Concept
> `INPUT[textArea:descrizione]`

> [!note] Progressione
> `INPUT[textArea:progressione]`


> [!example]- Tabella dei livelli
> | Liv | Comp. | Privilegi |
> |----|----|----|
> | 1 | | |
> | 2 | | |
> | 3 | | |
> | 4 | | |
> | 5 | | |
> | 6 | | |
> | 7 | | |
> | 8 | | |
> | 9 | | |
> | 10 | | |
> | 11 | | |
> | 12 | | |
> | 13 | | |
> | 14 | | |
> | 15 | | |
> | 16 | | |
> | 17 | | |
> | 18 | | |
> | 19 | | |
> | 20 | | |

--- Sottoclassi

La sottoclasse si sceglie al **livello 3**.
```dataview
list
from ""
where categoria = "sottoclasse" and classe = this.file.link
```

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
new Function("dv", source + "\n;return renderEntityPanel(dv, dv.current());")(dv);
```
````
