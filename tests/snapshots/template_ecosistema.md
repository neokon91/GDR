<% await tp.user.crea_ecosistema(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|ecosistema] 🌿 Ecosistema
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(naturale), option(magico), option(sacro), option(mutato), option(instabile), option(artificiale)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Ecosistema
> **Cos'è** · L'ecosistema è la rete vivente dentro un bioma: chi mangia chi, quali cicli lo reggono e cosa lo sta spezzando.
> **Campi chiave** · **Tipo** e la relazione **Bioma**; sul Carattere **Equilibrio** (autopoietico→collassante) ne misura la stabilità — l'asse che alimenta i Fronti ecologici.
> **Spunti** · Qual è l'anello debole della catena — la specie che, se sparisce, fa crollare tutto? Cosa lo sta spezzando proprio ora, e chi se ne accorgerà per primo? Cosa accade al mondo intorno se questo equilibrio salta?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Composizione
> [!question]- 💡 Composizione: chi e cosa lo abita

## Equilibri
> [!question]- 💡 Equilibri: catene, simbiosi, predatori/prede

## Cicli
> [!question]- 💡 Cicli: stagioni, migrazioni, rigenerazione

## Minacce
> [!question]- 💡 Minacce: cosa lo sta spezzando

> [!rivela|segreto]- Segreto
> 💡 *Il segreto dell'ecosistema*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Bioma**: `INPUT[suggester(optionQuery("Mondi/Biomi"), useLinks(partial), allowOther):bioma]`
> **Specie coinvolte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):specie]`
> **Dove si trova**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

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
