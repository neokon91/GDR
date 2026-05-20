<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`
>
> Prima impressione:
> `INPUT[text:impressione]`

> [!luogo] Al primo sguardo
> `=this.impressione`
>
> > [!scena]- Premessa
> >
>
> > [!pericolo]- Tensione locale
> > `=this.tensione`

````tabs
tab: Uso

## Ingresso

> [!luogo]- Ingresso
>

## Stanze

```meta-bind
INPUT[list:scene]
```

tab: Incontri

## Incontri

```dataview
TABLE type, cr
FROM "Mondi/Creature"
WHERE contains(luoghi, this.file.link)
```

tab: Pericoli

## Tesori

> [!tesoro]- Tesori
>

## Trappole

> [!pericolo]- Trappole
>

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

## Indizi

```meta-bind
INPUT[list:indizi]
```
````
