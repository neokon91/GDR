<% await tp.user.crea_scena(tp) %>
# `=this.nome`

> [!infobox|scena] Scena
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Esito / cosa cambia** | `VIEW[{esito} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(scena), option(apertura), option(snodo), option(climax), option(interludio)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Scena
> **Cos'è** · Una scena è un beat dell'avventura: dove sei, cosa succede, dove puoi andare. Le scene collegate da «Conduce a» formano il flusso non-lineare; gli «Indizi» le legano in un mistero.
> **Campi chiave** · **Ruolo** (apertura/snodo/climax…); **Conduce a** per il flusso; **Indizi** + gli snodi **chiave** per la regola dei 3 indizi (≥3 vie a ogni rivelazione).


````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!abstract] Scheda
> Esito / cosa cambia: `INPUT[text:esito]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderFiloAvventura");
```
> [!note] Situazione
> `INPUT[textArea:situazione]`

> [!note] Complicazione
> `INPUT[textArea:complicazione]`

> [!note] Uscite
> `INPUT[textArea:uscite]`


--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 🔗 Collegamenti

> [!example] Relazioni
> **Avventura**: `INPUT[suggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missione]`
> **Conduce a**: `INPUT[inlineListSuggester(optionQuery("Mondi/Scene"), useLinks(partial), allowOther):conduce_a]`
> **Dove**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **PNG in scena**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):png]`
> **Incontri**: `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial), allowOther):incontri]`
> **Rivelata dagli indizi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Indizi"), useLinks(partial), allowOther):indizi]`
> **Indizi presenti qui**: `INPUT[inlineListSuggester(optionQuery("Mondi/Indizi"), useLinks(partial), allowOther):indizi_qui]`

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
