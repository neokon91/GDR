<% await tp.user.cultura(tp) %>
# `=this.nome`

>[!infobox|wiki]- Cultura
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Stato:
> `INPUT[stato base][:stato]`
>
> Canonica:
> `INPUT[canonico][:canonico]`
>
> Stato canonico:
> `INPUT[stato canonico][:stato_canonico]`
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

## Nucleo Culturale

### Mito D'origine

```meta-bind
INPUT[list:mito_origine]
```

### Cosa Questa Cultura Considera Sacro

```meta-bind
INPUT[list:cose_sacre]
```

### Cosa Considera Mostruoso O Inaccettabile

```meta-bind
INPUT[list:cose_proibite]
```

### Contraddizione Interna

```meta-bind
INPUT[list:contraddizioni_interne]
```

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

## Vita Quotidiana

### Famiglia, Casa E Ruoli Sociali

```meta-bind
INPUT[list:famiglia_casa_ruoli]
```

### Cibo, Vestiario E Materiali

```meta-bind
INPUT[list:cibo_vestiario_materiali]
```

### Educazione, Memoria E Trasmissione

```meta-bind
INPUT[list:educazione_memoria]
```

### Economia E Mestieri

```meta-bind
INPUT[list:economia_mestieri]
```

### Rapporto Con Stranieri E Vicini

```meta-bind
INPUT[list:rapporto_stranieri]
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

```meta-bind
INPUT[list:segreti]
```
