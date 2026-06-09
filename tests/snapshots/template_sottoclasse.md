<% await tp.user.crea_sottoclasse(tp) %>
# `=this.nome`

> [!infobox|sottoclasse] 🎓 Sottoclasse
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(sottoclasse)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Sottoclasse
> **Cos'è** · Una specializzazione di una tua classe homebrew, coi privilegi che si sbloccano salendo di livello.
> **Campi chiave** · Collega la **Classe** (la lega al level-up); scrivi i **Privilegi** ai livelli canonici 3/6/10/14.


````tabs
--- 🎓 Privilegi

I privilegi di sottoclasse si ottengono ai livelli **3 / 6 / 10 / 14**.

%%prosa%%
## Privilegi
> [!question]- 💡 Privilegi (livelli 3/6/10/14)

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Classe**: `INPUT[suggester(optionQuery("Mondi/Classi"), useLinks(partial), allowOther):classe]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
