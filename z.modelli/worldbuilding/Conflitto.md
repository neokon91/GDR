<% await tp.user.conflitto(tp) %>
# `=this.nome`

>[!infoboxwiki]- Conflitto
> Mondo:
> `INPUT[mondo][:mondo]`
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

> [!regia] Gestione
> Escalation: `INPUT[slider(minValue(0), maxValue(12), stepSize(1), addLabels):progress_value]`
>
> `BUTTON[nuovo-tracciato-z-modelli-dm-tracciato-md]`
>
> `BUTTON[geopolitica-geopolitical-dashboard]`

```meta-bind
INPUT[list:cause_profonde]
```

### Pretesto Pubblico

```meta-bind
INPUT[list:pretesti_pubblici]
```

### Ferite Storiche

```meta-bind
INPUT[list:ferite_storiche]
```

### Risorse Contese

```meta-bind
INPUT[list:risorse_contese]
```

### Popolazioni Coinvolte

```meta-bind
INPUT[list:popolazioni_coinvolte]
```

## Prossima Mossa

> [!timer] Se nessuno interviene
> `=this.prossima_mossa`

## Evoluzione Storica

```meta-bind
INPUT[list:fasi_del_conflitto]
```

```meta-bind
INPUT[list:punti_di_non_ritorno]
```

```meta-bind
INPUT[list:possibili_paci]
```

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
