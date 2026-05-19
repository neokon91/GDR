<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Sala di Controllo
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Descrizione
>

> [!lettura] Descrizione da leggere
>

## Funzione narrativa

> [!scena] Funzione narrativa
>

## PNG collegati

```dataview
TABLE ruolo, stato
FROM "Mondi/Personaggi"
WHERE luogo = this.file.link
```

## Eventi

> [!scena] Eventi
>

## Segreti

> [!segreto]- Segreti
>

## Hook narrativi
