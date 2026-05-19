<% await tp.user.fazione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Fazione
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Canonica:
> `INPUT[toggle:canonico]`
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
> Personaggi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`

````tabs
tab: Identità

## Identità

> [!scena] Identità pubblica
>

## Obiettivi

> [!missione] Obiettivi
>

tab: Rete

## Leader

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):leader]`

## Luoghi controllati

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`

## PNG Collegati

Alleati, nemici, emissari e membri importanti restano personaggi.

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):personaggi]`

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link) OR contains(fazioni, this.file.link)
SORT nome ASC
```

tab: Missioni

## Missioni

```dataview
TABLE stato, committente, luoghi
FROM "Mondi/Missioni"
WHERE contains(fazioni, this.file.link)
SORT stato ASC, nome ASC
```

tab: Segreti

## Segreti

> [!segreto]- Segreti
>
````
