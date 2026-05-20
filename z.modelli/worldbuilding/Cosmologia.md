<% await tp.user.cosmologia(tp) %>
# `=this.nome`

>[!infobox|wiki]- Cosmologia
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Divinità:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial)):divinita]`
>
> Creature:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial)):creature]`
>
> Luoghi collegati:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi_collegati]`

## Regola Del Reame

> [!regola] Cosa funziona diversamente qui
> `=this.regola`

## Pericolo

> [!pericolo] Costo o rischio
> `=this.pericolo`

## Uso In Sessione

> [!scena] Come entra al tavolo
>

## Misteri

> [!segreto]- Verità cosmiche
>
