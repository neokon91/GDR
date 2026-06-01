<% await tp.user.crea_sistema_magico(tp) %>
# `=this.nome`

> [!info] 🪄 Sistema magico
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
> **Fonte del potere** `VIEW[{fonte_potere} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Fonte del potere: `INPUT[fonte_potere][:fonte_potere]`

> [!note] Fonte
> `INPUT[textArea:fonte]`

> [!note] Metodo
> `INPUT[textArea:metodo]`

> [!note] Costo
> `INPUT[textArea:costo]`

> [!note] Rischi
> `INPUT[textArea:rischi]`

> [!note] Manifestazioni
> `INPUT[textArea:manifestazioni]`

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
> **Fonte della Magia** `INPUT[slider(minValue(1), maxValue(5), addLabels):fonte_magia]` → `VIEW[{fonte_magia} == 5 ? "5 · Donata" : ({fonte_magia} == 4 ? "4 · Evocata" : ({fonte_magia} == 3 ? "3 · Equilibrata" : ({fonte_magia} == 2 ? "2 · Latente" : ({fonte_magia} == 1 ? "1 · Innata" : ("—")))))]`
> **Metodo Magico** `INPUT[slider(minValue(1), maxValue(5), addLabels):metodo_magia]` → `VIEW[{metodo_magia} == 5 ? "5 · Meccanico" : ({metodo_magia} == 4 ? "4 · Codificato" : ({metodo_magia} == 3 ? "3 · Interpretativo" : ({metodo_magia} == 2 ? "2 · Alchemico" : ({metodo_magia} == 1 ? "1 · Selvaggio" : ("—")))))]`
> **Costo Esistenziale** `INPUT[slider(minValue(1), maxValue(5), addLabels):costo_magia]` → `VIEW[{costo_magia} == 5 ? "5 · Sacrificio" : ({costo_magia} == 4 ? "4 · Gravoso" : ({costo_magia} == 3 ? "3 · Bilanciato" : ({costo_magia} == 2 ? "2 · Residuale" : ({costo_magia} == 1 ? "1 · Nullo" : ("—")))))]`
> **Rischio Esistenziale** `INPUT[slider(minValue(1), maxValue(5), addLabels):rischio]` → `VIEW[{rischio} == 5 ? "5 · Corrompente" : ({rischio} == 4 ? "4 · Pericolosa" : ({rischio} == 3 ? "3 · Instabile" : ({rischio} == 2 ? "2 · Fragile" : ({rischio} == 1 ? "1 · Sicura" : ("—")))))]`
> **Ethos Magico** `INPUT[slider(minValue(1), maxValue(5), addLabels):ethos_magico]` → `VIEW[{ethos_magico} == 5 ? "5 · Liturgico" : ({ethos_magico} == 4 ? "4 · Sacrale funzionale" : ({ethos_magico} == 3 ? "3 · Ambiguo" : ({ethos_magico} == 2 ? "2 · Professionale" : ({ethos_magico} == 1 ? "1 · Utilitarista" : ("—")))))]`
> **Accessibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):accessibilita]` → `VIEW[{accessibilita} == 5 ? "5 · Universale" : ({accessibilita} == 4 ? "4 · Canonizzata" : ({accessibilita} == 3 ? "3 · Iniziatica" : ({accessibilita} == 2 ? "2 · Elitaria" : ({accessibilita} == 1 ? "1 · Occulta" : ("—")))))]`
> **Entropia Arcana** `INPUT[slider(minValue(1), maxValue(5), addLabels):entropia]` → `VIEW[{entropia} == 5 ? "5 · Auto-distruttiva" : ({entropia} == 4 ? "4 · Instabile" : ({entropia} == 3 ? "3 · Equilibrata" : ({entropia} == 2 ? "2 · Ciclica" : ({entropia} == 1 ? "1 · Auto-rigenerativa" : ("—")))))]`
> **Autonomia Magica** `INPUT[slider(minValue(1), maxValue(5), addLabels):autonomia]` → `VIEW[{autonomia} == 5 ? "5 · Vivente" : ({autonomia} == 4 ? "4 · Indipendente" : ({autonomia} == 3 ? "3 · Semi-autonoma" : ({autonomia} == 2 ? "2 · Risonante" : ({autonomia} == 1 ? "1 · Volontaria" : ("—")))))]`

