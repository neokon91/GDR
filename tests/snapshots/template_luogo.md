<% await tp.user.crea_luogo(tp) %>
# `=this.nome`

> [!info] 🗺️ Luogo
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
> **Clima** `VIEW[{clima} ?? "—"]` · **Popolazione** `VIEW[{popolazione} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Clima: `INPUT[clima][:clima]`
> Popolazione: `INPUT[text:popolazione]`

> [!note]- Colpo d'occhio
> Cos'è il luogo, che impressione dà entrandoci, perché conta nella storia.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Geografia
> `INPUT[textArea:geografia]`

> [!note] Funzione
> `INPUT[textArea:funzione]`

> [!note] Atmosfera
> `INPUT[textArea:atmosfera]`

> [!note] Abitanti
> `INPUT[textArea:abitanti]`

> [!note] Storia
> `INPUT[textArea:storia]`

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
> **Stabilità Spaziale** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita_spaziale]` → `VIEW[{stabilita_spaziale} == 5 ? "5 · Mutante" : ({stabilita_spaziale} == 4 ? "4 · Instabile" : ({stabilita_spaziale} == 3 ? "3 · Anomalo" : ({stabilita_spaziale} == 2 ? "2 · Plastico" : ({stabilita_spaziale} == 1 ? "1 · Solido" : ("—")))))]`
> **Coerenza Temporale** `INPUT[slider(minValue(1), maxValue(5), addLabels):coerenza_temporale]` → `VIEW[{coerenza_temporale} == 5 ? "5 · Atemporale" : ({coerenza_temporale} == 4 ? "4 · Fratturato" : ({coerenza_temporale} == 3 ? "3 · Distorto" : ({coerenza_temporale} == 2 ? "2 · Ondulato" : ({coerenza_temporale} == 1 ? "1 · Lineare" : ("—")))))]`
> **Presenza Magica** `INPUT[slider(minValue(1), maxValue(5), addLabels):presenza_magica]` → `VIEW[{presenza_magica} == 5 ? "5 · Sovraccarica" : ({presenza_magica} == 4 ? "4 · Densa" : ({presenza_magica} == 3 ? "3 · Attiva" : ({presenza_magica} == 2 ? "2 · Debole" : ({presenza_magica} == 1 ? "1 · Nulla" : ("—")))))]`
> **Sacralità** `INPUT[slider(minValue(1), maxValue(5), addLabels):sacralita]` → `VIEW[{sacralita} == 5 ? "5 · Axis Mundi" : ({sacralita} == 4 ? "4 · Benedetto" : ({sacralita} == 3 ? "3 · Rituale" : ({sacralita} == 2 ? "2 · Neutro" : ({sacralita} == 1 ? "1 · Profano" : ("—")))))]`
> **Civilizzazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):civilizzazione]` → `VIEW[{civilizzazione} == 5 ? "5 · Iperevoluto" : ({civilizzazione} == 4 ? "4 · Urbanizzato" : ({civilizzazione} == 3 ? "3 · Colonizzato" : ({civilizzazione} == 2 ? "2 · Marginale" : ({civilizzazione} == 1 ? "1 · Selvaggio" : ("—")))))]`

> [!note]- Stabilità Spaziale — Quanto lo spazio del luogo è fisso e misurabile, o mutevole e illusorio.
> **1 · Solido** — Confini chiari e immutabili; geografia costante, coordinate affidabili.
> **2 · Plastico** — Alcune caratteristiche cambiano lievemente nel tempo o con le condizioni.
> **3 · Anomalo** — Anomalie localizzate: stanze impossibili, passaggi che appaiono solo a volte.
> **4 · Instabile** — Si trasforma spesso o imprevedibilmente; la mappa perde validità.
> **5 · Mutante** — Nessuna forma definita; cambia con la volontà o la magia, spazio concettuale.

> [!note]- Coerenza Temporale — Come scorre il tempo nel luogo, se normalmente o alterato.
> **1 · Lineare** — Tempo stabile e prevedibile; ore, giorni e anni scorrono normalmente.
> **2 · Ondulato** — Accelera o rallenta leggermente in alcune zone, senza conseguenze gravi.
> **3 · Distorto** — Varia in modo netto: accelerazioni, ripetizioni, ritardi o salti.
> **4 · Fratturato** — Più flussi temporali simultanei; gli eventi non seguono un ordine.
> **5 · Atemporale** — Tempo assente o negato; il luogo è congelato, eterno, fuori dal tempo.

> [!note]- Presenza Magica — Quantità e densità della magia presente nel luogo.
> **1 · Nulla** — Nessuna magia; gli incantesimi faticano o falliscono. Luogo morto sul piano arcano.
> **2 · Debole** — Magia latente; piccole reazioni o presenze residue.
> **3 · Attiva** — Risponde alla magia; può ospitare nodi, fonti o rituali. Effetti normali.
> **4 · Densa** — La magia permea tutto; oggetti si incantano, creature mutano.
> **5 · Sovraccarica** — Fonte vivente di energia; la magia si manifesta senza controllo.

> [!note]- Sacralità — Valore spirituale, mistico o religioso del luogo.
> **1 · Profano** — Privo di significato spirituale, o impuro/blasfemo.
> **2 · Neutro** — Nessuna connotazione sacra o empia; solo un luogo fisico.
> **3 · Rituale** — Usato per pratiche religiose o cultuali, ma non sacro in sé.
> **4 · Benedetto** — Sacro per uno o più culti; reliquie, miracoli, presenze divine.
> **5 · Axis Mundi** — Centro del mondo, contatto coi piani; archetipo vivente, nodo cosmico.

> [!note]- Civilizzazione — Grado di presenza e influenza di civiltà intelligenti.
> **1 · Selvaggio** — Natura primordiale, nessuna presenza intelligente; ambiente incontaminato.
> **2 · Marginale** — Piccoli insediamenti, ruderi o tribù; influenza civilizzata minima.
> **3 · Colonizzato** — Villaggi, rotte, campi o torri; presenza stabile ma dispersa.
> **4 · Urbanizzato** — Città, templi, fortezze; il luogo è plasmato da architettura e cultura.
> **5 · Iperevoluto** — Tecnomagia, città viventi, coscienze collettive; civilizzazione pura.

```meta-bind-js-view
{stabilita_spaziale} as stabilita_spaziale
{coerenza_temporale} as coerenza_temporale
{presenza_magica} as presenza_magica
{sacralita} as sacralita
{civilizzazione} as civilizzazione
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
return engine.markdown.create(views.radarMarkdownFromValues(core, "luogo", valori, ""));
```

--- Mappa

> [!info] Mappa
> Collega una mappa: `INPUT[mappa][:mappa]`
>
> Disegnala con **Excalidraw**, usa **Zoom Map** per immagini grandi, o trascina un'immagine nel vault e collegala.
```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(await views.renderMap(app, dv, page));
```
--- Collegamenti

> [!example] Relazioni
> **Regione**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regione]`
> **Controllata da**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`
> **Figure**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):abitanti]`

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
