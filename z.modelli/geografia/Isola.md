<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Isola
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Primo sguardo
>

## Approdi

```meta-bind
INPUT[list:approdi]
```

## Luoghi Dell'Isola

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT nome ASC
```

## Incontri

> [!incontro] Cosa si trova sull'isola
>

## Segreti

> [!segreto]- Cosa nasconde
>
