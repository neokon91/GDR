<% await tp.user.crea_creatura(tp) %>
# `=this.nome`

> [!infobox|creatura] 🐾 Creatura
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Taglia** | `VIEW[{taglia} ?? "—"]` |
> | **Grado di sfida** | `VIEW[{gs} ?? "—"]` |
> | **Ruolo ecologico** | `VIEW[{ruolo_ecologico} ?? "—"]` |
> | **Dieta** | `VIEW[{dieta} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(aberrazione), option(bestia), option(celestiale), option(costrutto), option(drago), option(elementale), option(fata), option(gigante), option(immondo), option(melma), option(mostruosita), option(non-morto), option(umanoide), option(vegetale)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

````tabs
--- 🐉 Statblock 5.5e

```statblock
layout: D&D 5.5 Layout ITA - Compatibile 5e
name: <% tp.config.target_file.basename %>
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
gear: ""
senses: Percezione passiva 10
languages: Comune
cr: "1"
pb: "+2"
traits: []
actions: []
bonus_actions: []
reactions: []
legendary_description: ""
legendary_actions: []
```

> [!tip]- 🎲 Genera dal Grado di sfida
> Imposta il **GS** (tab *Lore*) e premi: lo statblock qui sopra si riempie coi valori base dei mostri SRD di pari GS (AC/PF/iniziativa + multiattacco e un attacco col bonus e il danno tipici). Poi rifinisci a mano (tratti, resistenze, leggendarie).
> `BUTTON[genera-statblock]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderVerificaGS");
```

--- 🐉 Statblock 5e

> Stessa creatura, resa **classica 5e** (cambia solo il layout). I numeri si modificano nel tab *Statblock 5.5e*: questa scheda li rispecchia (richiede `statblock: inline`, già impostato dal wizard).
```statblock
layout: Basic 5e Layout ITA
monster: <% tp.config.target_file.basename %>
```

--- 🎲 Al tavolo

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
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderClock");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderPressioni");
```

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Avanza / scatena
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📖 Lore

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


--- 📊 Carattere

> [!abstract] Carattere
> **Indole** `INPUT[slider(minValue(1), maxValue(5), addLabels):indole]` → `VIEW[{indole} == 5 ? "5 · Feroce" : ({indole} == 4 ? "4 · Aggressiva" : ({indole} == 3 ? "3 · Territoriale" : ({indole} == 2 ? "2 · Schiva" : ({indole} == 1 ? "1 · Docile" : ("—")))))]`
> **Socialità** `INPUT[slider(minValue(1), maxValue(5), addLabels):socialita]` → `VIEW[{socialita} == 5 ? "5 · Ipercollettiva" : ({socialita} == 4 ? "4 · Comunitaria" : ({socialita} == 3 ? "3 · Aggregativa" : ({socialita} == 2 ? "2 · Individualista" : ({socialita} == 1 ? "1 · Solitaria" : ("—")))))]`
> **Mobilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):mobilita]` → `VIEW[{mobilita} == 5 ? "5 · Errante" : ({mobilita} == 4 ? "4 · Migratoria" : ({mobilita} == 3 ? "3 · Adattiva" : ({mobilita} == 2 ? "2 · Territoriale" : ({mobilita} == 1 ? "1 · Radicata" : ("—")))))]`
> **Natura** `INPUT[slider(minValue(1), maxValue(5), addLabels):natura]` → `VIEW[{natura} == 5 ? "5 · Aberrante" : ({natura} == 4 ? "4 · Magica" : ({natura} == 3 ? "3 · Toccata" : ({natura} == 2 ? "2 · Insolita" : ({natura} == 1 ? "1 · Mondana" : ("—")))))]`
> **Intelletto** `INPUT[slider(minValue(1), maxValue(5), addLabels):intelletto]` → `VIEW[{intelletto} == 5 ? "5 · Geniale" : ({intelletto} == 4 ? "4 · Sapiente" : ({intelletto} == 3 ? "3 · Senziente" : ({intelletto} == 2 ? "2 · Astuto" : ({intelletto} == 1 ? "1 · Istintivo" : ("—")))))]`

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
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "creatura", component);
```

--- 🔗 Collegamenti

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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
