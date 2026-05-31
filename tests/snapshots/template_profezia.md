<% await tp.user.crea_profezia(tp) %>
# `=this.nome`

> [!info] Profezia
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Stato d'avveramento: `INPUT[stato_profezia][:stato_profezia]`

> [!note] Testo
> `INPUT[textArea:testo]`

> [!note] Interpretazioni
> `INPUT[textArea:interpretazioni]`

> [!note] Condizioni
> `INPUT[textArea:condizioni]`

> [!note] Segni
> `INPUT[textArea:segni]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Carattere

> [!abstract] Carattere
> **Chiarezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):chiarezza]`
> **Avveramento** `INPUT[slider(minValue(1), maxValue(5), addLabels):avveramento]`
> **Esito atteso** `INPUT[slider(minValue(1), maxValue(5), addLabels):esito]`
> **Malleabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):malleabilita]`

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

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
```

--- Collegamenti

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

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`
--- Vista

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(views.renderEntityPanel(dv, page));
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
