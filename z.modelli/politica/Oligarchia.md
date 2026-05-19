<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Oligarchia
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Centro del potere:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):capitale]`
>
> Stabilità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):stabilita]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!scena] Chi comanda davvero
>

## Casate O Gruppi Dominanti

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(luoghi, this.file.link)
SORT nome ASC
```

## Leve Di Potere

```meta-bind
INPUT[list:leve_potere]
```

## Segreti

> [!segreto]- Accordi nascosti
>
