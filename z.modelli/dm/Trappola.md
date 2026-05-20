<% await tp.user.incontro(tp, { tipoIncontro: "trappola" }) %>
# `=this.nome`

>[!infoboxwiki]- Trappola
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(usato, Usato), option(archiviata, Archiviata)):stato]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> PNG o creature:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`

> [!pericolo] Innesco
>

> [!indizio] Segnali prima della trappola
>

> [!regola] Tiri rapidi
> - Percezione: `dice: 1d20`
> - Indagare: `dice: 1d20`
> - Tiro salvezza: `dice: 1d20`
> - Danno: `dice: 2d6`

## Effetto

> [!pericolo] Cosa succede
>

## Disinnesco

> [!regola] Come evitarla o disattivarla
>

## Conseguenze

> [!timer] Se scatta
> - [ ]
> - [ ]
> - [ ]

## Ricompense O Indizi

`INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):ricompense]`

```dataview
TABLE tipo, rarita, stato
FROM "Mondi/Oggetti"
WHERE contains(this.ricompense, file.link)
SORT nome ASC
```
