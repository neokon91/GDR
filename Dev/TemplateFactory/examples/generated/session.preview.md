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
