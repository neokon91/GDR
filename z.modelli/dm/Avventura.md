<% await tp.user.avventura(tp) %>
# `=this.nome`

>[!infobox|wiki]- Avventura
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(preparazione, Preparazione), option(pronto, Pronto), option(in gioco, In gioco), option(conclusa, Conclusa), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Campagne:
> `INPUT[campagne][:campagne]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Missioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`
>
> Incontri:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial)):incontri]`

> [!scena] Premessa
>

## Obiettivo

> [!missione] Cosa muove l'avventura
>

## Struttura

```meta-bind
INPUT[list:scene]
```

## Missioni

```dataview
TABLE stato, committente, luoghi, fazioni
FROM "Mondi/Missioni"
WHERE contains(this.missioni, file.link)
SORT stato ASC, nome ASC
```

## Incontri

```dataview
TABLE stato, luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE contains(this.incontri, file.link)
SORT pericolo DESC
```

## Ricompense

`INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):ricompense]`

```dataview
TABLE tipo, rarita, stato
FROM "Mondi/Oggetti"
WHERE contains(this.ricompense, file.link)
SORT rarita ASC, nome ASC
```

## Segreti

> [!segreto]- Verità dietro l'avventura
>
