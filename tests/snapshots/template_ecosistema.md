<% await tp.user.crea_ecosistema(tp) %>
# `=this.nome`

> [!info] 🌿 Ecosistema
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Salute** | `VIEW[{salute} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Lore

> [!abstract] Scheda
> Salute: `INPUT[salute][:salute]`

> [!note] Composizione
> `INPUT[textArea:composizione]`

> [!note] Equilibri
> `INPUT[textArea:equilibri]`

> [!note] Cicli
> `INPUT[textArea:cicli]`

> [!note] Minacce
> `INPUT[textArea:minacce]`

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
> **Equilibrio** `INPUT[slider(minValue(1), maxValue(5), addLabels):equilibrio]` → `VIEW[{equilibrio} == 5 ? "5 · Autopoietico" : ({equilibrio} == 4 ? "4 · Stabile" : ({equilibrio} == 3 ? "3 · Teso" : ({equilibrio} == 2 ? "2 · Fragile" : ({equilibrio} == 1 ? "1 · Collassante" : ("—")))))]`
> **Diversità** `INPUT[slider(minValue(1), maxValue(5), addLabels):diversita]` → `VIEW[{diversita} == 5 ? "5 · Esuberante" : ({diversita} == 4 ? "4 · Ricco" : ({diversita} == 3 ? "3 · Vario" : ({diversita} == 2 ? "2 · Povero" : ({diversita} == 1 ? "1 · Monocultura" : ("—")))))]`
> **Naturalezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):naturalezza]` → `VIEW[{naturalezza} == 5 ? "5 · Artificiale" : ({naturalezza} == 4 ? "4 · Ingegnerizzato" : ({naturalezza} == 3 ? "3 · Gestito" : ({naturalezza} == 2 ? "2 · Influenzato" : ({naturalezza} == 1 ? "1 · Selvatico" : ("—")))))]`

> [!note]- Equilibrio — Quanto la rete di specie è stabile o sul punto di crollare.
> **1 · Collassante** — In rovina; estinzioni a catena in corso.
> **2 · Fragile** — Squilibrato; un colpo basta a romperlo.
> **3 · Teso** — Equilibrio precario, mantenuto a fatica.
> **4 · Stabile** — Robusto; assorbe gli shock e si riprende.
> **5 · Autopoietico** — Si autoregola e rigenera; quasi indistruttibile.

> [!note]- Diversità — Quanto è vario il ventaglio di specie e ruoli.
> **1 · Monocultura** — Una o due specie dominano tutto.
> **2 · Povero** — Poche specie; ruoli ecologici scoperti.
> **3 · Vario** — Discreta varietà; catene complete.
> **4 · Ricco** — Molte specie e nicchie; rete fitta.
> **5 · Esuberante** — Biodiversità estrema; ruoli ridondanti e resilienti.

> [!note]- Naturalezza — Quanto l'ecosistema è naturale o plasmato/artificiale.
> **1 · Selvatico** — Del tutto naturale; nessuna mano intelligente.
> **2 · Influenzato** — Tracce di presenza civile, ai margini.
> **3 · Gestito** — Coltivato o regolato da una civiltà.
> **4 · Ingegnerizzato** — Progettato con magia o tecnica; funzionale a uno scopo.
> **5 · Artificiale** — Interamente costruito; vive solo per intervento esterno.

```meta-bind-js-view
{equilibrio} as equilibrio
{diversita} as diversita
{naturalezza} as naturalezza
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
return engine.markdown.create(views.radarMarkdownFromValues(core, "ecosistema", valori, ""));
```

--- Collegamenti

> [!example] Relazioni
> **Bioma**: `INPUT[suggester(optionQuery("Mondi/Biomi"), useLinks(partial), allowOther):bioma]`
> **Specie coinvolte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):specie]`
> **Dove si trova**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

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
