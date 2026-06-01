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
> **Equilibrio Cosmologico** `INPUT[slider(minValue(1), maxValue(5), addLabels):equilibrio_cosmico]` → `VIEW[{equilibrio_cosmico} == 5 ? "5 · Equilibrata" : ({equilibrio_cosmico} == 4 ? "4 · Ordinata" : ({equilibrio_cosmico} == 3 ? "3 · In bilico" : ({equilibrio_cosmico} == 2 ? "2 · Instabile" : ({equilibrio_cosmico} == 1 ? "1 · Caotica" : ("—")))))]`
> **Dominanza Tecnologica** `INPUT[slider(minValue(1), maxValue(5), addLabels):dominanza_tecnologica]` → `VIEW[{dominanza_tecnologica} == 5 ? "5 · Post-magica" : ({dominanza_tecnologica} == 4 ? "4 · Tecno-magica" : ({dominanza_tecnologica} == 3 ? "3 · Artigianale mista" : ({dominanza_tecnologica} == 2 ? "2 · Tradizionale magica" : ({dominanza_tecnologica} == 1 ? "1 · Arcaica" : ("—")))))]`
> **Luce Cosmica** `INPUT[slider(minValue(1), maxValue(5), addLabels):luce_cosmica]` → `VIEW[{luce_cosmica} == 5 ? "5 · Illuminazione Totale" : ({luce_cosmica} == 4 ? "4 · Rivelazione Progressiva" : ({luce_cosmica} == 3 ? "3 · Penombra Ciclica" : ({luce_cosmica} == 2 ? "2 · Tetro Mistero" : ({luce_cosmica} == 1 ? "1 · Oscurità Primordiale" : ("—")))))]`

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

> [!note]- Equilibrio Cosmologico — Grado di stabilità tra le forze fondamentali dell’universo (materia, spirito, ordine, caos, tempo, spazio). Indica se i piani esistenziali e le leggi cosmiche sono in equilibrio, o se prevalgono squilibri, fratture o crisi.
> **1 · Caotica** — L’epoca è dominata dall’instabilità. I piani si sovrappongono o collassano, le leggi cosmiche sono fluide o violate. La realtà muta imprevedibilmente. Crisi, frammentazione e guerre cosmiche sono comuni.
> **2 · Instabile** — Esistono parvenze di ordine, ma continuamente minacciate. Il conflitto tra forze cosmiche è aperto o latente. Alcuni piani sono stabili, altri collassano o interferiscono. Il mondo vive sul filo della frattura.
> **3 · In bilico** — L’equilibrio tra le forze fondamentali è raggiunto a fatica e mantenuto da entità, rituali o cicli. È fragile ma reale. Una svolta, un evento o una profezia può spezzarlo o consolidarlo.
> **4 · Ordinata** — Le leggi cosmiche sono rispettate. I piani sono distinti e stabili. L’ordine regna nella struttura metafisica del cosmo. Le crisi esistono ma sono contenute o ritualizzate.
> **5 · Equilibrata** — L’epoca è il culmine dell’armonia cosmica. Le forze opposte sono perfettamente bilanciate. La realtà è coesa, il ciclo della vita e della morte è stabile, i flussi magici scorrono senza distorsioni.

> [!note]- Dominanza Tecnologica — Livello di sviluppo tecnologico, magico o tecno-magico predominante nell’epoca. Esprime quanto la civiltà faccia affidamento su strumenti, incantesimi o fusioni avanzate tra le due forze.
> **1 · Arcaica** — La tecnologia è primitiva o inesistente. Strumenti in pietra, legno o osso, agricoltura rudimentale, conoscenze empiriche. Magia rara o assente. L’epoca è dominata dalla sopravvivenza.
> **2 · Tradizionale magica** — La tecnologia è elementare, ma la magia ha ruolo centrale. Oggetti incantati, guarigione spirituale, rituali agricoli. La conoscenza è orale, trasmessa da druidi, sciamani o stregoni.
> **3 · Artigianale mista** — Convivenza di tecnologie medievali e magia pratica. Forgiatura, alchimia, runologia, costruzione di golem o armi incantate. La magia inizia a essere sistematizzata o codificata.
> **4 · Tecno-magica** — Fusione di scienza e magia. Motrici arcane, città fluttuanti, automi coscienti, comunicazione astrale. La conoscenza è formalizzata in accademie o corporazioni. La magia è replicabile.
> **5 · Post-magica** — La magia è diventata tecnologia. Artefatti funzionano come macchine, leggi magiche sono standardizzate. L’epoca è dominata da civilizzazioni che piegano le leggi cosmiche a fini scientifici o militari.

> [!note]- Luce Cosmica — Grado di trasparenza spirituale, visibilità metafisica e permeazione della verità cosmica. Indica se l’epoca è dominata da tenebre occulte, ignoranza e frammentazione o da rivelazione, ordine e consapevolezza.
> **1 · Oscurità Primordiale** — L’universo è avvolto da tenebre originarie. La conoscenza è quasi assente, le forze primigenie dominano, la realtà è opaca, instabile e incomprensibile. Non esistono ancora legge, parola o coscienza.
> **2 · Tetro Mistero** — L’epoca è velata, dominata da enigmi, divieti, culti oscuri o forze ignote. Alcuni spiragli di sapere emergono, ma la verità è ancora nascosta e minacciosa. La luce esiste solo come promessa lontana.
> **3 · Penombra Ciclica** — L’equilibrio tra luce e ombra è dinamico. L’epoca attraversa fasi di rivelazione e oblio. La conoscenza è parziale, contestata o riservata a pochi. Vi è tensione tra chiarezza e oscuramento.
> **4 · Rivelazione Progressiva** — La luce cosmica aumenta. Le forze sacre emergono, le leggi vengono comprese, la realtà è decifrabile. Il mondo diventa leggibile, i piani si ordinano, le divinità parlano o si manifestano.
> **5 · Illuminazione Totale** — Tutto è chiaro. L’epoca culmina in un’apertura cosmica, in cui il sapere sacro, l’ordine metafisico e l’armonia sono pienamente manifesti. Le tenebre sono dissolte o integrate. L’universo è trasparente all’intelletto divino o mortale.

```meta-bind-js-view
{presenza_divina} as presenza_divina
{accesso_magia} as accesso_magia
{centralita_mortale} as centralita_mortale
{stabilita_geopolitica} as stabilita_geopolitica
{storicita} as storicita
{equilibrio_cosmico} as equilibrio_cosmico
{dominanza_tecnologica} as dominanza_tecnologica
{luce_cosmica} as luce_cosmica
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
