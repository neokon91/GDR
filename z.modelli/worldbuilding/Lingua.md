<% await tp.user.lingua(tp) %>
# `=this.nome`

>[!infobox|wiki]- Lingua
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Culture:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial)):culture]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`

## Suono E Uso

> [!indizio] Come riconoscerla al tavolo
>

## Parole Note

```meta-bind
INPUT[list:parole_note]
```

## Segreti

> [!segreto]- Lingua proibita, vera origine o significati nascosti
>
