<% await tp.user.crea_istituzione(tp) %>
# `=this.nome`

> [!info] Istituzione
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`

> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Missione
> `INPUT[textArea:missione]`

> [!note] Struttura
> `INPUT[textArea:struttura]`

> [!note] Accesso
> `INPUT[textArea:accesso]`

> [!note] Attività
> `INPUT[textArea:attivita]`

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
> **Prestigio** `INPUT[slider(minValue(1), maxValue(5), addLabels):prestigio]`
> **Trasparenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):trasparenza]`
> **Rigidità** `INPUT[slider(minValue(1), maxValue(5), addLabels):rigidita]`
> **Integrità** `INPUT[slider(minValue(1), maxValue(5), addLabels):integrita]`

> [!note]- Prestigio — Quanto l'istituzione conta nella società.
> **1 · Marginale** — Quasi ignota o screditata; nessun peso reale.
> **2 · Minore** — Rispettata in una nicchia, ininfluente fuori.
> **3 · Affermata** — Riconosciuta; la sua voce conta in certi ambiti.
> **4 · Autorevole** — Influente; condiziona politica o cultura.
> **5 · Egemone** — Indispensabile; il potere passa da lei.

> [!note]- Trasparenza — Quanto le sue attività sono pubbliche o occulte.
> **1 · Occulta** — Agisce nell'ombra; scopi e mezzi nascosti.
> **2 · Riservata** — Pubblica di facciata, opaca nei fatti.
> **3 · Discreta** — Opera alla luce, ma senza esibirsi.
> **4 · Aperta** — Attività note e rendicontate.
> **5 · Cerimoniale** — Ostenta tutto pubblicamente; rito e visibilità.

> [!note]- Rigidità — Quanto è formale e vincolata da regole.
> **1 · Informale** — Pochi vincoli; si agisce a discrezione.
> **2 · Flessibile** — Regole adattabili al caso.
> **3 · Strutturata** — Procedure chiare con margini di eccezione.
> **4 · Burocratica** — Tutto regolato; lenta ma prevedibile.
> **5 · Inflessibile** — Dogma e protocollo; ogni deviazione è punita.

> [!note]- Integrità — Quanto è fedele alla propria missione o corrotta.
> **1 · Corrotta** — Serve interessi privati; la missione è facciata.
> **2 · Compromessa** — Clientele e favori ne piegano l'operato.
> **3 · Pragmatica** — Scende a patti, ma tiene la barra.
> **4 · Retta** — Fedele alla missione; abusi rari e puniti.
> **5 · Esemplare** — Incorruttibile; incarna il proprio ideale.

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
> **Sede**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):sede]`
> **Regno**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`
> **Membri di spicco**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):membri]`
> **Fazione collegata**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`

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
