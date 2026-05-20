<% await tp.user.arco_da_conflitto(tp) %>
# `=this.nome`

>[!infobox|wiki]- Arco narrativo
> Stato:
> `INPUT[inlineSelect(option(proposta, Proposta), option(accettata, Accettata), option(in corso, In Corso), option(conclusa, Conclusa), option(archiviata, Archiviata)):stato]`
>
> Pressione:
> `INPUT[slider(minValue(0), maxValue(10), stepSize(1), addLabels):pressione]`
>
> Scadenza:
> `INPUT[text:scadenza_mondo]`
>
> Campagne:
> `INPUT[campagne][:campagne]`
>
> Conflitti:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Conflitti"), useLinks(partial)):conflitti]`

## Posta In Gioco

> [!missione] Cosa cambia davvero
> `=this.posta`

## Fronte

> [!timer] Prossima mossa
> `=this.prossima_mossa`

## Missioni Figlie

```dataview
TABLE stato, pressione, scadenza_mondo, luoghi, ricompense
FROM "Mondi/Missioni"
WHERE contains(this.missioni_figlie, file.link) OR contains(conflitti, this.conflitti)
SORT pressione DESC, stato ASC
```

## Prime Scene

- [ ] Segnale del conflitto:
- [ ] Primo alleato:
- [ ] Primo prezzo:
- [ ] Scelta che peggiora qualcosa:

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```