> [!note]- Fonte della Magia — Origine ontologica del potere magico. Indica se proviene dall’interno dell’essere o da forze esterne.
> **1 · Innata** — La magia nasce da dentro: sangue, anima, volontà. È parte dell’essenza dell’incantatore.
> **2 · Latente** — L’individuo la canalizza interiormente, pur richiedendo addestramento o risveglio.
> **3 · Equilibrata** — La magia è frutto di sintesi tra forze interiori e canali esterni (divinità, elementi, archetipi).
> **4 · Evocata** — La magia viene invocata da entità, dimensioni o simboli esterni attraverso rituali e mediazioni.
> **5 · Donata** — È un dono condizionato da potenze superiori o artefatti. L’utente è solo canale, mai sorgente.

> [!note]- Metodo Magico — Questo asse definisce come viene eseguita la magia: spontaneamente o tramite linguaggi e strutture. Ogni valore rappresenta un diverso grado di formalizzazione tra impulso e algoritmo.
> **1 · Selvaggio** — La magia è selvaggia, emotiva, improvvisata. Non segue regole fisse.
> **2 · Alchemico** — Basata su esperienza, prove, tentativi. Si sviluppa con l’intuizione e la sperimentazione.
> **3 · Interpretativo** — Esistono pattern o formule, ma con margini interpretativi o creativi.
> **4 · Codificato** — Riti, formule, sigilli e tecniche codificate. Richiede studio disciplinato.
> **5 · Meccanico** — La magia è trattata come scienza esatta o tecnologia. Formula = effetto prevedibile.

> [!note]- Costo Esistenziale — Prezzo ontologico, fisico o spirituale pagato per l’uso della magia.
> **1 · Nullo** — Nessun costo. La magia è naturale e fluida, come respirare.
> **2 · Residuale** — Lievi stanchezze, consumi energetici, ma reversibili o trascurabili.
> **3 · Bilanciato** — Ogni effetto ha un costo proporzionale (tempo di vita, emozione, memoria).
> **4 · Gravoso** — La magia consuma l’essenza vitale, logora la mente o deteriora il corpo.
> **5 · Sacrificio** — Ogni incanto implica perdita irreversibile: sangue, anime, tempo vitale o verità spirituale.

> [!note]- Rischio Esistenziale — Grado di pericolo intrinseco nell’uso della magia: effetti collaterali, corruzione, contaminazione dell’anima o della realtà.
> **1 · Sicura** — Nessun rischio. La magia è armonica, stabile, non altera l’equilibrio spirituale.
> **2 · Fragile** — Richiede cautela rituale. Piccoli errori generano distorsioni lievi.
> **3 · Instabile** — Ogni incanto ha margini di fallimento o inversione. Serve competenza e fortuna.
> **4 · Pericolosa** — Rischi di contaminazione psichica, squarci dimensionali, entità parassite o mutazioni.
> **5 · Corrompente** — L’uso prolungato logora anima, corpo o mondo. Magia proibita o degenerativa, legata al Vuoto, alla Follia o all’Entropia.

> [!note]- Ethos Magico — Visione morale, rituale e simbolica del potere magico.
> **1 · Utilitarista** — La magia è uno strumento, privo di sacralità o tabù. Chi può usarla, lo fa.
> **2 · Professionale** — È rispettata come arte, ma trattata come disciplina funzionale o professione.
> **3 · Ambiguo** — La magia ha risvolti sacri e pratici. Il suo uso è valutato caso per caso.
> **4 · Sacrale funzionale** — Ogni incanto richiede rispetto, riti e intenzione. Il potere è un prestito spirituale.
> **5 · Liturgico** — Ogni forma magica è un atto liturgico. La magia è comunione con il divino o con le forze cosmiche. Usarla è una preghiera.

