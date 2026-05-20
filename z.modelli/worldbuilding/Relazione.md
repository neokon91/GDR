<% await tp.user.relazione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Relazione
> Tipo:
> `INPUT[inlineSelect(option(alleanza, Alleanza), option(rivalità, Rivalità), option(guerra fredda, Guerra Fredda), option(vassallaggio, Vassallaggio), option(trattato, Trattato), option(debito, Debito), option(faida, Faida), option(patto religioso, Patto Religioso), option(tradimento, Tradimento), option(relazione, Relazione)):tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(in guerra, In Guerra), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Soggetti:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):soggetti]`
>
> Intensità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):intensita]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

> [!scena] Relazione viva
> Origine: `=this.origine`
>
> Posta: `=this.posta`
>
> Prossimo deterioramento: `=this.prossima_mossa`

````tabs
tab: Nodi

## Soggetti

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):soggetti]`

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE contains(this.soggetti, file.link)
SORT categoria ASC, nome ASC
```

## Origine

`INPUT[text:origine]`

## Posta

`INPUT[text:posta]`

tab: Dinamica

## Innesco

`INPUT[text:innesco]`

## Eventi Collegati

`INPUT[inlineListSuggester(optionQuery("Mondi/Timeline"), useLinks(partial), allowOther):eventi]`

## Trattati O Debiti

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):trattati]`

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

tab: Propagazione

## Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

## Propaga A

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

## Rendere Giocabile

```meta-bind
INPUT[list:scelte]
```

```meta-bind
INPUT[list:rischi]
```

```meta-bind
INPUT[list:indizi]
```

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```
````
