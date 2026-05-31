<% await tp.user.crea_sistema_magico(tp) %>
# `=this.nome`

> [!info] Sistema magico
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Fonte del potere: `INPUT[fonte_potere][:fonte_potere]`

> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

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


--- Carattere

> [!abstract] Carattere
> **Fonte della Magia** `INPUT[slider(minValue(1), maxValue(5), addLabels):fonte_magia]`
> **Metodo Magico** `INPUT[slider(minValue(1), maxValue(5), addLabels):metodo_magia]`
> **Costo Esistenziale** `INPUT[slider(minValue(1), maxValue(5), addLabels):costo_magia]`
> **Rischio Esistenziale** `INPUT[slider(minValue(1), maxValue(5), addLabels):rischio]`
> **Ethos Magico** `INPUT[slider(minValue(1), maxValue(5), addLabels):ethos_magico]`

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
