<% await tp.user.crea_dominio(tp) %>
# `=this.nome`

> [!infobox|dominio] 🌐 Dominio
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(sfera ontologica), option(principio attivo), option(aspetto cosmico)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(ordine), option(caos), option(vita), option(morte), option(natura), option(conoscenza), option(energia), option(fato)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **ordine** — La sfera della struttura, della legge e della stabilità.
> **caos** — La sfera del mutamento, dell'imprevedibile e della distruzione.
> **vita** — La sfera della crescita, della nascita e della fertilità.
> **morte** — La sfera della fine, del trapasso e dell'oltretomba.
> **natura** — La sfera del mondo vivente, degli elementi e dei cicli naturali.
> **conoscenza** — La sfera del sapere, della mente e della verità.
> **energia** — La sfera del potere grezzo, della magia e delle forze primarie.
> **fato** — La sfera del destino, del tempo e degli eventi predeterminati.

> [!info]- ℹ️ Guida — Dominio
> **Cos'è** · Un dominio è una sfera ontologica della realtà (la Morte, il Tempo, l'Identità): l'hub che lega leggi, magie, piani ed entità affini.
> **Campi chiave** · **Famiglia** (ordine, caos, vita, morte…) dice di quale ambito è sfera; le relazioni a Leggi/Piani/Primordiali ne costruiscono il nodo nel grafo.
> **Spunti** · Di quale aspetto della realtà è la sfera — e cosa mette in moto? Con quale dominio opposto è in tensione, e chi vince adesso? Quali divinità o primordiali lo incarnano nel mondo?

````tabs
--- 📖 Lore


%%prosa%%
## Natura
> [!question]- 💡 Natura: cosa governa, di cosa è la sfera

## Dinamica
> [!question]- 💡 Dinamica: come opera, cosa mette in moto nel cosmo

## Tensione
> [!question]- 💡 Tensione: con quali domini confligge o si bilancia

## Manifestazioni
> [!question]- 💡 Manifestazioni: segni del dominio nel mondo mortale

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Leggi fondamentali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Magie del dominio**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Entità collegate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):entita]`
> **Piani collegati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Divinità affini**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Domini in tensione**: `INPUT[inlineListSuggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):domini_opposti]`
> **Incantesimi del dominio**: `INPUT[inlineListSuggester(optionQuery("Mondi/Incantesimi"), useLinks(partial), allowOther):incantesimi]`

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
