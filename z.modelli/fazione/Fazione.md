<% await tp.user.fazione(tp) %>
# `=this.nome`

>[!infobox|wiki]- Fazione
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(ostile, Ostile), option(in guerra, In Guerra), option(archiviata, Archiviata)):stato]`
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
>
> Influenza:
> `INPUT[text:influenza]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`
>
> Scadenza nel mondo:
> `INPUT[text:scadenza_mondo]`

````tabs
tab: Identità

## Identità

> [!scena] Identità pubblica
>

## Obiettivi

`INPUT[text:obiettivo]`

> [!missione] Obiettivi
>

## Obiettivo Nascosto

`INPUT[text:obiettivo_nascosto]`

> [!segreto]- Obiettivo nascosto
> `=this.obiettivo_nascosto`

## Risorse

```meta-bind
INPUT[list:risorse]
```

## Debolezze

```meta-bind
INPUT[list:debolezze]
```

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

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

## Alleati

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):alleati]`

## Rivali

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):rivali]`

tab: Missioni

## Missioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`

```dataview
TABLE stato, committente, luoghi
FROM "Mondi/Missioni"
WHERE contains(fazioni, this.file.link)
SORT stato ASC, nome ASC
```

tab: Segreti

## Segreti

```meta-bind
INPUT[list:segreti]
```

## Domande Aperte

```meta-bind
INPUT[list:domande_aperte]
```

> [!segreto]- Segreti
>
````
