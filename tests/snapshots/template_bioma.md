<% await tp.user.crea_bioma(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|bioma] 🌲 Bioma
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Clima** | `INPUT[clima][:clima]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(foresta), option(deserto), option(tundra), option(oceano), option(montagna), option(pianura), option(palude), option(sotterraneo), option(planare)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Bioma
> **Cos'è** · Il bioma è l'ambiente di un luogo: clima, flora/fauna e fenomeni, e arricchisce di ecologia i luoghi che lo contengono.
> **Campi chiave** · **Tipo** e **Clima** lo inquadrano; sul Carattere **Ostilità** e **Fertilità** dicono quanto è pericoloso e quanta vita sostiene.
> **Spunti** · Cosa rende questo bioma diverso dal solito? (un fenomeno, una creatura, una regola che cambia) Cosa vi attira gli avventurieri — e cosa li fa pentire di esserci entrati? Quale risorsa o pericolo nasconde sotto la superficie?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Geografia
> [!question]- 💡 Geografia: com'è fatto, cosa lo distingue

## Flora e fauna
> [!question]- 💡 Flora e fauna caratteristiche

## Fenomeni
> [!question]- 💡 Fenomeni: meteo, magia ambientale, pericoli naturali

## Risorse
> [!question]- 💡 Risorse: cosa offre (e cosa attira)

> [!rivela|segreto]- Segreto
> 💡 *Cosa nasconde il bioma*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Luoghi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Specie tipiche**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):specie]`
> **Ecosistemi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Ecosistemi"), useLinks(partial), allowOther):ecosistemi]`
> **Risorse del bioma**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse_naturali]`

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
