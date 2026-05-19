<% await tp.user.culto(tp) %>
# `=this.nome`

>[!infobox|wiki]- Religione
> Tipo:
> `INPUT[text:tipo]`
>
> Sottotipo:
> `INPUT[inlineSelect(option(religione, Religione), option(culto, Culto), option(divinità, Divinità), option(entità, Entità)):sottotipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Canonica:
> `INPUT[toggle:canonico]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`

## Dottrina

> [!regola] Dottrina
>

## Divinità o Entità

## Simboli

## Rituali

## Templi

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):templi]`

## Fazioni collegate

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

## Segreti

> [!segreto]- Segreti
>
