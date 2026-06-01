<% await tp.user.crea_istituzione(tp) %>
# `=this.nome`

> [!info] 🏛️ Istituzione
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
> **Portata** `VIEW[{portata} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`

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
> **Prestigio** `INPUT[slider(minValue(1), maxValue(5), addLabels):prestigio]` → `VIEW[{prestigio} == 5 ? "5 · Egemone" : ({prestigio} == 4 ? "4 · Autorevole" : ({prestigio} == 3 ? "3 · Affermata" : ({prestigio} == 2 ? "2 · Minore" : ({prestigio} == 1 ? "1 · Marginale" : ("—")))))]`
> **Trasparenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):trasparenza]` → `VIEW[{trasparenza} == 5 ? "5 · Cerimoniale" : ({trasparenza} == 4 ? "4 · Aperta" : ({trasparenza} == 3 ? "3 · Discreta" : ({trasparenza} == 2 ? "2 · Riservata" : ({trasparenza} == 1 ? "1 · Occulta" : ("—")))))]`
> **Rigidità** `INPUT[slider(minValue(1), maxValue(5), addLabels):rigidita]` → `VIEW[{rigidita} == 5 ? "5 · Inflessibile" : ({rigidita} == 4 ? "4 · Burocratica" : ({rigidita} == 3 ? "3 · Strutturata" : ({rigidita} == 2 ? "2 · Flessibile" : ({rigidita} == 1 ? "1 · Informale" : ("—")))))]`
> **Integrità** `INPUT[slider(minValue(1), maxValue(5), addLabels):integrita]` → `VIEW[{integrita} == 5 ? "5 · Esemplare" : ({integrita} == 4 ? "4 · Retta" : ({integrita} == 3 ? "3 · Pragmatica" : ({integrita} == 2 ? "2 · Compromessa" : ({integrita} == 1 ? "1 · Corrotta" : ("—")))))]`

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

```meta-bind-js-view
{prestigio} as prestigio
{trasparenza} as trasparenza
{rigidita} as rigidita
{integrita} as integrita
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
return engine.markdown.create(views.radarMarkdownFromValues(core, "istituzione", valori, ""));
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
