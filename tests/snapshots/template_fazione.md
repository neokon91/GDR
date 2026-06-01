<% await tp.user.crea_fazione(tp) %>
# `=this.nome`

> [!info] ⚔️ Fazione
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
> **Portata** `VIEW[{portata} ?? "—"]` · **Motto** `VIEW[{motto} ?? "—"]` · **Forma di governo** `VIEW[{forma_governo} ?? "—"]` · **Epoca di fondazione** `VIEW[{fondazione} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`
> Motto: `INPUT[text:motto]`
> Forma di governo: `INPUT[text:forma_governo]`
> Epoca di fondazione: `INPUT[text:fondazione]`

> [!note]- Identità
> Cosa rappresenta la fazione, simboli, reputazione e percezione pubblica.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Obiettivo
> `INPUT[textArea:obiettivo]`

> [!note] Metodi
> `INPUT[textArea:metodo]`

> [!note] Gerarchia
> `INPUT[textArea:gerarchia]`

> [!note] Influenza
> `INPUT[textArea:influenza]`

> [!note] Nel presente
> `INPUT[textArea:presente]`

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
> **Struttura** `INPUT[slider(minValue(1), maxValue(5), addLabels):struttura]` → `VIEW[{struttura} == 5 ? "5 · Piramidale" : ({struttura} == 4 ? "4 · Gerarchica" : ({struttura} == 3 ? "3 · Semi-gerarchica" : ({struttura} == 2 ? "2 · Consiliare" : ({struttura} == 1 ? "1 · Orizzontale" : ("—")))))]`
> **Scopo Primario** `INPUT[slider(minValue(1), maxValue(5), addLabels):scopo]` → `VIEW[{scopo} == 5 ? "5 · Pragmatico" : ({scopo} == 4 ? "4 · Opportunista" : ({scopo} == 3 ? "3 · Equilibrato" : ({scopo} == 2 ? "2 · Visionario" : ({scopo} == 1 ? "1 · Ideale puro" : ("—")))))]`
> **Metodo Operativo** `INPUT[slider(minValue(1), maxValue(5), addLabels):metodo_operativo]` → `VIEW[{metodo_operativo} == 5 ? "5 · Palese" : ({metodo_operativo} == 4 ? "4 · Controllato" : ({metodo_operativo} == 3 ? "3 · Ambivalente" : ({metodo_operativo} == 2 ? "2 · Discreto" : ({metodo_operativo} == 1 ? "1 · Occulto" : ("—")))))]`
> **Legalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):legalita]` → `VIEW[{legalita} == 5 ? "5 · Ufficiale" : ({legalita} == 4 ? "4 · Legale" : ({legalita} == 3 ? "3 · Semi-legale" : ({legalita} == 2 ? "2 · Tollerata" : ({legalita} == 1 ? "1 · Illegale" : ("—")))))]`
> **Etica del Conflitto** `INPUT[slider(minValue(1), maxValue(5), addLabels):etica_conflitto]` → `VIEW[{etica_conflitto} == 5 ? "5 · Espansionista" : ({etica_conflitto} == 4 ? "4 · Dominante" : ({etica_conflitto} == 3 ? "3 · Equilibrata" : ({etica_conflitto} == 2 ? "2 · Reattiva" : ({etica_conflitto} == 1 ? "1 · Difensiva" : ("—")))))]`

> [!note]- Struttura — Grado di organizzazione interna e rigidità della catena di comando.
> **1 · Orizzontale** — Nessuna struttura fissa; decisioni collettive. Cellule, bande, reti informali.
> **2 · Consiliare** — Potere distribuito tra circoli; decisioni per consultazione. Alleanze, logge.
> **3 · Semi-gerarchica** — Capi e ruoli riconosciuti, ma con margini di autonomia. Gerarchia fluida.
> **4 · Gerarchica** — Catena di comando definita; gradi e responsabilità chiari, decisioni dall'alto.
> **5 · Piramidale** — Vertice assoluto; ogni ruolo per statuto o lignaggio. Ordini militari, regimi.

> [!note]- Scopo Primario — Natura dell'obiettivo perseguito, da ideale astratto a interesse concreto.
> **1 · Ideale puro** — Fine astratto o trascendente (giustizia, verità); sacrifica i risultati alla visione.
> **2 · Visionario** — Idealistico ma con piani concreti. Riformisti, ordini morali, rivoluzionari.
> **3 · Equilibrato** — Fine sia simbolico che pratico; l'ideale guida ma non è la sola motivazione.
> **4 · Opportunista** — Mira a vantaggi materiali con una facciata ideologica per legittimarsi.
> **5 · Pragmatico** — Solo sopravvivenza, espansione, guadagno. Gilde mercenarie, cartelli.

> [!note]- Metodo Operativo — Grado di visibilità e trasparenza con cui la fazione agisce.
> **1 · Occulto** — Esistenza segreta o negata; spionaggio, cospirazioni, riti nascosti.
> **2 · Discreto** — Nota a pochi; agisce via emissari o organizzazioni di copertura.
> **3 · Ambivalente** — Doppia faccia: identità pubblica rispettabile, fini alternativi celati.
> **4 · Controllato** — Nota e riconosciuta, ma cauta; l'agenda completa non è pubblica.
> **5 · Palese** — Agisce apertamente, dichiara i suoi scopi. Governi, ordini, movimenti.

> [!note]- Legalità — Status rispetto all'ordinamento politico e giuridico dominante.
> **1 · Illegale** — Fuorilegge, perseguitata; i membri rischiano arresto o morte. Ribelli, congiure.
> **2 · Tollerata** — Senza riconoscimento, ma tollerata per convenienza o paura. Ai margini.
> **3 · Semi-legale** — Riconoscimento limitato o ambiguo; opera con vincoli o stigma.
> **4 · Legale** — Pienamente legale; sedi, insegne, potere negoziale. Non dominante.
> **5 · Ufficiale** — Organo del potere; coincide col governo o l'autorità religiosa/statale.

> [!note]- Etica del Conflitto — Approccio della fazione alla guerra, al dominio e all'autodifesa.
> **1 · Difensiva** — Conflitto solo per autodifesa; privilegia diplomazia e resistenza.
> **2 · Reattiva** — Accetta la guerra per proteggere alleati o ideali, in modo proporzionato.
> **3 · Equilibrata** — La guerra è un'opzione sempre disponibile, valutata caso per caso.
> **4 · Dominante** — Previene le minacce con la forza; conquista e deterrenza nella dottrina.
> **5 · Espansionista** — Il conflitto è sacro o glorioso; ogni ostacolo è nemico. Imperi, crociate.

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
> **Sede**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):sede]`
> **Fondatori**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):fondatori]`
> **Figure chiave**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Alleate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):alleati]`
> **Rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):rivali]`

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
