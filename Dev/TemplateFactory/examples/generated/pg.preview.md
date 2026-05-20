<% await tp.user.pg(tp) %>
# `=this.nome`

> [!infoboxwiki]- PG
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Pubblico: `INPUT[toggle:pubblico]`
>
> Canonico: `INPUT[canonico][:canonico]`

````tabs
tab: Tavolo

> [!scena] Identita
> `INPUT[text:identita]`
>
> > [!lettura]- Versione pubblica
> > `INPUT[text:player_safe]`
>
> > [!segreto]- Livello DM
> > `INPUT[text:segreto]`

> [!missione] Uso Al Tavolo
> Gancio: `INPUT[text:gancio]`
>
> Uso: `INPUT[text:uso_al_tavolo]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`
>
> Conseguenza: `INPUT[text:conseguenza_potenziale]`

tab: Connessioni

> [!regia] Collegala Subito
> `INPUT[connessioni][:connessioni]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE contains(this.connessioni, file.link)
SORT categoria ASC, file.name ASC
```

tab: Controllo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCreationFeedback(dv);
```


```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderWorldImpact(dv);
```

````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Identita |  |
| Gancio |  |
| Uso al tavolo |  |
| Prossima mossa |  |
| Conseguenza potenziale |  |
| Connessioni |  |
| Entita impattate |  |
| Propaga a |  |
| Versione pubblica |  |
