---
nome:
categoria: risorsa
tipo: mistero
stato: bozza
stato_canonico: segreto
canonico: false
fonte: prep
fonte_note:
grado_certezza: medio
mondo:
sessioni: []
collegamenti: []
contraddice: []
retcon_di: []
retcon_motivo:
giocabile: false
scelte: []
rischi: []
indizi: []
png_coinvolti: []
ricompense: []
conseguenze: []
prossima_mossa:
rivelato: false
---
# `=this.nome`

>[!infobox|wiki]- Segreto O Mistero
> Tipo:
> `INPUT[inlineSelect(option(segreto, Segreto), option(mistero, Mistero), option(indizio, Indizio), option(verità nascosta, Verità nascosta), option(falso indizio, Falso indizio)):tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(rivelato, Rivelato), option(archiviata, Archiviata)):stato]`
>
> Stato canonico:
> `INPUT[inlineSelect(option(canonico, Canonico), option(rumor, Rumor), option(leggenda, Leggenda), option(segreto, Segreto), option(falso, Falso), option(retcon, Retcon)):stato_canonico]`
>
> Fonte:
> `INPUT[inlineSelect(option(prep, Prep), option(sessione, Sessione), option(player, Player), option(improvvisazione, Improvvisazione), option(retcon, Retcon)):fonte]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Collegamenti:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):collegamenti]`
>
> Sessioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial)):sessioni]`
>
> Rivelato:
> `INPUT[toggle:rivelato]`
>
> Pronto al tavolo:
> `INPUT[toggle:giocabile]`

## Verità

> [!segreto]- Cosa è davvero successo
>

## Indizi

```meta-bind
INPUT[list:indizi]
```

## Scelte E Rischi

```meta-bind
INPUT[list:scelte]
```

```meta-bind
INPUT[list:rischi]
```

## PNG Coinvolti

```meta-bind
INPUT[list:png_coinvolti]
```

## Ricompense E Conseguenze

```meta-bind
INPUT[list:ricompense]
```

```meta-bind
INPUT[list:conseguenze]
```

## Controllo Canone

Contraddice:
`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):contraddice]`

Retcon di:
`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):retcon_di]`

Motivo retcon:
`INPUT[text:retcon_motivo]`
