<% await tp.user.png(tp) %>
# `=this.nome`

>[!infobox|wiki right]
>**Ruolo**: `=this.ruolo`
>**Stato**: `=this.stato`
>**Mondo**: `=this.mondo`
>**Luogo**: `=this.luogo`
>**Atteggiamento**: `=this.atteggiamento`
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

````tabs
tab: Identità

## Personalità

> [!png] Tratti al tavolo
>

## Vuole

> [!missione] Vuole
>

## Sa

> [!indizio] Sa
>

tab: Collegamenti

## Relazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):relazioni]`

## Fazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial)):fazioni]`

```dataview
TABLE tipo, stato, leader
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT nome ASC
```

## Missioni Collegate

```dataview
TABLE stato, committente, luoghi, fazioni
FROM "Mondi/Missioni"
WHERE contains(personaggi, this.file.link) OR committente = this.file.link
SORT stato ASC, nome ASC
```

tab: Segreti

## Segreto

> [!segreto]- Segreto
>

## Pressione

> [!timer] Se ignorato
> - [ ]
> - [ ]
> - [ ]

## Uso Al Tavolo

> [!scena] Uso al tavolo
>

tab: Sessioni

## Sessioni

```dataview
TABLE data, stato, campagne
FROM "Mondi/Sessioni"
WHERE contains(personaggi, this.file.link)
SORT data DESC
LIMIT 10
```
````
