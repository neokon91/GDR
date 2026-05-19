<% await tp.user.pg(tp) %>
# `=this.nome`

>[!infobox|wiki right]
>**Giocatore**: `=this.giocatore`
>**Classe**: `=this.classe`
>**Livello**: `=this.livello`
>**Specie**: `=this.specie`
>**Stato**: `=this.stato`
>**Mondo**: `=this.mondo`
>**HP**: `VIEW[{hp_attuali}]` / `VIEW[{hp_massimi}]`
>
>```meta-bind-js-view
>{hp_massimi} as max
>---
>const slider = `
>\`INPUT[slider(
>  minValue(0),
>  maxValue(${context.bound.max ?? 100}),
>  stepSize(1),
>  addLabels,
>  class(hp-slider),
>  title(Punti Ferita correnti)
>):hp_attuali]\`
>`;
>
>return engine.markdown.create(slider);
>```

> [!png] Identità
>

Mondo:
`INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`

## Legami

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):relazioni]`

## Fazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT nome ASC
```

## Al Tavolo

> [!scena] Spotlight
>

## Obiettivi

> [!missione] Obiettivi
>

## Segreti

> [!segreto]- Segreti
>

## Note Di Campagna

## Missioni E Sessioni

```dataview
TABLE stato, committente, luoghi, fazioni
FROM "Mondi/Missioni"
WHERE contains(personaggi, this.file.link)
SORT stato ASC, nome ASC
```

```dataview
TABLE data, stato, campagne
FROM "Mondi/Sessioni"
WHERE contains(personaggi, this.file.link)
SORT data DESC
LIMIT 10
```
