<% await tp.user.personaggio(tp) %>
# `=this.nome`
>[!infobox|wiki right]
>**Ruolo**: `=this.ruolo`
>**Stato**: `=this.stato`
>**Mondo**: `=this.mondo`
>**Luogo**: `=this.luogo`
>**Età**: `=this.eta`
>**Genere**: `=this.genere`
>**Allineamento**: `=this.allineamento`
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

## Identità

Mondo:
`INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo]`

## Statblock D&D

```dataviewjs
const name = dv.current().name ?? dv.current().nome ?? dv.current().file.name;
dv.paragraph("```statblock\nmonster: " + name + "\n```");
```

## Personalità

## Obiettivi

`INPUT[text:vuole]`

> [!missione] Vuole
> `=this.vuole`

## Cosa Sa

`INPUT[text:sa]`

> [!indizio] Sa
> `=this.sa`

## Relazioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial)):relazioni]`

## Missioni

`INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial)):missioni]`

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

## Sessioni

```dataview
TABLE data, stato, campagne
FROM "Mondi/Sessioni"
WHERE contains(personaggi, this.file.link)
SORT data DESC
LIMIT 10
```

## Segreti

`INPUT[text:segreto]`

> [!segreto]- Segreti
> `=this.segreto`
>

## Leva Al Tavolo

`INPUT[text:leva]`

> [!scena] Leva
> `=this.leva`

## Note GM
