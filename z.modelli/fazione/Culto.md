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

> [!regola] Al tavolo
> Dottrina, rituali e misteri sono separati per tenerlo leggibile durante la preparazione.

````tabs
tab: Dottrina

## Dottrina

> [!regola]- Dottrina
>

## Divinità o Entità

## Simboli

tab: Rituali

## Rituali

> [!timer]- Cerimonie e scadenze
>

tab: Rete

## Templi

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):templi]`

## Fazioni collegate

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

tab: Segreti

## Segreti

> [!segreto]- Segreti
>
````
