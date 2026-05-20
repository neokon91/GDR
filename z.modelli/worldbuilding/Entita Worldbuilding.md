<% await tp.user.world_entity(tp) %>
# `=this.nome`

> [!infoboxwiki]- Codex
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
> Una voce isolata resta enciclopedia. Scegli almeno due note vive.
>
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):connessioni]`

```dataview
TABLE categoria, tipo, stato, pressione, prossima_mossa
FROM "Mondi"
WHERE contains(this.connessioni, file.link)
SORT categoria ASC, file.name ASC
```

> [!timer]- Propagazione
> Entita impattate:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):entita_impattate]`
>
> Propaga a:
> `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):propaga_a]`

tab: Articolo

> [!lettura] Cosa Sa Un Abitante
> ```meta-bind
> INPUT[list:abitante_sa]
> ```

> [!segreto]- Cosa Sa Il DM
> ```meta-bind
> INPUT[list:dm_sa]
> ```

> [!scena] Cosa Cambia Al Tavolo
> ```meta-bind
> INPUT[list:cambia_al_tavolo]
> ```

tab: Controllo

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderCreationFeedback(dv);
```
````
