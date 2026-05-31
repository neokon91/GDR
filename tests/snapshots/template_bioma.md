<% await tp.user.crea_bioma(tp) %>
# `=this.nome`

> [!info] Bioma
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Clima: `INPUT[clima][:clima]`

> [!note] Geografia
> `INPUT[textArea:geografia]`

> [!note] Flora e fauna
> `INPUT[textArea:flora_fauna]`

> [!note] Fenomeni
> `INPUT[textArea:fenomeni]`

> [!note] Risorse
> `INPUT[textArea:risorse]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Carattere

> [!abstract] Carattere
> **Ostilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):ostilita]`
> **Fertilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):fertilita]`
> **Magia Ambientale** `INPUT[slider(minValue(1), maxValue(5), addLabels):magia_ambientale]`
> **Accessibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):accessibilita]`

> [!note]- Ostilità — Quanto il bioma è pericoloso per chi lo attraversa.
> **1 · Ospitale** — Sicuro e accogliente; sopravvivere è facile.
> **2 · Mite** — Pochi pericoli, gestibili con prudenza.
> **3 · Aspro** — Duro; richiede preparazione e rispetto.
> **4 · Ostile** — Insidie costanti; il bioma vuole respingerti.
> **5 · Letale** — Mortale; sopravvivere è un'impresa rara.

> [!note]- Fertilità — Quanta vita e risorse il bioma sostiene.
> **1 · Sterile** — Quasi morto; nulla cresce, nulla resta.
> **2 · Magro** — Vita scarsa e tenace; risorse rare.
> **3 · Modesto** — Sostiene una vita stabile ma non abbondante.
> **4 · Rigoglioso** — Vita ricca; risorse e specie in quantità.
> **5 · Lussureggiante** — Esplosione di vita; sovrabbondante e vorace.

> [!note]- Magia Ambientale — Quanto la magia permea il bioma.
> **1 · Mondano** — Nessuna magia; natura ordinaria.
> **2 · Toccato** — Tracce o residui magici occasionali.
> **3 · Intriso** — La magia è percepibile; fenomeni regolari.
> **4 · Carico** — La magia plasma flora, fauna e clima.
> **5 · Saturo** — Realtà alterata; la magia detta le regole.

> [!note]- Accessibilità — Quanto è facile raggiungere e percorrere il bioma.
> **1 · Aperto** — Facile da attraversare; rotte e accessi noti.
> **2 · Praticabile** — Percorribile con guida o sentieri.
> **3 · Impervio** — Difficile; ostacoli naturali continui.
> **4 · Remoto** — Isolato; pochi sanno come arrivarci.
> **5 · Inaccessibile** — Quasi irraggiungibile; barriere estreme o magiche.

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
```

--- Collegamenti

> [!example] Relazioni
> **Luoghi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Specie tipiche**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):specie]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

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

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
