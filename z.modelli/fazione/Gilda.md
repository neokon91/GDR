<% await tp.user.fazione(tp, { tipoFazione: "gilda" }) %>
# `=this.nome`

>[!infobox|wiki]- Gilda
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Leader:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):leader]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`
>
> PNG:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`

## Scopo

> [!missione] Cosa vuole la gilda
>

## Servizi

```meta-bind
INPUT[list:servizi]
```

## Regole E Prezzi

> [!regola] Come funziona
>

## PNG Della Gilda

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link) OR contains(fazioni, this.file.link)
SORT nome ASC
```

## Luoghi Della Gilda

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE contains(this.luoghi, file.link)
SORT nome ASC
```

## Segreti

> [!segreto]- Cosa non dicono
>
