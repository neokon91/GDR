<% await tp.user.sessione(tp) %>
# `=this.nome`

````tabs
tab: Prepara

> [!scena] Cinque Blocchi
> Obiettivo: `INPUT[text:obiettivo]`
>
> Prima scena: `INPUT[text:apertura]`
>
> Scelta concreta: `INPUT[text:scelta]`
>
> > [!timer]- Pressioni
> > `INPUT[inlineList:pressioni]`
>
> > [!lettura]- Materiale pronto
> > `INPUT[inlineList:materiale_pronto]`
>
> Incontri: `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial), allowOther):incontri]`
>
> Mappe: `INPUT[inlineListSuggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):mappe]`
>
> Dispense: `INPUT[inlineListSuggester(optionQuery("Mondi/Dispense"), useLinks(partial), allowOther):dispense]`

> [!incontro]- Crea Materiale
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]`
>
> `BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`
>
> `BUTTON[nuova-dispensa-z-modelli-dispensa-md-default]`

tab: Ancore

> [!luogo] Tre Ancore Minime
> Mondo: `INPUT[mondo][:mondo]`
>
> Luoghi: `INPUT[luoghi][:luoghi]`
>
> Fazioni: `INPUT[fazioni][:fazioni]`
>
> Missioni: `INPUT[missioni][:missioni]`
>
> Clock: `INPUT[tracciati][:tracciati]`
>
> PNG: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):personaggi]`

tab: Media

> [!lettura] Supporti Al Tavolo
> Audio: `INPUT[inlineListSuggester(optionQuery("Risorse/Audio"), useLinks(partial), allowOther):audio]`
>
> Immagini: `INPUT[inlineListSuggester(optionQuery("Risorse/Immagini"), useLinks(partial), allowOther):immagini]`
>
> Video: `INPUT[inlineListSuggester(optionQuery("Risorse/Video"), useLinks(partial), allowOther):video]`

> [!todo] Task Preparazione
> - [ ] Completa obiettivo, apertura e scelta #task
> - [ ] Collega almeno tre ancore mondo #task
> - [ ] Prepara almeno un incontro, handout, mappa o media #task

tab: Live

> [!regia] Cockpit
> Attiva al tavolo: `INPUT[toggle:attiva]`
>
> Scena corrente: `INPUT[text:scena_corrente]`
>
> `BUTTON[durante-il-gioco-durante-il-gioco]`

tab: Dopo

> [!timer] Delta Del Mondo
> ```meta-bind
> INPUT[list:conseguenze]
> ```
>
> > [!lettura]- Recap pubblico
> > ```meta-bind
> > INPUT[list:recap_pubblico]
> > ```
>
> > [!segreto]- Recap DM
> > ```meta-bind
> > INPUT[list:recap_dm]
> > ```
````

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderPlayableOutline(dv, dv.current());
```

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Obiettivo |  |
| Prima scena |  |
| Scelta concreta |  |
| Pressioni |  |
| Materiale pronto |  |
| Incontri |  |
| Mappe |  |
| Dispense |  |
| Media |  |
