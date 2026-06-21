<% await tp.user.crea_calamita(tp) %>
# `=this.nome`

> [!infobox|calamita] ☣️ Calamità
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Gravità** | `INPUT[gravita][:gravita]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(pestilenza), option(carestia), option(cataclisma), option(maledizione), option(anomalia)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Calamità
> **Cos'è** · Una calamità è una sciagura che DURA e si diffonde (peste, carestia, cataclisma, maledizione): un Fronte il cui clock avanza finché qualcuno non la ferma.
> **Campi chiave** · **Tipo** (pestilenza/carestia/…) e **Gravità**; imposta un **clock** = la diffusione; **Come si diffonde** e **Rimedio** dicono come accelera e come si spegne; collega **Dove colpisce**.
> **Spunti** · Da dove è partita, e perché continua a diffondersi? Chi potrebbe fermarla — e cosa glielo impedisce? Cosa lascia dietro di sé là dove è passata?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Cosa accade
> [!question]- 💡 Cosa accade, e a chi

## Avanzata
> [!question]- 💡 Come avanza se nessuno interviene (la posta del clock)

## Come finisce
> [!question]- 💡 Cosa la ferma o la spegne

%%/prosa%%

--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text(placeholder(es. il barone raddoppia le guardie)):prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti · scadenza (opz.) `INPUT[number:scadenza]` giri
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderClock");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderPressioni");
```

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Avanza / scatena
> **Pressione** = quanto scotta *adesso* (temperatura) · **Clock** = il countdown alla conseguenza. Pressione e spinte dal grafo *giustificano* di avanzare il clock; l'imminenza nei cruscotti le pesa entrambe.
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza e chiede se il fronte è *risolto* (si chiude, archiviato) o *ricorrente* (riparte, clock azzerato).

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "calamita", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderProfilo");
```

> [!tip] Profilo
> Assegna i tag coerenti derivati dagli assi: `BUTTON[applica-profilo]`

> [!abstract] Carattere
> **Virulenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):virulenza]` → `VIEW[{virulenza} == 5 ? "5 · Fulminea" : ({virulenza} == 4 ? "4 · Galoppante" : ({virulenza} == 3 ? "3 · Crescente" : ({virulenza} == 2 ? "2 · Lenta" : ({virulenza} == 1 ? "1 · Stagnante" : ("—")))))]`
> **Letalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):letalita]` → `VIEW[{letalita} == 5 ? "5 · Sterminatrice" : ({letalita} == 4 ? "4 · Devastante" : ({letalita} == 3 ? "3 · Mortale" : ({letalita} == 2 ? "2 · Fiaccante" : ({letalita} == 1 ? "1 · Debilitante" : ("—")))))]`
> **Manifestazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):manifestazione]` → `VIEW[{manifestazione} == 5 ? "5 · Spettacolare" : ({manifestazione} == 4 ? "4 · Evidente" : ({manifestazione} == 3 ? "3 · Riconoscibile" : ({manifestazione} == 2 ? "2 · Strisciante" : ({manifestazione} == 1 ? "1 · Occulta" : ("—")))))]`
> **Arginabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):arginabilita]` → `VIEW[{arginabilita} == 5 ? "5 · Reversibile" : ({arginabilita} == 4 ? "4 · Contenibile" : ({arginabilita} == 3 ? "3 · Contrastabile" : ({arginabilita} == 2 ? "2 · Ostinata" : ({arginabilita} == 1 ? "1 · Inarrestabile" : ("—")))))]`

> [!note]- Virulenza — Velocità con cui si propaga: quanto in fretta il clock del Fronte si riempie.
> **1 · Stagnante** — Quasi non si estende: resta dov'è, va contenuta solo per non peggiorare.
> **2 · Lenta** — Avanza di stagione in stagione; c'è tempo per reagire.
> **3 · Crescente** — Si diffonde a ritmo costante e percepibile; va fermata presto.
> **4 · Galoppante** — Dilaga di settimana in settimana; ogni indugio raddoppia il fronte.
> **5 · Fulminea** — Esplode: travolge regioni in giorni. Il clock corre, serve un miracolo per arginarla.

> [!note]- Letalità — Quanto colpisce duro chi raggiunge: dal logorio allo sterminio.
> **1 · Debilitante** — Indebolisce, non uccide: malesseri, perdite di raccolto, sfinimento.
> **2 · Fiaccante** — Mette in ginocchio comunità; le morti sono indirette (fame, stenti).
> **3 · Mortale** — Uccide una quota di chi colpisce; lascia lutti e vuoti.
> **4 · Devastante** — Falcia popolazioni; villaggi spopolati, fosse comuni.
> **5 · Sterminatrice** — Quasi nessuno sopravvive nel suo raggio: lascia terra morta.

> [!note]- Manifestazione — Quanto è palese: dal male occulto che nessuno nota al cataclisma sotto gli occhi di tutti.
> **1 · Occulta** — Invisibile finché non è tardi: si scopre solo dai suoi effetti.
> **2 · Strisciante** — Segni sottili, facili da ignorare o fraintendere.
> **3 · Riconoscibile** — Chiara a chi guarda; allarme e diagnosi sono possibili.
> **4 · Evidente** — Innegabile: tutti la vedono, il panico monta.
> **5 · Spettacolare** — Apocalittica e visibile a leghe di distanza: cielo che brucia, terra che si apre.

> [!note]- Arginabilità — Quanto si può fermare o invertire: la speranza che il Fronte lascia ai PG.
> **1 · Inarrestabile** — Nessun rimedio noto; si può solo fuggire o rimandare la fine.
> **2 · Ostinata** — Resiste a ogni cura; servirebbe qualcosa che ancora non esiste.
> **3 · Contrastabile** — Si rallenta e si limita con sforzo e sacrificio.
> **4 · Contenibile** — Con le misure giuste si circoscrive e si spegne.
> **5 · Reversibile** — Esiste un rimedio chiaro: trovato quello, il danno si ripara.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Dove colpisce**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Epoca**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoca]`
> **Scatenata da**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):causato_da]`
> **Chi reagisce**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Profezia che l'annuncia**: `INPUT[suggester(optionQuery("Mondi/Profezie"), useLinks(partial), allowOther):profezia]`
> **Chi colpisce (stirpi)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):colpisce]`
> **Origine / mandante divino**: `INPUT[suggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Culti coinvolti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`

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
