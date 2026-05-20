<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infoboxwiki]- Baronia
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Barone o baronessa:
> `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):governante]`
>
> Regione superiore:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Stabilità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):stabilita]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Legittimità:
> `INPUT[text:legittimita]`
>
> Prossima mossa:
> `INPUT[text:prossima_mossa]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Dominio locale
>

## Luoghi Sotto La Baronia

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT nome ASC
```

## Obblighi E Tasse

> [!regola] Cosa pretende il potere locale
>

## Geopolitica Locale

### Confini E Superiori

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):confini]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):vassalli]`

### Alleati, Rivali E Relazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):alleati]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):rivali]`

`INPUT[inlineListSuggester(optionQuery("Mondi/Relazioni"), useLinks(partial), allowOther):relazioni]`

### Risorse Strategiche

```meta-bind
INPUT[list:risorse_strategiche]
```

## Segreti

> [!segreto]- Segreti della baronia
>
