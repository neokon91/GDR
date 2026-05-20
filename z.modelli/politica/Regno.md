<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Regno
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Sovrano:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):governante]`
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

> [!scena] Identità politica
>

## Struttura Del Potere

### Mito Di Legittimità

```meta-bind
INPUT[list:mito_legittimita]
```

### Chi Comanda Davvero

```meta-bind
INPUT[list:potere_reale]
```

### Come Si Mantiene L'Ordine

```meta-bind
INPUT[list:ordine_pubblico]
```

### Come Vive La Gente Comune

```meta-bind
INPUT[list:vita_comune]
```

### Tasse, Obblighi E Protezioni

```meta-bind
INPUT[list:tasse_obblighi_protezioni]
```

### Fratture Interne

```meta-bind
INPUT[list:fratture_interne]
```

## Territori

```dataview
TABLE tipo, stato, governante, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT nome ASC
```

## Fazioni Di Potere

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(luoghi, this.file.link)
SORT nome ASC
```

## Geopolitica

### Confini

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):confini]`

### Vassalli E Dipendenze

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):vassalli]`

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
INPUT[list:eserciti]
```

```meta-bind
INPUT[list:crisi_interne]
```

## Tensioni

> [!timer] Cosa cambia se nessuno interviene
> `=this.prossima_mossa`

```meta-bind
INPUT[list:tensioni]
```

## Segreti

> [!segreto]- Segreti del regno
>

```meta-bind
INPUT[list:segreti]
```
