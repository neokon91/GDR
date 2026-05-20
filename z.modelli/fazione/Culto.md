<% await tp.user.culto(tp) %>
# `=this.nome`

>[!infobox|wiki]- Religione
> Tipo:
> `INPUT[text:tipo]`
>
> Sottotipo:
> `INPUT[inlineSelect(option(religione, Religione), option(culto, Culto), option(divinità, Divinità), option(entità, Entità)):sottotipo]`
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
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

> [!regola] Al tavolo
> Dottrina, rituali e misteri sono separati per tenerlo leggibile durante la preparazione.

````tabs
tab: Dottrina

## Dottrina

> [!regola]- Dottrina
>

## Divinità o Entità

## Simboli

## Dogmi

```meta-bind
INPUT[list:dogmi]
```

## Eresie

```meta-bind
INPUT[list:eresie]
```

tab: Rituali

## Rituali

> [!timer]- Cerimonie e scadenze
>

```meta-bind
INPUT[list:rituali]
```

## Calendario Rituale

```meta-bind
INPUT[list:calendario_rituale]
```

tab: Rete

## Templi

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):templi]`

## Luoghi Sacri

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi_sacri]`

## Fazioni collegate

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

## Influenza Politica

`INPUT[text:influenza_politica]`

## Relazioni Religiose E Politiche

`INPUT[inlineListSuggester(optionQuery("Mondi/Relazioni"), useLinks(partial), allowOther):relazioni]`

tab: Propagazione

## Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

## Propaga A

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Prossima Mossa

> [!timer] Se il culto avanza
> `=this.prossima_mossa`

tab: Segreti

## Segreti

> [!segreto]- Segreti
>

```meta-bind
INPUT[list:segreti]
```

## Misteri E Indizi

```meta-bind
INPUT[list:misteri]
```

```meta-bind
INPUT[list:indizi]
```

## Rendere Giocabile

```meta-bind
INPUT[list:scelte]
```

```meta-bind
INPUT[list:rischi]
```

```meta-bind
INPUT[list:ricompense]
```
````
