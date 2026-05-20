<% await tp.user.live_conseguenza(tp) %>
# `=this.nome`

>[!infobox|wiki]- Conseguenza
> Stato:
> `INPUT[inlineSelect(option(da smistare, Da smistare), option(collegata, Collegata), option(canonica, Canonica), option(archiviata, Archiviata), option(ignorata, Ignorata)):stato]`
>
> Canonico:
> `INPUT[canonico][:canonico]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Sessioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial)):sessioni]`
>
> Collegamenti:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):collegamenti]`
>
> Data mondo:
> `INPUT[text:data_mondo]`

> [!missione] Causa
> Che scelta, tiro, scena o omissione ha prodotto questa conseguenza?

> [!timer] Effetto
> `INPUT[list:impatto]`

> [!scena] Aggiornamenti Da Fare
> `INPUT[list:azioni]`

> [!timer] Da aggiornare
> - [ ] Missione
> - [ ] PNG
> - [ ] Luogo
> - [ ] Fazione
> - [ ] Clock o tracciato

## Gestione

Stato:
`INPUT[inlineSelect(option(da smistare, Da smistare), option(collegata, Collegata), option(canonica, Canonica), option(archiviata, Archiviata), option(ignorata, Ignorata)):stato]`

Stato canonico:
`INPUT[inlineSelect(option(rumor, Rumor), option(canonico, Canonico), option(leggenda, Leggenda), option(falso, Falso), option(retcon, Retcon)):stato_canonico]`

Canonico:
`INPUT[canonico][:canonico]`

Aggiorna tracciato:
`INPUT[toggle:aggiorna_tracciato]`

`BUTTON[nuovo-tracciato-z-modelli-dm-tracciato-md]`

`BUTTON[post-sessione-risorse-post-sessione-guidato-2]`
