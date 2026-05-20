<% await tp.user.ricorrenza_calendario(tp) %>
# `=this.nome`

>[!infobox|wiki]- Ricorrenza
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Data nel mondo:
> `INPUT[text:data_mondo]`
>
> Mese:
> `INPUT[text:mese]`
>
> Stagione:
> `INPUT[text:stagione]`
>
> Festa:
> `INPUT[toggle:festa]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

````tabs
tab: Calendario

## Feste E Ricorrenze

```meta-bind
INPUT[list:eventi_ricorrenti]
```

## Tabù Stagionali

```meta-bind
INPUT[list:tabu_stagionali]
```

## Scadenze Rituali

```meta-bind
INPUT[list:scadenze_rituali]
```

tab: Impatto

## Conseguenze Se La Data Passa

```meta-bind
INPUT[list:conseguenze_data_passata]
```

## Pressioni Da Avanzare

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):pressioni_da_avanzare]`

## Propagazione

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

tab: Calendarium

| Campo | Valore |
| --- | --- |
| `fc-calendar` | `=this["fc-calendar"]` |
| `fc-date` | `=this["fc-date"]` |
| `fc-category` | `=this["fc-category"]` |
| `fc-display-name` | `=this["fc-display-name"]` |
````
