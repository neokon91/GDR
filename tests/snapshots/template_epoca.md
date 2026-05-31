<% await tp.user.crea_epoca(tp) %>
# `=this.nome`

> [!info] Epoca
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Inizio: `INPUT[text:inizio]`
> Fine: `INPUT[text:fine]`

> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

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


--- Carattere

> [!abstract] Carattere
> **Presenza Divina** `INPUT[slider(minValue(1), maxValue(5), addLabels):presenza_divina]`
> **Accesso alla Magia** `INPUT[slider(minValue(1), maxValue(5), addLabels):accesso_magia]`
> **Centralità Mortale** `INPUT[slider(minValue(1), maxValue(5), addLabels):centralita_mortale]`
> **Stabilità Geopolitica** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita_geopolitica]`
> **Storicità** `INPUT[slider(minValue(1), maxValue(5), addLabels):storicita]`

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
