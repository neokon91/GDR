<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infoboxwiki]- Sala di Controllo
> Bioma:
> `VIEW[{bioma}]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
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
> Prima impressione:
> `INPUT[text:impressione]`
>
> Promessa al tavolo:
> `INPUT[text:promessa_al_tavolo]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`

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

## Culture Presenti

`INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial)):culture]`

## Fazioni Presenti

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

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

## Scelte

```meta-bind
INPUT[list:scelte]
```

## Rischi

```meta-bind
INPUT[list:rischi]
```

## Ricompense

```meta-bind
INPUT[list:ricompense]
```

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
