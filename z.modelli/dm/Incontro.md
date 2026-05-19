<% await tp.user.incontro(tp) %>
# `=this.nome`

>[!infobox|wiki]- Incontro
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(usato, Usato), option(archiviata, Archiviata)):stato]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondo/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Creature:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Creature"), useLinks(partial)):creature]`
>
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Personaggi"), useLinks(partial)):personaggi]`

> [!incontro] Setup
> 

> [!timer] Pressione
> - [ ] 
> - [ ] 
> - [ ] 

## Obiettivo Dell'Incontro

> [!missione] Obiettivo
> 

## Creature

```dataview
TABLE type AS tipo_statblock, size AS taglia, cr
FROM "Mondo/Creature"
WHERE contains(this.creature, file.link)
SORT cr ASC
```

## PNG Coinvolti

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondo/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

## Tattiche

> [!pericolo] Tattiche
> 

## Terreno

> [!luogo] Terreno
> 

## Ricompense

`INPUT[inlineListSuggester(optionQuery("Mondo/Oggetti"), useLinks(partial), allowOther):ricompense]`

## Varianti

> [!segreto]- Varianti
> 
