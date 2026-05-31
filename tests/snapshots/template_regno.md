<% await tp.user.crea_regno(tp) %>
# `=this.nome`

> [!info] Regno
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Forma di governo: `INPUT[text:governo]`
> Sovrano: `INPUT[text:sovrano]`
> Portata: `INPUT[portata][:portata]`
> Popolazione: `INPUT[text:popolazione]`

> [!note] Storia
> `INPUT[textArea:storia_regno]`

> [!note] Società
> `INPUT[textArea:societa]`

> [!note] Economia
> `INPUT[textArea:economia]`

> [!note] Forza
> `INPUT[textArea:forza]`

> [!note] Relazioni estere
> `INPUT[textArea:relazioni_estere]`

> [!note] Tensione
> `INPUT[textArea:tensione]`

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
> **Coesione Politica** `INPUT[slider(minValue(1), maxValue(5), addLabels):coesione_politica]`
> **Stabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita]`
> **Apertura** `INPUT[slider(minValue(1), maxValue(5), addLabels):apertura]`
> **Proiezione** `INPUT[slider(minValue(1), maxValue(5), addLabels):proiezione]`

> [!note]- Coesione Politica — Quanto il potere è unificato o disperso nel regno.
> **1 · Tribale** — Clan e famiglie autonomi; unità solo simbolica.
> **2 · Confederale** — Nuclei cooperano via consigli; decisioni lente.
> **3 · Policentrica** — Più centri di potere con autorità centrale debole.
> **4 · Centralizzata** — Autorità unificata; periferie soggette a leggi comuni.
> **5 · Monolitica** — Potere assoluto e indiviso; la dissidenza è tradimento.

> [!note]- Stabilità — Solidità del regno nel presente.
> **1 · Sull'orlo** — Collasso imminente; guerra civile o invasione.
> **2 · Fragile** — Crisi aperte; il trono vacilla.
> **3 · Contesa** — Tensioni gestite; equilibrio precario ma in piedi.
> **4 · Salda** — Istituzioni solide; le crisi sono contenute.
> **5 · Granitica** — Ordine duraturo; pace e continuità da generazioni.

> [!note]- Apertura — Atteggiamento verso stranieri, idee e altri popoli.
> **1 · Isolazionista** — Chiuso e diffidente; confini sigillati.
> **2 · Protezionista** — Scambi limitati e sorvegliati.
> **3 · Pragmatico** — Aperto per convenienza; alleanze mutevoli.
> **4 · Aperto** — Commerci e migrazioni incoraggiati; cosmopolita.
> **5 · Cosmopolita** — Crocevia di popoli; identità plurale e fluida.

> [!note]- Proiezione — Quanto il regno cerca di espandersi o influenzare fuori dai confini.
> **1 · Ripiegato** — Solo sopravvivenza interna; nessuna ambizione esterna.
> **2 · Difensivo** — Tutela i confini; non cerca espansione.
> **3 · Influente** — Pesa nella diplomazia regionale; gioca di sponda.
> **4 · Espansionista** — Conquista o colonizza attivamente.
> **5 · Egemonico** — Mira al dominio totale; impero in marcia.

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
> **Capitale**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):capitale]`
> **Territori**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):territori]`
> **Cultura dominante**: `INPUT[suggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):cultura]`
> **Dinastia / sovrani**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):dinastia]`
> **Fazioni di corte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Regni alleati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):alleati]`
> **Regni rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):rivali]`

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
