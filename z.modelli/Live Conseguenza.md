<% await tp.user.live_conseguenza(tp) %>
# `=this.nome`

>[!infobox|wiki]- Conseguenza
> Stato:
> `INPUT[inlineSelect(option(da smistare, Da smistare), option(collegata, Collegata), option(canonica, Canonica), option(archiviata, Archiviata), option(ignorata, Ignorata)):stato]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
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

## Azioni Guidate

```meta-bind-button
label: Canonizza
style: primary
actions:
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: canonica
  - type: updateMetadata
    bindTarget: stato_canonico
    evaluate: false
    value: canonico
  - type: updateMetadata
    bindTarget: canonico
    evaluate: false
    value: true
```

```meta-bind-button
label: Tracciato Da Aggiornare
style: primary
actions:
  - type: updateMetadata
    bindTarget: aggiorna_tracciato
    evaluate: false
    value: true
```
