<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Bioma:
> `VIEW[{bioma}]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Descrizione
> 

> [!lettura] Primo sguardo
> 

## Geografia

## Clima

## Flora e Fauna

## Luoghi contenuti

```dataview
TABLE tipo, stato
FROM "Mondo/Luoghi"
WHERE luogo_padre = this.file.link
```

## Incontri

> [!incontro] Incontri
> 

## Risorse

`INPUT[inlineList:risorse]`

## Segreti

> [!segreto]- Segreti
> 
