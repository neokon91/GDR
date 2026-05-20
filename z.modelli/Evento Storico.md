<% await tp.user.evento_storico(tp) %>
# `=this.nome`

>[!infobox|wiki]- Evento Storico
> Stato:
> `INPUT[inlineSelect(option(canonico, Canonico), option(rumor, Rumor), option(leggenda, Leggenda), option(segreto, Segreto), option(dimenticato, Dimenticato), option(archiviata, Archiviata)):stato_canonico]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Data mondo:
> `INPUT[text:data_mondo]`
>
> Calendario:
> `INPUT[text:fc-calendar]`
>
> Data Calendarium:
> `INPUT[text:fc-date]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Sessioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial)):sessioni]`

> [!lettura] Evento
>

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Collegamenti Dinamici

### PNG Coinvolti

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

### Fazioni Coinvolte

```dataview
TABLE tipo, stato, pressione, prossima_mossa
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT pressione DESC, nome ASC
```

### Sessioni Collegate

```dataview
TABLE data, stato, campagne
FROM "Mondi/Sessioni"
WHERE contains(this.sessioni, file.link)
SORT data DESC
```
