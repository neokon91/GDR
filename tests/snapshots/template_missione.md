<% await tp.user.crea_missione(tp) %>
# `=this.nome`

> [!infobox|missione] 🎯 Missione
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Dove** | `VIEW[{luogo}][link]` |
> | **Fazione dietro** | `VIEW[{fazione}][link]` |
> | **Stato della missione** | `INPUT[stato_missione][:stato_missione]` |
> | **Ricompensa** | `INPUT[text:ricompensa]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(incarico), option(caccia), option(recupero), option(scorta), option(indagine), option(eliminazione)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Missione
> **Cos'è** · Una missione è un incarico per i PG: chi la dà, cosa chiede, cosa offre — il filo che traccia un arco di gioco oltre i task #gancio/#trama.
> **Campi chiave** · **Tipo** (incarico, caccia, recupero…) e **Committente**; **Ricompensa** e **Stato** (proposta→in corso→completata/fallita) per seguirla; collega **Dove** e i **PNG**.
> **Spunti** · Chi la affida, e cosa nasconde sul vero motivo? Qual è la posta se i PG falliscono? Dove può tradire, voltandosi contro chi l'accetta?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Obiettivo
> [!question]- 💡 Obiettivo: cosa devono ottenere i PG

## Complicazione
> [!question]- 💡 Complicazione: cosa va storto o si nasconde

## Posta in gioco
> [!question]- 💡 Posta in gioco: cosa succede a successo / fallimento

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
> **Dove**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **PNG coinvolti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):png]`
> **Fazione dietro**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`
> **Scene**: `INPUT[inlineListSuggester(optionQuery("Mondi/Scene"), useLinks(partial), allowOther):scene]`
> **Ricompensa (oggetto)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):ricompensa_oggetto]`
> **Nasce dall'evento**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):evento_origine]`

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
