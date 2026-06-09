<% await tp.user.crea_risorsa(tp) %>
# `=this.nome`

> [!infobox|risorsa] 📦 Risorsa
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Fonte** | `INPUT[text:fonte]` |
> | **Scarsità** | `INPUT[scarsita][:scarsita]` |
> | **Usi** | `INPUT[text:usi]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(materia prima), option(bene lavorato), option(bene di lusso), option(risorsa magica), option(risorsa strategica)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(vitale), option(bellica), option(arcana), option(voluttuaria), option(simbolica)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **vitale** — Necessaria alla sopravvivenza: cibo, acqua, sale, legname — chi la perde muore o si piega.
> **bellica** — Alimenta la guerra: metalli, cavalli, salnitro, acciaio — chi la controlla detta i conflitti.
> **arcana** — Carburante della magia: reagenti, reliquie, cristalli — rara, instabile, sempre contesa.
> **voluttuaria** — Lusso e status: spezie, gemme, sete — muove ricchezza e desiderio, non necessità.
> **simbolica** — Valore culturale/sacro oltre l'uso: ostie, insegne, materiali rituali — il prezzo è identità.

> [!info]- ℹ️ Guida — Risorsa
> **Cos'è** · Una risorsa è ciò che il mondo produce, commercia e si contende: il sostrato materiale che dà stakes concreti a Fronti e guerre.
> **Campi chiave** · **Tipo** + **famiglia** (vitale, bellica, arcana…); **Scarsità** e **Fonte** la rendono interrogabile; **Controllata da** la lega alla fazione che la domina.
> **Spunti** · Chi la controlla oggi — e chi la vuole abbastanza da uccidere per averla? Cosa succede al mondo se sparisce, o se qualcuno ne ottiene il monopolio? Da dove viene davvero, e cosa nasconde la sua filiera?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Produzione
> [!question]- 💡 Come si ottiene / si produce e dove

## Ruolo economico
> [!question]- 💡 Ruolo economico: chi la vuole e perché conta

## Tensione
> [!question]- 💡 Conflitto attorno alla risorsa (chi se la contende)

> [!rivela|segreto]- Segreto
> 💡 *Segreto della risorsa*
>

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
> **Controllata da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`
> **Prodotta in**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):prodotta_in]`
> **Consumata da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):consumata_da]`
> **Trasportata su**: `INPUT[inlineListSuggester(optionQuery("Mondi/Rotte"), useLinks(partial), allowOther):trasportata_su]`

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
