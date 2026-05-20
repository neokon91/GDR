<% await tp.user.cultura(tp) %>
# `=this.nome`

>[!infobox|wiki]- Cultura
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Canonica:
> `INPUT[toggle:canonico]`
>
> Stato canonico:
> `INPUT[inlineSelect(option(canonico, Canonico), option(rumor, Rumor), option(leggenda, Leggenda), option(falso, Falso), option(retcon, Retcon)):stato_canonico]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Lingue:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Lingue"), useLinks(partial)):lingue]`
>
> Religioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial)):religioni]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

## Identità

> [!scena] Cosa si nota subito
>

## Al Tavolo

### Pratiche Visibili

```meta-bind
INPUT[list:pratiche_visibili]
```

### Onore E Vergogna

`INPUT[text:onore]`

### Autorità Riconosciute

```meta-bind
INPUT[list:autorita_riconosciute]
```

## Usi, Tabù E Feste

```meta-bind
INPUT[list:usi]
```

```meta-bind
INPUT[list:tabu]
```

```meta-bind
INPUT[list:tabu_sociali]
```

```meta-bind
INPUT[list:feste]
```

## Valori, Estetica E Promessa Al Tavolo

```meta-bind
INPUT[list:valori]
```

```meta-bind
INPUT[list:estetica]
```

```meta-bind
INPUT[list:promesse_al_tavolo]
```

## Tensioni

```meta-bind
INPUT[list:tensioni]
```

```meta-bind
INPUT[list:conflitti_interni]
```

```meta-bind
INPUT[list:relazioni_esterne]
```

`INPUT[inlineListSuggester(optionQuery("Mondi/Relazioni"), useLinks(partial), allowOther):relazioni]`

## Propagazione Culturale

### Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

### Propaga A

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

### Prossima Mossa

> [!timer] Se la tensione cresce
> `=this.prossima_mossa`

## Rendere Giocabile

### Scelte

```meta-bind
INPUT[list:scelte]
```

### Rischi

```meta-bind
INPUT[list:rischi]
```

### Indizi

```meta-bind
INPUT[list:indizi]
```

### PNG Coinvolti

```meta-bind
INPUT[list:png_coinvolti]
```

### Ricompense

```meta-bind
INPUT[list:ricompense]
```

### Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Segreti

> [!segreto]- Verità culturali
>
