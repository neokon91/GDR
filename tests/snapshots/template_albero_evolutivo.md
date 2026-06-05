<% await tp.user.crea_albero_evolutivo(tp) %>
# `=this.nome`

> [!infobox|albero_evolutivo] Albero evolutivo
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Portata** | `VIEW[{portata} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(tradizione), option(lignaggio), option(evoluzione), option(iniziazione), option(dottrina)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Albero evolutivo
> **Cos'è** · Una progressione a tappe narrativa — i gradi di una tradizione, di un lignaggio o di un'iniziazione — resa a grado nella nota.
> **Campi chiave** · Imposta la proprietà **nodi** (grado | nome | prerequisito | effetto): è il cuore reso nella nota; aggancia a **Tradizione magica**/**Specie**/**Culto**.
> **Spunti** · Cosa custodisce l'accesso al primo grado? Che prova o costo separa un grado dal successivo? Chi sono gli esempi viventi all'apice?

````tabs
--- 📖 Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`

> [!note] Origine
> `INPUT[textArea:origine]`

> [!note] Accesso e avanzamento
> `INPUT[textArea:accesso]`


--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 🌳 Albero

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderAlbero");
```
--- 🔗 Collegamenti

> [!example] Relazioni
> **Tradizione magica**: `INPUT[suggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistema_magico]`
> **Specie**: `INPUT[suggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):specie]`
> **Culto / ordine**: `INPUT[suggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culto]`
> **Esempi viventi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

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
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
