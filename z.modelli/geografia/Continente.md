<% await tp.user.luogo(tp) %>
# `=this.nome`

>[!infoboxwiki]- Continente
> Mondo:
> `INPUT[mondo][:mondo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In gioco), option(archiviata, Archiviata)):stato]`
>
> Pericolo:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pericolo]`

> [!luogo] Identità geografica
>

## Regioni

```dataview
TABLE tipo, bioma, stato, pericolo
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.file.link
SORT nome ASC
```

## Poteri Principali

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(luoghi, this.file.link) OR mondo = this.mondo
SORT nome ASC
LIMIT 12
```

## Segreti

> [!segreto]- Verità del continente
>
