<% await tp.user.era_storica(tp) %>
# `=this.nome`

>[!infobox|wiki]- Storia
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Data del mondo:
> `INPUT[text:data_mondo]`
>
> Stato canonico:
> `INPUT[inlineSelect(option(canonico, Canonico), option(rumor, Rumor), option(leggenda, Leggenda), option(archiviata, Archiviata)):stato_canonico]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Culture:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial)):culture]`

## Cosa Successe

> [!lettura] Evento o epoca
>

## Cause

> [!timer] Perche e iniziata
>

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Verità Distorte

> [!segreto]- Cosa la gente racconta male
>
