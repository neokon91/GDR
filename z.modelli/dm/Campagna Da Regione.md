<% await tp.user.campagna_da_regione(tp) %>
# `=this.nome`

>[!infoboxwiki]- Campagna da regione
> Stato:
> `INPUT[inlineSelect(option(preparazione, Preparazione), option(in gioco, In Gioco), option(in pausa, In Pausa), option(conclusa, Conclusa), option(archiviata, Archiviata)):stato]`
>
> Profilo:
> `INPUT[inlineSelect(option(sandbox, Sandbox), option(investigativo, Investigativo), option(politico, Politico), option(esplorazione, Esplorazione), option(guerra, Guerra)):profilo]`
>
> Regione:
> `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regione]`
>
> Culture:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial)):culture]`
>
> Fazioni:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`
>
> Conflitti:
> `INPUT[inlineListSuggester(optionQuery("Mondi/Conflitti"), useLinks(partial)):conflitti]`

## Promessa Al Tavolo

> [!scena] Cosa vivranno i giocatori
> `=this.promessa`

## Ingredienti Dell'Ambientazione

```dataview
TABLE tipo, stato, pericolo, fazioni
FROM "Mondi/Luoghi"
WHERE luogo_padre = this.regione OR file.link = this.regione OR contains(this.luoghi, file.link)
SORT tipo ASC, nome ASC
```

## Poteri In Gioco

```dataview
TABLE tipo, pressione, prossima_mossa, luoghi
FROM "Mondi/Fazioni" OR "Mondi/Conflitti"
WHERE contains(this.fazioni, file.link) OR contains(this.conflitti, file.link)
SORT pressione DESC, nome ASC
```

## Prime Missioni

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa
FROM "Mondi/Missioni"
WHERE contains(campagne, this.file.link) OR contains(this.missioni, file.link) OR contains(luoghi, this.regione)
SORT pressione DESC, stato ASC
```

## Prime Tre Sessioni

- [ ] Apertura:
- [ ] Complicazione:
- [ ] Scelta difficile:

## Domande Di Campagna

```meta-bind
INPUT[list:domande_campagna]
```
