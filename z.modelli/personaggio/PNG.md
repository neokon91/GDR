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

> [!png] Al tavolo
> Vuole: `=this.vuole`
>
> Sa: `=this.sa`
>
> > [!scena]- Leva
> > `=this.leva`
>
> > [!segreto]- Segreto
> > `=this.segreto`

> [!lettura] Player Safe
> Cosa i personaggi possono sapere: `INPUT[text:player_safe]`

> [!segreto]- DM
> Verita privata o leva nascosta: `INPUT[text:segreto]`

> [!regia] Gestione
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]`
>
> `BUTTON[revisione-lore-revisione-lore-default]`

```dataviewjs
const name = dv.current().name ?? dv.current().nome ?? dv.current().file.name;
dv.paragraph("```statblock\nmonster: " + name + "\n```");
```

````tabs
tab: Identità

## Creazione Rapida

Compila questi campi prima di aggiungere statblock, relazioni o dettagli lunghi.

```meta-bind
INPUT[list:scene]
```

```meta-bind
INPUT[list:voci]
```

## Personalità

> [!png]- Tratti al tavolo
>

## Vuole

`INPUT[text:vuole]`

> [!missione]- Vuole
> `=this.vuole`
>

## Sa

`INPUT[text:sa]`

> [!indizio]- Sa
> `=this.sa`
>

tab: Collegamenti

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

tab: Segreti

## Segreto

`INPUT[text:segreto]`

> [!segreto]- Segreto
> `=this.segreto`
>

## Leva Al Tavolo

`INPUT[text:leva]`

> [!scena] Leva
> `=this.leva`

## Pressione

> [!timer]- Se ignorato
> Innesco: `=this.innesco`
>
> Prossima mossa: `=this.prossima_mossa`
>
> Pressione: `=this.pressione`

## Conseguenze

```meta-bind
INPUT[list:conseguenze]
```

## Entità Impattate

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`

## Propaga A

`INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

## Uso Al Tavolo

> [!scena]- Uso al tavolo
>

## Arricchisci Dopo

```meta-bind
INPUT[list:mosse_visibili]
```

```meta-bind
INPUT[list:domande_aperte]
```

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
