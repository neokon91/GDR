<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infoboxwiki]- Sala di Controllo
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
> > [!pericolo]- Tensione locale
> > `=this.tensione`

````tabs
tab: Uso

## Storia Antica

## Stato Attuale

## Punti di Interesse

tab: Presenze

## Presenze

> [!incontro]- Presenze
>

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Segreti
>

## Hook narrativi

```meta-bind
INPUT[list:scene]
```

## Indizi

```meta-bind
INPUT[list:indizi]
```
````
