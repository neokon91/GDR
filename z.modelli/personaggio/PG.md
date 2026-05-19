<% await tp.user.pg(tp) %>
# `=this.nome`

>[!infobox|wiki right]
>**Giocatore**: `=this.giocatore`
>**Classe**: `=this.classe`
>**Livello**: `=this.livello`
>**Specie**: `=this.specie`
>**Stato**: `=this.stato`
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

## Legami

`INPUT[inlineListSuggester(optionQuery("Mondo/Personaggi"), useLinks(partial)):relazioni]`

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
