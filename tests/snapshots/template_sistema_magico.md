<% await tp.user.crea_sistema_magico(tp) %>
# `=this.nome`

> [!infobox|sistema_magico] 🪄 Sistema magico
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Fonte del potere** | `INPUT[fonte_potere][:fonte_potere]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(tradizione arcana), option(disciplina elementale), option(arte proibita), option(dono innato), option(tecnica rituale)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Sistema magico
> **Cos'è** · Un sistema magico descrive come funziona la magia nel mondo — da dove viene, come si pratica, cosa costa, cosa rischia — distinto dal singolo incantesimo.
> **Campi chiave** · **Fonte del potere** e **Tipo**; sul Carattere gli assi **Fonte/Metodo/Costo/Rischio**, che insieme generano l'archetipo (dono, patto, selvaggia, accademica…).
> **Spunti** · Da dove viene il potere — e che prezzo esige da chi lo usa? Come si pratica: parole, sangue, patti, sigilli? E cosa va storto? Chi può impararla, e chi è escluso o la teme?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Fonte
> [!question]- 💡 Fonte: da dove viene il potere

## Metodo
> [!question]- 💡 Metodo: come si pratica (parole, gesti, sangue, patti)

## Dottrina
> [!question]- 💡 Dottrina: la visione del mondo, l'etica o la filosofia che la magia incarna

## Costo
> [!question]- 💡 Costo e limiti: cosa esige da chi la usa

## Rischi
> [!question]- 💡 Rischi: cosa va storto, corruzione, ricaduta

## Manifestazioni
> [!question]- 💡 Manifestazioni: come si riconosce nel mondo

> [!rivela|segreto]- Segreto
> 💡 *La verità nascosta sulla sua origine o sul suo prezzo*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Leggi su cui poggia**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Dominio cosmico**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Fonti / risonanze**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):fonti]`
> **Piani di risonanza**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Luoghi-nodo**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi_nodo]`
> **Incantesimi del sistema**: `INPUT[inlineListSuggester(optionQuery("Mondi/Incantesimi"), useLinks(partial), allowOther):incantesimi]`
> **Divinità fonte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Oggetti magici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):oggetti]`
> **Specie dotate (dono innato)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):specie]`
> **Alberi / tradizioni di mastery**: `INPUT[inlineListSuggester(optionQuery("Mondi/Alberi"), useLinks(partial), allowOther):alberi]`

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
