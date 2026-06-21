<% await tp.user.crea_editto(tp) %>
# `=this.nome`

> [!infobox|editto] ⚖️ Editto
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Emanato da** | `INPUT[legame][:emanato_da]` |
> | **Pena / sanzione** | `INPUT[pena][:pena]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(editto), option(legge), option(divieto), option(privilegio), option(trattato)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Editto
> **Cos'è** · Un editto è una norma del mondo — un decreto, una legge, un trattato che un potere proclama. Dà attrito e poste in gioco (≠ regola, che è una regola del tavolo).
> **Campi chiave** · **Tipo** (editto/legge/divieto/privilegio/trattato), chi l'ha **Emanata** e la **Pena** per chi la viola; collega **Dove vale** e le **Fazioni** che tocca.
> **Spunti** · Chi ci guadagna davvero, e a spese di chi? Chi lo infrange, apertamente o di nascosto? Quanto costa farlo rispettare — e chi paga?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Contenuto
> [!question]- 💡 Cosa stabilisce, nei fatti

## Movente
> [!question]- 💡 Perché è stata emanata (chi ci guadagna)

## Applicazione
> [!question]- 💡 Come viene fatta rispettare — e chi la aggira

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
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "editto", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderProfilo");
```

> [!tip] Profilo
> Assegna i tag coerenti derivati dagli assi: `BUTTON[applica-profilo]`

> [!abstract] Carattere
> **Severità** `INPUT[slider(minValue(1), maxValue(5), addLabels):severita]` → `VIEW[{severita} == 5 ? "5 · Spietata" : ({severita} == 4 ? "4 · Dura" : ({severita} == 3 ? "3 · Severa" : ({severita} == 2 ? "2 · Mite" : ({severita} == 1 ? "1 · Blanda" : ("—")))))]`
> **Legittimità** `INPUT[slider(minValue(1), maxValue(5), addLabels):legittimita]` → `VIEW[{legittimita} == 5 ? "5 · Consensuale" : ({legittimita} == 4 ? "4 · Riconosciuta" : ({legittimita} == 3 ? "3 · Tollerata" : ({legittimita} == 2 ? "2 · Contestata" : ({legittimita} == 1 ? "1 · Arbitraria" : ("—")))))]`
> **Portata** `INPUT[slider(minValue(1), maxValue(5), addLabels):portata]` → `VIEW[{portata} == 5 ? "5 · Universale" : ({portata} == 4 ? "4 · Estesa" : ({portata} == 3 ? "3 · Regionale" : ({portata} == 2 ? "2 · Locale" : ({portata} == 1 ? "1 · Circoscritta" : ("—")))))]`
> **Applicazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):applicazione]` → `VIEW[{applicazione} == 5 ? "5 · Inflessibile" : ({applicazione} == 4 ? "4 · Vigilata" : ({applicazione} == 3 ? "3 · Discontinua" : ({applicazione} == 2 ? "2 · Lassa" : ({applicazione} == 1 ? "1 · Lettera morta" : ("—")))))]`

> [!note]- Severità — Durezza della sanzione e del suo peso sulla vita di chi vi soggiace.
> **1 · Blanda** — Pene simboliche o ammende lievi; più monito che castigo.
> **2 · Mite** — Sanzioni reali ma proporzionate; raramente rovinano una vita.
> **3 · Severa** — Pene pesanti: multe rovinose, prigione, esilio.
> **4 · Dura** — Punizioni corporali, marchio, lavori forzati; colpisce anche i parenti.
> **5 · Spietata** — Morte, mutilazione, schiavitù; il terrore è parte della legge.

> [!note]- Legittimità — Quanto è riconosciuta come giusta, dal capriccio del tiranno al patto condiviso.
> **1 · Arbitraria** — Imposta per fiat: nessuno la riconosce giusta, solo temuta.
> **2 · Contestata** — Larga parte la considera ingiusta; cova resistenza.
> **3 · Tollerata** — Accettata per quieto vivere, senza vero consenso.
> **4 · Riconosciuta** — Vista come legittima dalla maggioranza; ha autorità reale.
> **5 · Consensuale** — Frutto di patto o tradizione condivisa; obbedita per convinzione.

> [!note]- Portata — Ampiezza di ciò che tocca, dal caso singolo all'ordinamento universale.
> **1 · Circoscritta** — Riguarda una persona, un caso, un luogo solo.
> **2 · Locale** — Vale per una città o una comunità.
> **3 · Regionale** — Copre una provincia o un ambito definito della vita.
> **4 · Estesa** — Vincola un intero regno o un grande settore.
> **5 · Universale** — Pretende di valere per tutti e ovunque, senza eccezioni.

> [!note]- Applicazione — Quanto è davvero fatta rispettare: lo scarto fra la lettera e i fatti.
> **1 · Lettera morta** — Scritta ma ignorata; nessuno la applica più.
> **2 · Lassa** — Applicata a sprazzi, aggirata da chiunque conti.
> **3 · Discontinua** — Fatta valere a seconda di chi governa e dove.
> **4 · Vigilata** — Controlli regolari; trasgredire è rischioso.
> **5 · Inflessibile** — Applicata senza eccezioni; informatori, controlli capillari, nessuno scampo.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Regno / potere**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`
> **Dove vale**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Fazioni toccate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Promulgato in**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):promulgato_in]`

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
