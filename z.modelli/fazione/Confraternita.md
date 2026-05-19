<% tp.config.extra = { ...(tp.config.extra ?? {}), tipoFazione: "confraternita" }; await tp.user.fazione(tp) %>
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

## Giuramento

> [!regola] Principi
>

## Obiettivi

> [!missione] Cosa persegue
>

## Pressione

> [!timer] Se nessuno interviene
> - [ ]
> - [ ]
> - [ ]

## Membri

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link) OR contains(fazioni, this.file.link)
SORT nome ASC
```

## Segreti

> [!segreto]- Verità della confraternita
>
