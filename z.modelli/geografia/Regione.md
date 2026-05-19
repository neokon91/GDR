<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infobox|wiki]- Regione
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`
>
> Regione superiore:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_padre]`
>
> Bioma:
> `INPUT[text:bioma]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`

> [!luogo] Descrizione
>

## Luoghi Contenuti

```dataview
TABLE tipo, stato, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT nome ASC
```

## Risorse

```meta-bind
INPUT[list:risorse]
```

## Pericoli

> [!pericolo] Minacce della regione
>

## Segreti

> [!segreto]- Segreti
>
