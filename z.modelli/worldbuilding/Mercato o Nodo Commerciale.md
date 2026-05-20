<% await tp.user.mercato(tp) %>
# `=this.nome`

>[!infobox|wiki]- Mercato O Nodo
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Fazioni controllanti:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`
>
> Risorse:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`
>
> Rotte:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Rotte"), useLinks(partial), allowOther):rotte]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

````tabs
tab: Nodo

## Funzione Commerciale

> [!luogo]- Cosa arriva qui
>

## Risorse Scambiate

`INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`

## Dipendenze

```meta-bind
INPUT[list:dipendenze]
```

tab: Controllo

## Fazioni Controllanti

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`

## Pedaggi, Gabelle, Diritti

```meta-bind
INPUT[list:pedaggi]
```

## Rischi

```meta-bind
INPUT[list:rischi]
```

tab: Propagazione

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

## Collegamenti Di Gioco

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Conflitti"), useLinks(partial), allowOther):conflitti]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`
````
