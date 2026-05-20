<% await tp.user.nota_rapida(tp) %>
# `=this.nome`

>[!infoboxwiki]- Nota Rapida
> Tipo:
> `INPUT[inlineSelect(option(idea, Idea), option(appunto, Appunto), option(spunto, Spunto), option(domanda, Domanda), option(promemoria, Promemoria)):tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(da smistare, Da Smistare), option(smistata, Smistata), option(archiviata, Archiviata)):stato]`
>
> Collegamenti:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):collegamenti]`
>
> Entità impattate:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

> [!indizio] Appunto
>

## Azione Post-Sessione

> [!timer] Decidi cosa diventa
> Canonico: `INPUT[toggle:canonizza_evento]`
>
> Rumor: `INPUT[toggle:marca_rumor]`
>
> Conseguenza: `INPUT[toggle:crea_conseguenza]`
>
> Archivia: `INPUT[toggle:archivia_appunto]`

> [!missione] Propagazione
> Entità impattate:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

## Possibile Uso

> [!scena] Dove potrebbe servire
>

## Da Fare

> [!timer] Prossimo passo
> - [ ] Decidere se diventa canonica
> - [ ] Collegarla a mondo, campagna, luogo, PNG o missione
> - [ ] Spostare o archiviare