> [!note]- Accessibilità — Quanto la magia è diffusa o riservata. Rappresenta se è prerogativa di pochi o bene comune.
> **1 · Occulta** — Rivelata solo a iniziati o prescelti. Occulta, criptata o vietata.
> **2 · Elitaria** — Riservata a caste, lignaggi, accademie o spiriti affini. Non accessibile alla massa.
> **3 · Iniziatica** — Può essere appresa, ma richiede requisiti severi: sacrifici, prove, talenti rari.
> **4 · Canonizzata** — È accessibile a chi studia, prega o si dedica con disciplina. Presente in ordini o scuole.
> **5 · Universale** — Potenzialmente accessibile a tutti. Si trasmette per eredità, esposizione o contatto. Nessuna barriera istituzionale.

> [!note]- Entropia Arcana — Stabilità interna del sistema magico e suo potenziale degenerativo. Misura quanto l’uso prolungato conduca a corruzione, decadimento o esplosione mistica.
> **1 · Auto-rigenerativa** — La magia si autorigenera, purifica e stabilizza nel tempo. Ogni utilizzo rafforza l’equilibrio del sistema.
> **2 · Ciclica** — Funziona in cicli di accumulo e dissipazione. Un uso corretto la mantiene stabile, ma è soggetta a fasi di esaurimento.
> **3 · Equilibrata** — Non degenera né si stabilizza. Il sistema resta stabile solo se usato con prudenza e misura.
> **4 · Instabile** — Ogni uso accumula instabilità. La magia rischia di sfuggire al controllo o causare effetti collaterali progressivi.
> **5 · Auto-distruttiva** — Ogni utilizzo corrompe l’utilizzatore o il mondo. Il potere si consuma e trascina con sé il tessuto della realtà. Tipica di magie proibite, demoniache o del Vuoto.

> [!note]- Autonomia Magica — Livello di indipendenza o volontà della magia stessa. Indica se è uno strumento, un’entità o una coscienza attiva.
> **1 · Volontaria** — La magia obbedisce pienamente alla volontà del praticante. È uno strumento neutro e inerte fino a invocazione.
> **2 · Risonante** — Risponde all’intenzione, all’emozione o allo stato dell’anima. Ha una certa reattività spirituale.
> **3 · Semi-autonoma** — La magia può manifestarsi spontaneamente o suggerire vie proprie, ma è generalmente controllabile.
> **4 · Indipendente** — Agisce con volontà propria. L’incantatore può solo orientarne l’intento. Talvolta resiste o reagisce.
> **5 · Vivente** — È un'entità senziente, spirituale o cosmica. Stabilisce un patto con l’incantatore. Agisce secondo i propri scopi o principi.

```meta-bind-js-view
{fonte_magia} as fonte_magia
{metodo_magia} as metodo_magia
{costo_magia} as costo_magia
{rischio} as rischio
{ethos_magico} as ethos_magico
{accessibilita} as accessibilita
{entropia} as entropia
{autonomia} as autonomia
hidden
---
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const core = JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json"));
let valori = {};
try { valori = (typeof context !== "undefined" && context && context.bound) ? context.bound : {}; } catch (e) {}
if (!Object.values(valori).some((v) => v != null)) {
  const f = app.workspace.getActiveFile();
  valori = f ? ((app.metadataCache.getFileCache(f) || {}).frontmatter || {}) : {};
}
return engine.markdown.create(views.radarMarkdownFromValues(core, "sistema_magico", valori, ""));
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
> **Leggi su cui poggia**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Dominio cosmico**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Fonti / risonanze**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):fonti]`
> **Piani di risonanza**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Luoghi-nodo**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi_nodo]`

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
