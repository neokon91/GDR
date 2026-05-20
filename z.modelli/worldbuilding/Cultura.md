<% await tp.user.cultura(tp) %>
# `=this.nome`

>[!infobox|wiki]- Cultura
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Lingue:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Lingue"), useLinks(partial)):lingue]`
>
> Religioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial)):religioni]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

## Identità

> [!scena] Cosa si nota subito
>

## Usi, Tabù E Feste

```meta-bind
INPUT[list:usi]
```

```meta-bind
INPUT[list:tabu]
```

```meta-bind
INPUT[list:feste]
```

## Tensioni

```meta-bind
INPUT[list:tensioni]
```

## Segreti

> [!segreto]- Verità culturali
>
