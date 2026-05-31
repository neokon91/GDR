<% await tp.user.crea_creatura(tp) %>
# `=this.nome`

> [!info] Creatura
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Statblock

```statblock
layout: D&D 5.5 Layout ITA - Compatibile 5e
name: <% tp.file.title %>
size: Medio
type: umanoide
subtype: ""
alignment: neutrale
ac: 10
hp: 10
hit_dice: 2d8
speed: 9 m
initiative: "+0"
stats: [10, 10, 10, 10, 10, 10]
saves: []
skillsaves: []
damage_vulnerabilities: ""
damage_resistances: ""
damage_immunities: ""
condition_immunities: ""
senses: Percezione passiva 10
languages: Comune
cr: "1"
traits: []
actions: []
bonus_actions: []
reactions: []
legendary_actions: []
```

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
--- Lore

> [!abstract] Scheda
> Taglia: `INPUT[taglia][:taglia]`
> Grado di sfida: `INPUT[gs][:gs]`
> Ruolo ecologico: `INPUT[text:ruolo_ecologico]`
> Dieta: `INPUT[dieta][:dieta]`

> [!note]- Aspetto e indole
> Com'è fatta, come si muove, che impressione dà. I numeri 5e sono nel tab Statblock.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Ecologia
> `INPUT[textArea:ecologia]`

> [!note] Aspetto
> `INPUT[textArea:aspetto]`

> [!note] Comportamento
> `INPUT[textArea:comportamento]`

> [!note] Tattiche
> `INPUT[textArea:tattiche]`

> [!note] Mito e reputazione
> `INPUT[textArea:mito]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


--- Carattere

> [!abstract] Carattere
> **Indole** `INPUT[slider(minValue(1), maxValue(5), addLabels):indole]`
> **Socialità** `INPUT[slider(minValue(1), maxValue(5), addLabels):socialita]`
> **Mobilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):mobilita]`
> **Natura** `INPUT[slider(minValue(1), maxValue(5), addLabels):natura]`
> **Intelletto** `INPUT[slider(minValue(1), maxValue(5), addLabels):intelletto]`

> [!note]- Indole — Disposizione della creatura verso chi incontra.
> **1 · Docile** — Mansueta, non aggressiva; fugge o ignora più che attaccare.
> **2 · Schiva** — Diffidente; evita il contatto, reagisce solo se messa alle strette.
> **3 · Territoriale** — Tollerante finché non si invade il suo spazio; allora difende.
> **4 · Aggressiva** — Incline all'attacco; caccia o assale per istinto o fame.
> **5 · Feroce** — Ostile e spietata; uccide oltre il bisogno, vive per la violenza.

> [!note]- Socialità — Grado di coesione e struttura sociale della creatura.
> **1 · Solitaria** — Vive e caccia da sola; legami rari o solo riproduttivi.
> **2 · Individualista** — Convive in prossimità ma autonoma; interazioni utilitaristiche.
> **3 · Aggregativa** — Gruppi flessibili (branchi, clan) per necessità territoriale o biologica.
> **4 · Comunitaria** — Comunità organizzate con ruoli distinti e relazioni stabili.
> **5 · Ipercollettiva** — L'individuo non esiste: colonia, alveare, coscienza distribuita.

> [!note]- Mobilità — Rapporto della creatura col territorio e il movimento.
> **1 · Radicata** — Legata a un solo bioma; non può o non vuole spostarsi.
> **2 · Territoriale** — Confini definiti; viaggia ma torna sempre al proprio habitat.
> **3 · Adattiva** — Si adatta a vari ambienti; nucleo d'origine ma non vincolata.
> **4 · Migratoria** — Migra seguendo rotte, cicli stagionali o necessità.
> **5 · Errante** — Sempre in movimento; nessuna terra propria, vagabonda per natura.

> [!note]- Natura — Quanto la creatura è ordinaria o intrisa di magia.
> **1 · Mondana** — Bestia naturale; nessun tratto soprannaturale.
> **2 · Insolita** — Tratti fuori dal comune (taglia, resistenza), ma ancora naturale.
> **3 · Toccata** — Magia latente o residua: un'abilità, un'aura, un'origine arcana.
> **4 · Magica** — Apertamente soprannaturale; poteri, incantesimi, forma mutevole.
> **5 · Aberrante** — Essere di pura magia o altri piani; piega le leggi della realtà.

> [!note]- Intelletto — Livello di coscienza e capacità cognitiva.
> **1 · Istintivo** — Agisce per puro istinto; nessun pensiero astratto.
> **2 · Astuto** — Furbizia animale; trappole, finte, apprendimento limitato.
> **3 · Senziente** — Linguaggio e ragionamento; cultura semplice possibile.
> **4 · Sapiente** — Pensiero simbolico ed etico; strategie, inganni elaborati.
> **5 · Geniale** — Mente superiore o aliena; piani secolari, concetti iperoggettivi.

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
> **Habitat**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):habitat]`
> **Specie**: `INPUT[suggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):specie]`

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
````
