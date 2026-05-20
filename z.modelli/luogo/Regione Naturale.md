<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Bioma:
> `VIEW[{bioma}]`
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

> [!luogo] Primo sguardo
> `=this.impressione`
>
> > [!pericolo]- Tensione locale
> > `=this.tensione`

````tabs
tab: Territorio

## Geografia

## Clima

## Flora e Fauna

tab: Rete

## Luoghi contenuti

```dataview
TABLE tipo, stato
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
```

tab: Uso

## Incontri

> [!incontro]- Incontri
>

## Risorse

`INPUT[inlineList:risorse]`

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

> [!segreto]- Segreti
>

## Indizi E Voci

```meta-bind
INPUT[list:indizi]
```

```meta-bind
INPUT[list:voci]
```
````
