<% await tp.user.crea_rotta(tp) %>
# `=this.nome`

> [!infobox|rotta] 🛣️ Rotta
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Merci trasportate** | `INPUT[text:merci]` |
> | **Pericoli** | `INPUT[text:pericoli]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(terrestre), option(marittima), option(fluviale), option(carovaniera), option(contrabbando)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Rotta
> **Cos'è** · Una rotta è una via di traffico fra luoghi: cosa vi passa, chi la controlla, cosa la minaccia. Tagliarla è una mossa che muove l'economia e i Fronti.
> **Campi chiave** · **Tipo** (terrestre/marittima/…) e gli estremi che **Collega**; **Merci** e **Pericoli** la qualificano; **Controllata da** la lega alla fazione che la domina.
> **Spunti** · Cosa vi scorre — merci, persone, segreti? Chi la controlla, e chi pretende il pedaggio? Cosa la minaccia, e cosa crolla se si chiude?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Percorso
> [!question]- 💡 Percorso: da dove a dove, attraverso cosa

## Traffico
> [!question]- 💡 Traffico: chi la usa, cosa vi passa, quanto vale

## Rischi
> [!question]- 💡 Rischi: chi la minaccia, cosa succede se si chiude

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Collega (estremi)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):estremi]`
> **Tappe intermedie**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):tappe_luoghi]`
> **Controllata da**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`
> **Risorse in transito**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
````

> [!tip] ＋ Componenti
> Aggiungi ciò che ti serve, quando ti serve — **Al tavolo**, **Clock del fronte**, **Carattere**, **Cronologia**, **Vista**…
> `BUTTON[aggiungi-componente]`
>
> `BUTTON[marca-canonico]` · `BUTTON[archivia-nota]`
