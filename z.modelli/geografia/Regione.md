<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Regione
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Regione superiore:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Bioma:
> `INPUT[text:bioma]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stabilità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):stabilita]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Canonica:
> `INPUT[toggle:canonico]`
>
> Stato canonico:
> `INPUT[inlineSelect(option(canonico, Canonico), option(rumor, Rumor), option(leggenda, Leggenda), option(falso, Falso), option(retcon, Retcon)):stato_canonico]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`
>
> Promessa al tavolo:
> `INPUT[text:promessa_al_tavolo]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

> [!luogo] Descrizione
>

## Luoghi Contenuti

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT nome ASC
```

## Risorse

```meta-bind
INPUT[list:risorse]
```

## Culture E Poteri

`INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial)):culture]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

## Geopolitica

### Confini E Vicini

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):confini]`

### Potenze Rivali

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):rivali]`

### Relazioni E Trattati

`INPUT[inlineListSuggester(optionQuery("Mondi/Relazioni"), useLinks(partial), allowOther):relazioni]`

### Risorse Strategiche

```meta-bind
INPUT[list:risorse_strategiche]
```

## Pericoli

> [!pericolo] Minacce della regione
>

```meta-bind
INPUT[list:rischi]
```

## Rendere Giocabile

```meta-bind
INPUT[list:scelte]
```

```meta-bind
INPUT[list:indizi]
```

```meta-bind
INPUT[list:ricompense]
```

```meta-bind
INPUT[list:conseguenze]
```

## Segreti

> [!segreto]- Segreti
>
