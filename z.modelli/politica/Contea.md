<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Contea
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Conte o contessa:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):governante]`
>
> Regione superiore:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Stabilità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):stabilita]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Carattere della contea
>

## Insediamenti

```dataview
TABLE tipo, popolazione, stato, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT popolazione DESC
```

## Problemi

```meta-bind
INPUT[list:problemi]
```

> [!pericolo] Problemi aperti
>

## Segreti

> [!segreto]- Segreti della contea
>
