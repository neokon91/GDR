<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Regione
> Mondo:
> `INPUT[mondo][:mondo]`
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
> `INPUT[canonico][:canonico]`
>
> Stato canonico:
> `INPUT[stato canonico][:stato_canonico]`
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

## Identità Geografica

### Paesaggio Dominante

```meta-bind
INPUT[list:paesaggi_dominanti]
```

### Clima, Stagioni E Vie Di Movimento

```meta-bind
INPUT[list:clima_stagioni_vie]
```

### Come La Regione Plasma Chi Ci Vive

```meta-bind
INPUT[list:influenza_sugli_abitanti]
```

### Memoria Del Territorio

```meta-bind
INPUT[list:memoria_del_territorio]
```

### Cambiamenti In Corso

```meta-bind
INPUT[list:cambiamenti_in_corso]
```

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

```meta-bind
INPUT[list:segreti]
```
