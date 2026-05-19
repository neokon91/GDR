<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Impero
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Imperatore:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):governante]`
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

> [!scena] Promessa dell'impero
>

## Province

```dataview
TABLE tipo, stato, governante, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT nome ASC
```

## Fronti

> [!pericolo] Minacce interne ed esterne
>

## Orologi

> [!timer] Pressioni imperiali
> - [ ]
> - [ ]
> - [ ]

## Segreti

> [!segreto]- Verità dell'impero
>
