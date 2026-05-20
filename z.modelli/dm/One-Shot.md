<% await tp.user.one_shot(tp) %>
# `=this.nome`

>[!infoboxwiki]- One-Shot
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(preparazione, Preparazione), option(pronto, Pronto), option(giocata, Giocata), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Livello:
> `INPUT[number:livello]`
>
> Durata prevista:
> `INPUT[text:durata]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> Incontri:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial)):incontri]`

> [!scena] Pitch
>

> [!lettura] Apertura da leggere
>

> [!regola] Tiri rapidi
> - Scelta casuale: `dice: 1d6`
> - Complicazione: `dice: 1d12`

## Scaletta

> [!timer] Ritmo
> - [ ] Apertura
> - [ ] Prima scelta
> - [ ] Complicazione
> - [ ] Climax
> - [ ] Epilogo

## Incontri

```dataview
TABLE stato, luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE contains(this.incontri, file.link)
SORT pericolo DESC
```

## PNG

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

## Ricompense

> [!tesoro] Ricompense
>
