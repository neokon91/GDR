<% await tp.user.crea_scena(tp) %>
# `=this.nome`

> [!infobox|scena] Scena
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Esito / cosa cambia** | `INPUT[text:esito]` |
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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderFiloAvventura");
```
%%prosa%%
## Situazione
> [!question]- 💡 Situazione: cosa trovano i PG quando arrivano

## Complicazione
> [!question]- 💡 Complicazione: cosa la rende difficile o interessante

## Uscite
> [!question]- 💡 Uscite: come e dove si può proseguire

%%/prosa%%

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

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

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
