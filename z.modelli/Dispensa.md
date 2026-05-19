<% await tp.user.dispensa(tp) %>
# `=this.nome`

>[!infobox|wiki]- Dispensa
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(consegnato, Consegnato), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Sessioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial)):sessioni]`

> [!handout] Testo da mostrare
>

## Contesto Per Il GM

> [!segreto]- Contesto per il GM
>

## Quando Consegnarla

> [!scena] Quando consegnarla
>

## Conseguenze

