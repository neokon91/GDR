<% await tp.user.conflitto(tp) %>
# `=this.nome`

>[!infobox|wiki]- Conflitto
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(in corso, In Corso), option(conclusa, Conclusa), option(archiviata, Archiviata)):stato]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial)):luoghi]`

## Posta In Gioco

> [!missione] Cosa cambia se qualcuno vince
>

## Prossima Mossa

> [!timer] Se nessuno interviene
> `=this.prossima_mossa`

## Conseguenze Possibili

```meta-bind
INPUT[list:conseguenze]
```

## Segreti

> [!segreto]- Cosa non sanno i contendenti
>
