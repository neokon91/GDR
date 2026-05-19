<% await tp.user.png(tp) %>
# `=this.nome`

>[!infobox|wiki right]
>**Ruolo**: `=this.ruolo`
>**Stato**: `=this.stato`
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

## Personalità

> [!png] Tratti al tavolo
> 

## Vuole

> [!missione] Vuole
> 

## Sa

> [!indizio] Sa
> 

## Relazioni

`INPUT[inlineListSuggester(optionQuery("Mondo/Personaggi"), useLinks(partial)):relazioni]`

## Fazioni

`INPUT[inlineListSuggester(optionQuery("Mondo/Fazioni"), useLinks(partial)):fazioni]`

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
