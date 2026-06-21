<% await tp.user.crea_rotta(tp) %>
# `=this.nome`

> [!infobox|rotta] 🛣️ Rotta
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Merci trasportate** | `INPUT[text:merci]` |
> | **Pericoli** | `INPUT[text:pericoli]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(terrestre), option(marittima), option(fluviale), option(carovaniera), option(contrabbando)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Rotta
> **Cos'è** · Una rotta è una via di traffico fra luoghi: cosa vi passa, chi la controlla, cosa la minaccia. Tagliarla è una mossa che muove l'economia e i Fronti.
> **Campi chiave** · **Tipo** (terrestre/marittima/…) e gli estremi che **Collega**; **Merci** e **Pericoli** la qualificano; **Controllata da** la lega alla fazione che la domina.
> **Spunti** · Cosa vi scorre — merci, persone, segreti? Chi la controlla, e chi pretende il pedaggio? Cosa la minaccia, e cosa crolla se si chiude?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Percorso
> [!question]- 💡 Percorso: da dove a dove, attraverso cosa

## Traffico
> [!question]- 💡 Traffico: chi la usa, cosa vi passa, quanto vale

## Rischi
> [!question]- 💡 Rischi: chi la minaccia, cosa succede se si chiude

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
--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "rotta", component);
```

> [!abstract] Carattere
> **Sicurezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):sicurezza]` → `VIEW[{sicurezza} == 5 ? "5 · Sicura" : ({sicurezza} == 4 ? "4 · Battuta" : ({sicurezza} == 3 ? "3 · Incerta" : ({sicurezza} == 2 ? "2 · Pericolosa" : ({sicurezza} == 1 ? "1 · Letale" : ("—")))))]`
> **Traffico** `INPUT[slider(minValue(1), maxValue(5), addLabels):traffico]` → `VIEW[{traffico} == 5 ? "5 · Arteria" : ({traffico} == 4 ? "4 · Trafficata" : ({traffico} == 3 ? "3 · Vivace" : ({traffico} == 2 ? "2 · Rada" : ({traffico} == 1 ? "1 · Morta" : ("—")))))]`
> **Legalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):legalita]` → `VIEW[{legalita} == 5 ? "5 · Sovrana" : ({legalita} == 4 ? "4 · Riconosciuta" : ({legalita} == 3 ? "3 · Grigia" : ({legalita} == 2 ? "2 · Tollerata" : ({legalita} == 1 ? "1 · Clandestina" : ("—")))))]`

> [!note]- Sicurezza — Quanto è rischioso percorrerla.
> **1 · Letale** — Pochi tornano; agguati, mostri, terreno crudele.
> **2 · Pericolosa** — Serve scorta; gli incidenti sono frequenti.
> **3 · Incerta** — Tranquilla a tratti, infida ad altri.
> **4 · Battuta** — Pattugliata e nota; rischi rari.
> **5 · Sicura** — Si viaggia senza timore, anche di notte.

> [!note]- Traffico — Quanto è percorsa e quanto valore vi scorre.
> **1 · Morta** — Quasi abbandonata; la natura se la riprende.
> **2 · Rada** — Qualche viandante, poche carovane.
> **3 · Vivace** — Mercanti e messi regolari.
> **4 · Trafficata** — Flusso costante; locande e dazi prosperano.
> **5 · Arteria** — Vena vitale del mondo: bloccarla è una crisi.

> [!note]- Legalità — Quanto è riconosciuta dai poteri o vive nell'ombra.
> **1 · Clandestina** — Vie del contrabbando; esistono solo per chi sa.
> **2 · Tollerata** — Fuori dalle regole, ma nessuno la ferma.
> **3 · Grigia** — Lecita a tratti, illecita ad altri.
> **4 · Riconosciuta** — Ufficiale, con pedaggi e licenze.
> **5 · Sovrana** — Protetta e regolata da un potere: via di stato.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Collega (estremi)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):estremi]`
> **Tappe intermedie**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):tappe_luoghi]`
> **Controllata da**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`
> **Risorse in transito**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`

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
