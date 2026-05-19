<% tp.config.extra = { ...(tp.config.extra ?? {}), tipoIncontro: "pericolo ambientale" }; await tp.user.incontro(tp) %>
# `=this.nome`

>[!infobox|wiki]- Pericolo Ambientale
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(usato, Usato), option(archiviata, Archiviata)):stato]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Creature presenti:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial)):creature]`

> [!luogo] Ambiente
>

> [!pericolo] Minaccia
>

> [!regola] Tiri rapidi
> - Sopravvivenza: `dice: 1d20`
> - Natura: `dice: 1d20`
> - Tiro salvezza: `dice: 1d20`
> - Danno ambientale: `dice: 1d10`

## Segnali

> [!indizio] Cosa possono notare i PG
>

## Progressione

> [!timer] Il pericolo peggiora
> - [ ]
> - [ ]
> - [ ]

## Modi Per Superarlo

> [!scena] Soluzioni possibili
>

## Creature Coinvolte

```dataview
TABLE type AS tipo, size AS taglia, cr
FROM "Mondi/Creature"
WHERE contains(this.creature, file.link)
SORT cr ASC
```
