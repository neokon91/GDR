<% await tp.user.crea_sessione(tp) %>
# `=this.nome`

> [!info]- ℹ️ Guida — Sessione
> **Cos'è** · Il foglio di una singola sessione: obiettivo, scena d'apertura e la checklist di prep (Tasks) per condurre il tavolo.
> **Campi chiave** · **Mondo** + **Obiettivo** (cosa deve accadere) + **Scena d'apertura**; usa i tag #prep/#gancio per far comparire la sessione nei fili narrativi della Home.


````tabs
--- ✅ Prepara

> [!tip] Obiettivo
> `INPUT[text(placeholder(es. fermare il rito prima dell'alba)):obiettivo]`

> [!quote]- Apertura
> `INPUT[text(placeholder(la scena con cui apri la sessione)):apertura]`

> [!warning]- Pressioni
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text(placeholder(es. il barone raddoppia le guardie)):prossima_mossa]`

> [!todo]- Prep di sessione
> Spunta mentre prepari. Compaiono in Home → *Al tavolo* finché aperte.
> - [ ] Recap della scorsa sessione #prep
> - [ ] Incontri probabili pronti #prep
> - [ ] Clock e fronti aggiornati #prep
> - [ ] Un gancio nuovo da seminare #gancio

--- 🎲 Tavolo

> [!info] Live
> Scena corrente: `INPUT[text(placeholder(dove si trova il gruppo adesso)):scena_corrente]`
>
> Tiro rapido: `dice: 1d20` · Data in gioco: `BUTTON[inserisci-data]`

> [!todo]- Task
> ```tasks
> not done
> path includes Mondi/Sessioni
> ```

--- 🔗 Collegamenti

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderSessionPanel");
```
````
