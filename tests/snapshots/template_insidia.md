<% await tp.user.crea_insidia(tp) %>
# `=this.nome`

> [!info] ⚠️ Insidia
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
> **Livello di gioco** `VIEW[{tier} ?? "—"]` · **Minaccia** `VIEW[{minaccia} ?? "—"]` · **Prova** `VIEW[{prova} ?? "—"]` · **Danno / Effetto** `VIEW[{danno} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

> [!info] Famiglia: `INPUT[inlineSelect(option(meccanica), option(magica), option(naturale), option(biologica), option(ambientale)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **meccanica** — Trappola fisica: lame, fosse, pressione, congegni.
> **magica** — Trappola arcana: glifi, maledizioni, effetti incantati.
> **naturale** — Pericolo dell'ambiente: frane, gas, gelo, correnti.
> **biologica** — Minaccia vivente: spore, veleni, parassiti, malattie.
> **ambientale** — Condizione persistente dell'area: oscurità, terreno, clima.

````tabs
--- Insidia

> [!abstract] Scheda
> Livello di gioco: `INPUT[tier][:tier]`
> Minaccia: `INPUT[minaccia][:minaccia]`
> Prova: `INPUT[text:prova]`
> Danno / Effetto: `INPUT[text:danno]`

--- Scena

> [!note] Innesco
> `INPUT[textArea:innesco]`

> [!note] Effetto
> `INPUT[textArea:effetto]`

> [!note] Contromisure
> `INPUT[textArea:contromisure]`


> [!tip]- Tiri
> `dice: 1d20`

--- Collegamenti


> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`
--- Vista

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(views.renderEntityPanel(dv, page));
```
````
