<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Governante:
> `INPUT[suggester(optionQuery("Mondo/Personaggi"), useLinks(partial), allowOther):governante]`
>
> Regione:
> `INPUT[suggester(optionQuery("Mondo/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Popolazione:
> `INPUT[number:popolazione]`
>
> Stabilità:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):stabilita]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Descrizione
> 

> [!lettura] Prima impressione
> 

## Quartieri e Luoghi Importanti

```dataview
TABLE tipo, stato
FROM "Mondo/Luoghi"
WHERE luogo_padre = this.file.link
```

## Governo

## Economia

## Fazioni presenti

`INPUT[inlineListSuggester(optionQuery("Mondo/Fazioni"), useLinks(partial)):fazioni]`

## PNG importanti

```dataview
TABLE ruolo, stato
FROM "Mondo/Personaggi"
WHERE luogo = this.file.link OR contains(fazioni, this.file.link)
```

## Problemi attuali

```meta-bind
INPUT[list:problemi]
```

> [!pericolo] Problemi attuali
> 

## Segreti

> [!segreto]- Segreti
> 
