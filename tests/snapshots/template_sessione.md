<% await tp.user.crea_sessione(tp) %>
# `=this.nome`

````tabs
--- Prepara

> [!tip] Obiettivo
> `INPUT[text:obiettivo]`

> [!quote]- Apertura
> `INPUT[text:apertura]`

> [!warning]- Pressioni
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`

--- Tavolo

> [!info] Live
> Scena corrente: `INPUT[text:scena_corrente]`
>
> Tiro rapido: `dice: 1d20`

> [!todo]- Task
> ```tasks
> not done
> path includes Mondi/Sessioni
> ```

--- Collegamenti

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderSessionPanel");
```
````
