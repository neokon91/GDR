<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Repubblica
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Capitale:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):capitale]`
>
> Stabilità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):stabilita]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Legittimità:
> `INPUT[text:legittimita]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!scena] Identità della repubblica
>

## Istituzioni

```meta-bind
INPUT[list:istituzioni]
```

## Fazioni Politiche

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(luoghi, this.file.link)
SORT nome ASC
```

## Geopolitica Repubblicana

### Confini E Rotte

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):confini]`

### Alleati, Rivali E Relazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):alleati]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):rivali]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Relazioni"), useLinks(partial), allowOther):relazioni]`

### Culture, Religioni E Risorse

`INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial), allowOther):religioni]`

```meta-bind
INPUT[list:risorse_strategiche]
```

```meta-bind
INPUT[list:crisi_interne]
```

## Crisi

> [!timer] Pressioni politiche
> - [ ]
> - [ ]
> - [ ]

## Segreti

> [!segreto]- Segreti della repubblica
>
