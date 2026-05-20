<% await tp.user.conflitto(tp) %>
# `=this.nome`

>[!infobox|wiki]- Conflitto
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(in corso, In Corso), option(conclusa, Conclusa), option(archiviata, Archiviata)):stato]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Avanzamento:
> `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> Segmenti:
> `INPUT[number:progress_max]`
>
> Innesco:
> `INPUT[text:innesco]`
>
> Cause:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):cause]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

```meta-bind-button
label: Avanza Escalation
style: primary
actions:
  - type: updateMetadata
    bindTarget: progress_value
    evaluate: true
    value: Math.min(Number(x ?? 0) + 1, Number(getMetadata('progress_max') ?? 6))
```

## Posta In Gioco

> [!missione] Cosa cambia se qualcuno vince
>

## Prossima Mossa

> [!timer] Se nessuno interviene
> `=this.prossima_mossa`

## Conseguenze Possibili

```meta-bind
INPUT[list:conseguenze]
```

## Causalità E Propagazione

### Cause

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):cause]`

### Eventi Generati

`INPUT[inlineListSuggester(optionQuery("Mondi/Timeline"), useLinks(partial), allowOther):effetti]`

### Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

### Propaga A

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

```meta-bind
INPUT[list:png_coinvolti]
```

```meta-bind
INPUT[list:ricompense]
```

## Segreti

> [!segreto]- Cosa non sanno i contendenti
>
