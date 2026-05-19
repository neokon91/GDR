<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Repubblica
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Capitale:
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

> [!scena] Identità della repubblica
>

## Istituzioni

```meta-bind
INPUT[list:istituzioni]
```

## Fazioni Politiche

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(luoghi, this.file.link)
SORT nome ASC
```

## Crisi

> [!timer] Pressioni politiche
> - [ ]
> - [ ]
> - [ ]

## Segreti

> [!segreto]- Segreti della repubblica
>
