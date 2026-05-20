<% await tp.user.world_entity(tp) %>
# `=this.nome`

> [!infoboxwiki]- World Entity
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato base][:stato]`
>
> Tipo: `=this.tipo`
>
> Pubblico: `INPUT[toggle:pubblico]`
>
> Canonico: `INPUT[canonico][:canonico]`

````tabs
tab: Crea

> [!scena] Identita
> `INPUT[text:identita]`
>
> > [!lettura]- Versione pubblica
> > `INPUT[text:player_safe]`
>
> > [!segreto]- Livello DM
> > `INPUT[text:segreto]`

> [!missione] Uso Al Tavolo
> `INPUT[text:uso_al_tavolo]`
>
> > [!timer]- Conseguenza
> > `INPUT[text:conseguenza_potenziale]`
>
> > [!conflitto]- Prossima mossa
> > `INPUT[text:prossima_mossa]`

tab: Connessioni

> [!regia] Collegala Subito
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):connessioni]`

tab: Controllo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCreationFeedback(dv);
```
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Identita |  |
| Uso al tavolo |  |
| Connessioni |  |
| Versione pubblica |  |
