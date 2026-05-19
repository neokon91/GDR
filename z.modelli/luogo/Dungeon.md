<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`
>
> Prima impressione:
> `INPUT[text:impressione]`

> [!incontro] Premessa
>

> [!lettura] Descrizione da leggere
>
> `=this.impressione`

## Ingresso

> [!luogo] Ingresso
>

## Stanze

```meta-bind
INPUT[list:scene]
```

## Incontri

```dataview
TABLE type, cr
FROM "Mondi/Creature"
WHERE contains(luoghi, this.file.link)
```

## Tesori

> [!tesoro] Tesori
>

## Trappole

> [!pericolo] Trappole
>

## Segreti

```meta-bind
INPUT[list:segreti]
```

## Indizi

```meta-bind
INPUT[list:indizi]
```
