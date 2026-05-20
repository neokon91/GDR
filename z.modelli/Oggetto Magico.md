<% await tp.user.oggetto_magico(tp) %>
# `=this.nome`

>[!infoboxwiki]- Oggetto Magico
> Rarità:
> `INPUT[inlineSelect(option(comune, Comune), option(non comune, Non comune), option(raro, Raro), option(molto raro, Molto raro), option(leggendario, Leggendario), option(artefatto, Artefatto)):rarita]`
>
> Sintonia:
> `INPUT[toggle:sintonia]`
>
> Cariche:
> `INPUT[number:cariche]`
>
> Maledizione:
> `INPUT[toggle:maledizione]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(consegnato, Consegnato), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Proprietario:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Canonico:
> `INPUT[canonico][:canonico]`

> [!tesoro] Descrizione
>

## Proprietà

> [!regola] Proprietà
>

## Attivazione

> [!regola] Attivazione
>

## Storia

> [!indizio] Storia
>

## Segreto O Maledizione

> [!segreto]- Segreto o maledizione
>
