<% await tp.user.crea_bioma(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|bioma] 🌲 Bioma
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Clima** | `VIEW[{clima} ?? "—"]` |
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
> [!abstract] Scheda
> Clima: `INPUT[clima][:clima]`

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
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "bioma", component);
```

> [!abstract] Carattere
> **Ostilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):ostilita]` → `VIEW[{ostilita} == 5 ? "5 · Letale" : ({ostilita} == 4 ? "4 · Ostile" : ({ostilita} == 3 ? "3 · Aspro" : ({ostilita} == 2 ? "2 · Mite" : ({ostilita} == 1 ? "1 · Ospitale" : ("—")))))]`
> **Fertilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):fertilita]` → `VIEW[{fertilita} == 5 ? "5 · Lussureggiante" : ({fertilita} == 4 ? "4 · Rigoglioso" : ({fertilita} == 3 ? "3 · Modesto" : ({fertilita} == 2 ? "2 · Magro" : ({fertilita} == 1 ? "1 · Sterile" : ("—")))))]`
> **Magia Ambientale** `INPUT[slider(minValue(1), maxValue(5), addLabels):magia_ambientale]` → `VIEW[{magia_ambientale} == 5 ? "5 · Saturo" : ({magia_ambientale} == 4 ? "4 · Carico" : ({magia_ambientale} == 3 ? "3 · Intriso" : ({magia_ambientale} == 2 ? "2 · Toccato" : ({magia_ambientale} == 1 ? "1 · Mondano" : ("—")))))]`
> **Accessibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):accessibilita]` → `VIEW[{accessibilita} == 5 ? "5 · Inaccessibile" : ({accessibilita} == 4 ? "4 · Remoto" : ({accessibilita} == 3 ? "3 · Impervio" : ({accessibilita} == 2 ? "2 · Praticabile" : ({accessibilita} == 1 ? "1 · Aperto" : ("—")))))]`

> [!note]- Ostilità — Quanto il bioma è pericoloso per chi lo attraversa.
> **1 · Ospitale** — Sicuro e accogliente; sopravvivere è facile.
> **2 · Mite** — Pochi pericoli, gestibili con prudenza.
> **3 · Aspro** — Duro; richiede preparazione e rispetto.
> **4 · Ostile** — Insidie costanti; il bioma vuole respingerti.
> **5 · Letale** — Mortale; sopravvivere è un'impresa rara.

> [!note]- Fertilità — Quanta vita e risorse il bioma sostiene.
> **1 · Sterile** — Quasi morto; nulla cresce, nulla resta.
> **2 · Magro** — Vita scarsa e tenace; risorse rare.
> **3 · Modesto** — Sostiene una vita stabile ma non abbondante.
> **4 · Rigoglioso** — Vita ricca; risorse e specie in quantità.
> **5 · Lussureggiante** — Esplosione di vita; sovrabbondante e vorace.

> [!note]- Magia Ambientale — Quanto la magia permea il bioma.
> **1 · Mondano** — Nessuna magia; natura ordinaria.
> **2 · Toccato** — Tracce o residui magici occasionali.
> **3 · Intriso** — La magia è percepibile; fenomeni regolari.
> **4 · Carico** — La magia plasma flora, fauna e clima.
> **5 · Saturo** — Realtà alterata; la magia detta le regole.

> [!note]- Accessibilità — Quanto è facile raggiungere e percorrere il bioma.
> **1 · Aperto** — Facile da attraversare; rotte e accessi noti.
> **2 · Praticabile** — Percorribile con guida o sentieri.
> **3 · Impervio** — Difficile; ostacoli naturali continui.
> **4 · Remoto** — Isolato; pochi sanno come arrivarci.
> **5 · Inaccessibile** — Quasi irraggiungibile; barriere estreme o magiche.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Luoghi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Specie tipiche**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):specie]`

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
