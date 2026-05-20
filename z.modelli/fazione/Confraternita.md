<% await tp.user.fazione(tp, { tipoFazione: "confraternita" }) %>
# `=this.nome`

>[!infobox|wiki]- Confraternita
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Canonica:
> `INPUT[toggle:canonico]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Leader:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):leader]`
>
> Membri importanti:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Scadenza nel mondo:
> `INPUT[text:scadenza_mondo]`

> [!timer] Fronte attivo
> Prossima mossa: `=this.prossima_mossa`
>
> Scadenza: `=this.scadenza_mondo`

````tabs
tab: Identità

## Giuramento

> [!regola]- Principi
>

## Obiettivi

`INPUT[text:obiettivo]`

> [!missione]- Cosa persegue
> `=this.obiettivo`
>

tab: Pressione

## Pressione

`INPUT[text:prossima_mossa]`

> [!timer]- Se nessuno interviene
> `=this.prossima_mossa`
> - [ ]
> - [ ]
> - [ ]

tab: Rete

## Membri

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link) OR contains(fazioni, this.file.link)
SORT nome ASC
```

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Verità della confraternita
>
````
