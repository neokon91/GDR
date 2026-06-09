<% await tp.user.crea_profezia(tp) %>
# `=this.nome`

> [!infobox|profezia] 🔮 Profezia
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Stato d'avveramento** | `VIEW[{stato_profezia} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(cosmica), option(divinatoria), option(di rinascita), option(distruttiva), option(personale)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Profezia
> **Cos'è** · Una predizione con condizioni d'avveramento — un gancio narrativo forte che il DM fa maturare nel tempo.
> **Campi chiave** · **Tipo**; **Stato d'avveramento** (campo filtrabile: in corso/compiuta) per ritrovarla; sul Carattere **Malleabilità** dice se le scelte dei PG possono deviarla.
> **Spunti** · Chi crede a questa profezia e chi la teme? Cosa deve accadere perché si compia — e chi lavora per impedirlo? E se l'interpretazione comune fosse sbagliata?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!abstract] Scheda
> Stato d'avveramento: `INPUT[stato_profezia][:stato_profezia]`

## Testo
> [!question]- 💡 Il testo della profezia (le parole, anche criptiche)

## Interpretazioni
> [!question]- 💡 Interpretazioni possibili (cosa si crede significhi)

## Condizioni
> [!question]- 💡 Condizioni di avveramento (cosa deve accadere)

## Segni
> [!question]- 💡 Segni e manifestazioni: come capire che si avvera

> [!rivela|segreto]- Segreto
> 💡 *La verità sull'avveramento (cosa il DM sa davvero)*
>


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
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "profezia", component);
```

> [!abstract] Carattere
> **Chiarezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):chiarezza]` → `VIEW[{chiarezza} == 5 ? "5 · Esplicita" : ({chiarezza} == 4 ? "4 · Chiara" : ({chiarezza} == 3 ? "3 · Allusiva" : ({chiarezza} == 2 ? "2 · Oscura" : ({chiarezza} == 1 ? "1 · Ermetica" : ("—")))))]`
> **Avveramento** `INPUT[slider(minValue(1), maxValue(5), addLabels):avveramento]` → `VIEW[{avveramento} == 5 ? "5 · In atto" : ({avveramento} == 4 ? "4 · Imminente" : ({avveramento} == 3 ? "3 · In moto" : ({avveramento} == 2 ? "2 · Latente" : ({avveramento} == 1 ? "1 · Remota" : ("—")))))]`
> **Esito atteso** `INPUT[slider(minValue(1), maxValue(5), addLabels):esito]` → `VIEW[{esito} == 5 ? "5 · Catastrofe" : ({esito} == 4 ? "4 · Sventura" : ({esito} == 3 ? "3 · Svolta" : ({esito} == 2 ? "2 · Benedizione" : ({esito} == 1 ? "1 · Salvezza" : ("—")))))]`
> **Malleabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):malleabilita]` → `VIEW[{malleabilita} == 5 ? "5 · Aperta" : ({malleabilita} == 4 ? "4 · Fragile" : ({malleabilita} == 3 ? "3 · Condizionata" : ({malleabilita} == 2 ? "2 · Rigida" : ({malleabilita} == 1 ? "1 · Ineluttabile" : ("—")))))]`

> [!note]- Chiarezza — Quanto la profezia è comprensibile o criptica.
> **1 · Ermetica** — Incomprensibile; simboli puri, nessun appiglio.
> **2 · Oscura** — Enigmatica; richiede chiavi e interpreti.
> **3 · Allusiva** — Immagini leggibili ma ambigue; più letture valide.
> **4 · Chiara** — Senso evidente, con qualche dettaglio velato.
> **5 · Esplicita** — Dice apertamente cosa, chi, quando.

> [!note]- Avveramento — Quanto la profezia è vicina a compiersi.
> **1 · Remota** — Lontanissima; nessun segno ancora.
> **2 · Latente** — Condizioni assenti; potrebbe non avverarsi mai.
> **3 · In moto** — I primi segni appaiono; gli ingranaggi girano.
> **4 · Imminente** — Quasi tutte le condizioni soddisfatte; sta accadendo.
> **5 · In atto** — Si sta compiendo ora; resta solo l'esito.

> [!note]- Esito atteso — Cosa promette la profezia se si avvera.
> **1 · Salvezza** — Liberazione, alba, rinascita per il mondo.
> **2 · Benedizione** — Bene per alcuni; un dono o un erede atteso.
> **3 · Svolta** — Cambio epocale ambiguo; né bene né male netti.
> **4 · Sventura** — Caduta, lutto, fine di un ordine.
> **5 · Catastrofe** — Rovina cosmica; fine del mondo o di un'era.

> [!note]- Malleabilità — Quanto le scelte mortali possono cambiarne il corso.
> **1 · Ineluttabile** — Si avvera comunque; ogni resistenza la realizza.
> **2 · Rigida** — Si può ritardare, non evitare.
> **3 · Condizionata** — Dipende da scelte precise; ha bivi reali.
> **4 · Fragile** — Facile da deviare; basta poco a spezzarla.
> **5 · Aperta** — Solo una possibilità tra tante; il futuro è libero.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Chi riguarda**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):riguarda]`
> **Evento legato**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):evento]`
> **Culti che la custodiscono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`

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
