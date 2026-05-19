<% await tp.user.oggetto(tp) %>
# `=this.nome`

>[!infobox|wiki]- Oggetto
> Tipo:
> `INPUT[text:tipo]`
>
> Rarità:
> `INPUT[inlineSelect(option(comune, Comune), option(non comune, Non Comune), option(raro, Raro), option(molto raro, Molto Raro), option(leggendario, Leggendario), option(artefatto, Artefatto)):rarita]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(consegnato, Consegnato), option(archiviata, Archiviata)):stato]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Proprietario:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

> [!tesoro] Descrizione
>

## Proprietà

> [!regola] Proprietà
>

## Storia

> [!indizio] Storia
>

## Proprietario

`INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`

## Luogo

`INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

## Segreti

> [!segreto]- Segreti
>
