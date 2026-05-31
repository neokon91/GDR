<% await tp.user.crea_culto(tp) %>
# `=this.nome`

> [!info] Culto
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`

> [!note] Dottrina
> `INPUT[textArea:dottrina]`

> [!note] Riti
> `INPUT[textArea:riti]`

> [!note] Gerarchia
> `INPUT[textArea:gerarchia]`

> [!note] Tabù
> `INPUT[textArea:tabu]`

> [!note] Nel presente
> `INPUT[textArea:presente]`

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

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti
```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderClock(container, app, page);
```

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Scatena
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
--- Carattere

> [!abstract] Carattere
> **Struttura** `INPUT[slider(minValue(1), maxValue(5), addLabels):struttura]`
> **Rivelazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):rivelazione]`
> **Trascendenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):trascendenza]`
> **Legalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):legalita]`
> **Motivazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):motivazione]`

> [!note]- Struttura — Grado di organizzazione interna e rigidità della gerarchia.
> **1 · Anarchico** — Nessuna gerarchia; fluido, spontaneo, decentralizzato.
> **2 · Comunitario** — Guide senza autorità vincolante; decisioni collettive.
> **3 · Semi-istituzionale** — Struttura leggera; incarichi riconosciuti ma locali.
> **4 · Gerarchico** — Gerarchia formalizzata, con margini di eccezione.
> **5 · Dogmatico** — Piramide rigida; autorità centrale, sacra, indiscutibile.

> [!note]- Rivelazione — Quanto la verità sacra è riservata a pochi o aperta a tutti.
> **1 · Iniziatico** — Verità occulta, solo per gradi e riti segreti.
> **2 · Filtrata** — Sapere parziale ai neofiti; le verità profonde celate.
> **3 · Misto** — Molto pubblico, ma un nucleo segreto per gli iniziati.
> **4 · Aperta** — Insegnamenti divulgati via predicazione e testi.
> **5 · Universale** — Verità per tutti; missionaria, nessun segreto.

> [!note]- Trascendenza — Quanto il divino è immerso nel mondo o separato e superiore.
> **1 · Immanente** — Il divino permea tutto; sacro e mondo non si distinguono.
> **2 · Diffuso** — Presente ovunque, ma non tutto è sacro in egual misura.
> **3 · Ambivalente** — Sia immanente che trascendente; si incarna e supera.
> **4 · Separato** — Distinto dalla creazione; si manifesta in eletti.
> **5 · Trascendente** — Del tutto altro; piano superiore, accessibile per grazia.

> [!note]- Legalità — Posizione del culto rispetto all'autorità vigente.
> **1 · Illegale** — Proibito e perseguitato; clandestino.
> **2 · Tollerato** — Non legale ma tollerato, a profilo basso.
> **3 · Riconosciuto** — Riconoscimento limitato; status minoritario.
> **4 · Accettato** — Pienamente legale e rispettato, non dominante.
> **5 · Ufficiale** — Religione di stato, legata al potere politico.

> [!note]- Motivazione — La spinta emotiva alla base della fede.
> **1 · Paura** — Timore reverenziale; si agisce per evitare punizioni.
> **2 · Placazione** — Offerte e riti per mantenere la benevolenza divina.
> **3 · Equilibrata** — Timore e gratitudine insieme; obbedienza e fiducia.
> **4 · Fiducia** — Si onora per scelta; la divinità è giusta e guida.
> **5 · Amore** — Legame affettivo profondo; si cerca l'unione, l'estasi.

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

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(await views.renderProfilo(app, page));
```

> [!tip] Profilo
> Assegna i tag coerenti derivati dagli assi: `BUTTON[applica-profilo]`

--- Collegamenti

> [!example] Relazioni
> **Divinità venerate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luogo sacro**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_sacro]`
> **Figure di spicco**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):capi]`
> **Braccio politico**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`

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
