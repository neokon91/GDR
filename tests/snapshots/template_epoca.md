<% await tp.user.crea_epoca(tp) %>
# `=this.nome`

> [!info] ⏳ Epoca
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
> **Inizio** `VIEW[{inizio} ?? "—"]` · **Fine** `VIEW[{fine} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

> [!info] Famiglia: `INPUT[inlineSelect(option(fondativa), option(transizionale), option(stabilizzante), option(degenerativa), option(ciclica), option(apocrifa), option(liminale)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **fondativa** — Dà origine a strutture cosmiche fondamentali: leggi, piani, razze, civiltà, entità primordiali.
> **transizionale** — Periodo di passaggio, mutazione o riformulazione ontologica.
> **stabilizzante** — L'universo trova una forma durevole, ordinata o codificata.
> **degenerativa** — L'equilibrio si corrompe, le leggi si incrinano, le civiltà decadono.
> **ciclica** — Epoca destinata a ripetersi o riemergere.
> **apocrifa** — Epoca dimenticata, rimossa o occultata.
> **liminale** — Esiste tra due stati dell'essere: confini, piani e identità incerti.

````tabs
--- Lore

> [!abstract] Scheda
> Inizio: `INPUT[text:inizio]`
> Fine: `INPUT[text:fine]`

> [!note] Panorama
> `INPUT[textArea:panorama]`

> [!note] Principi dominanti
> `INPUT[textArea:principi]`

> [!note] Sviluppi
> `INPUT[textArea:sviluppi]`

> [!note] Eredità
> `INPUT[textArea:eredita]`

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
> **Presenza Divina** `INPUT[slider(minValue(1), maxValue(5), addLabels):presenza_divina]` → `VIEW[{presenza_divina} == 5 ? "5 · Immanente" : ({presenza_divina} == 4 ? "4 · Attiva" : ({presenza_divina} == 3 ? "3 · Intermittente" : ({presenza_divina} == 2 ? "2 · Remota" : ({presenza_divina} == 1 ? "1 · Assente" : ("—")))))]`
> **Accesso alla Magia** `INPUT[slider(minValue(1), maxValue(5), addLabels):accesso_magia]` → `VIEW[{accesso_magia} == 5 ? "5 · Pervasiva" : ({accesso_magia} == 4 ? "4 · Fluida" : ({accesso_magia} == 3 ? "3 · Regolata" : ({accesso_magia} == 2 ? "2 · Occulta" : ({accesso_magia} == 1 ? "1 · Sigillata" : ("—")))))]`
> **Centralità Mortale** `INPUT[slider(minValue(1), maxValue(5), addLabels):centralita_mortale]` → `VIEW[{centralita_mortale} == 5 ? "5 · Ascesa dei mortali" : ({centralita_mortale} == 4 ? "4 · Predominio mortale" : ({centralita_mortale} == 3 ? "3 · Coesistenza" : ({centralita_mortale} == 2 ? "2 · Sorveglianza" : ({centralita_mortale} == 1 ? "1 · Dominio divino" : ("—")))))]`
> **Stabilità Geopolitica** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita_geopolitica]` → `VIEW[{stabilita_geopolitica} == 5 ? "5 · Unificata" : ({stabilita_geopolitica} == 4 ? "4 · Centralizzata" : ({stabilita_geopolitica} == 3 ? "3 · Bilanciata" : ({stabilita_geopolitica} == 2 ? "2 · Turbolenta" : ({stabilita_geopolitica} == 1 ? "1 · Frammentata" : ("—")))))]`
> **Storicità** `INPUT[slider(minValue(1), maxValue(5), addLabels):storicita]` → `VIEW[{storicita} == 5 ? "5 · Documentata" : ({storicita} == 4 ? "4 · Cronachistica" : ({storicita} == 3 ? "3 · Ambigua" : ({storicita} == 2 ? "2 · Leggendaria" : ({storicita} == 1 ? "1 · Mitica" : ("—")))))]`

> [!note]- Presenza Divina — Quanto gli dèi sono coinvolti nel mondo durante l'epoca.
> **1 · Assente** — Gli dèi sono ignoti o silenti; il sacro non si percepisce.
> **2 · Remota** — Esistono ma distanti; parlano per segni oscuri, raramente agiscono.
> **3 · Intermittente** — Appaiono e intervengono, ma in modo irregolare e ambiguo.
> **4 · Attiva** — Camminano tra i mortali, parlano per profeti; la storia è anche divina.
> **5 · Immanente** — Il divino è ovunque; ogni cosa è sacra o sua emanazione.

> [!note]- Accesso alla Magia — Quanto la magia è disponibile e libera nell'epoca.
> **1 · Sigillata** — Assente, perduta o proibita; solo frammenti leggendari.
> **2 · Occulta** — Esiste ma nascosta; praticata da iniziati o in segreto.
> **3 · Regolata** — Riconosciuta ma incanalata da leggi, scuole, divieti.
> **4 · Fluida** — Diffusa e usata ampiamente, con costi o limiti residui.
> **5 · Pervasiva** — La realtà è tessuta di magia; tutto ne è partecipe.

> [!note]- Centralità Mortale — Quanto i popoli mortali (non gli dèi) decidono il destino del mondo.
> **1 · Dominio divino** — Gli dèi controllano tutto; i mortali sono strumenti.
> **2 · Sorveglianza** — Le divinità guidano; i mortali agiscono ma sottomessi.
> **3 · Coesistenza** — Dèi e mortali convivono; l'iniziativa è contesa.
> **4 · Predominio mortale** — I mortali decidono; gli dèi sono in ritiro.
> **5 · Ascesa dei mortali** — I mortali hanno superato o sostituito gli dèi.

> [!note]- Stabilità Geopolitica — Ordine politico e coesione territoriale dell'epoca.
> **1 · Frammentata** — Micro-regni e clan rivali; guerra e caos endemici.
> **2 · Turbolenta** — Regni instabili, confini mutevoli, guerre frequenti.
> **3 · Bilanciata** — Equilibrio fragile ma presente; trattati riconosciuti.
> **4 · Centralizzata** — Imperi forti mantengono la pace; ordine egemone.
> **5 · Unificata** — Un unico ordine globale; pace duratura o impero universale.

> [!note]- Storicità — Quanto l'epoca è ricordata come mito o come storia documentata.
> **1 · Mitica** — Avvolta nel mito; nessuna cronaca, solo archetipi.
> **2 · Leggendaria** — Eventi trasfigurati in epica; cronologie ambigue.
> **3 · Ambigua** — Tra mito e storia; frammenti scritti e reliquie.
> **4 · Cronachistica** — Ben documentata; annali, mappe, genealogie.
> **5 · Documentata** — Registrata e studiata; la storia è scienza.

```meta-bind-js-view
{presenza_divina} as presenza_divina
{accesso_magia} as accesso_magia
{centralita_mortale} as centralita_mortale
{stabilita_geopolitica} as stabilita_geopolitica
{storicita} as storicita
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
return engine.markdown.create(views.radarMarkdownFromValues(core, "epoca", valori, ""));
```

--- Collegamenti

> [!example] Relazioni
> **Eventi principali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):eventi]`
> **Divinità dominanti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`

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
