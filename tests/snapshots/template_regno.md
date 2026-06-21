<% await tp.user.crea_regno(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|regno] 👑 Regno
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Capitale** | `VIEW[{capitale}][link]` |
> | **Sovrano / capo** | `INPUT[text:sovrano]` |
> | **Portata** | `INPUT[portata][:portata]` |
> | **Popolazione** | `INPUT[text(placeholder(es. 5.000 o «poche centinaia»)):popolazione]` |
> | **Simbolo** | `INPUT[text(placeholder(es. un sole infranto su campo nero)):simbolo]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(monarchia), option(impero), option(repubblica), option(teocrazia), option(oligarchia), option(magocrazia), option(città-stato), option(confederazione), option(feudo), option(despotismo)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Regno
> **Cos'è** · Il regno è il potere organizzato sopra luoghi e fazioni: chi governa, quanto è saldo il trono e con chi è in pace o in guerra.
> **Campi chiave** · Il **Tipo** È la forma di governo (monarchia, impero, repubblica, teocrazia, magocrazia…) e porta i suoi campi; **Sovrano**, **Capitale**, **Alleati**/**Rivali** lo legano alla mappa politica; sul Carattere **Stabilità**.
> **Spunti** · Chi siede sul trono, e quanto è saldo? Qual è la minaccia che potrebbe farlo cadere? Da cosa trae ricchezza e potere?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Storia
> [!question]- 💡 Storia: fondazione, ascesa, crisi

## Società
> [!question]- 💡 Società: popolo, classi, vita quotidiana

## Economia
> [!question]- 💡 Economia e risorse: di cosa vive

## Forza
> [!question]- 💡 Forza: esercito, magia, alleanze

## Tensione
> [!question]- 💡 Tensione presente (cosa minaccia il regno)

> [!rivela|segreto]- Segreto
> 💡 *Il segreto del trono*
>

%%/prosa%%

--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text(placeholder(es. il barone raddoppia le guardie)):prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti · scadenza (opz.) `INPUT[number:scadenza]` giri
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
> **Pressione** = quanto scotta *adesso* (temperatura) · **Clock** = il countdown alla conseguenza. Pressione e spinte dal grafo *giustificano* di avanzare il clock; l'imminenza nei cruscotti le pesa entrambe.
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza e chiede se il fronte è *risolto* (si chiude, archiviato) o *ricorrente* (riparte, clock azzerato).

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "regno", component);
```

> [!abstract] Carattere
> **Coesione Politica** `INPUT[slider(minValue(1), maxValue(5), addLabels):coesione_politica]` → `VIEW[{coesione_politica} == 5 ? "5 · Monolitica" : ({coesione_politica} == 4 ? "4 · Centralizzata" : ({coesione_politica} == 3 ? "3 · Policentrica" : ({coesione_politica} == 2 ? "2 · Confederale" : ({coesione_politica} == 1 ? "1 · Tribale" : ("—")))))]`
> **Stabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita]` → `VIEW[{stabilita} == 5 ? "5 · Granitica" : ({stabilita} == 4 ? "4 · Salda" : ({stabilita} == 3 ? "3 · Contesa" : ({stabilita} == 2 ? "2 · Fragile" : ({stabilita} == 1 ? "1 · Sull'orlo" : ("—")))))]`
> **Apertura** `INPUT[slider(minValue(1), maxValue(5), addLabels):apertura]` → `VIEW[{apertura} == 5 ? "5 · Cosmopolita" : ({apertura} == 4 ? "4 · Aperto" : ({apertura} == 3 ? "3 · Pragmatico" : ({apertura} == 2 ? "2 · Protezionista" : ({apertura} == 1 ? "1 · Isolazionista" : ("—")))))]`
> **Proiezione** `INPUT[slider(minValue(1), maxValue(5), addLabels):proiezione]` → `VIEW[{proiezione} == 5 ? "5 · Egemonico" : ({proiezione} == 4 ? "4 · Espansionista" : ({proiezione} == 3 ? "3 · Influente" : ({proiezione} == 2 ? "2 · Difensivo" : ({proiezione} == 1 ? "1 · Ripiegato" : ("—")))))]`
> **Potenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):potenza]` → `VIEW[{potenza} == 5 ? "5 · Egemone" : ({potenza} == 4 ? "4 · Maggiore" : ({potenza} == 3 ? "3 · Regionale" : ({potenza} == 2 ? "2 · Modesta" : ({potenza} == 1 ? "1 · Trascurabile" : ("—")))))]`

> [!note]- Coesione Politica — Quanto il potere è unificato o disperso nel regno.
> **1 · Tribale** — Clan e famiglie autonomi; unità solo simbolica.
> **2 · Confederale** — Nuclei cooperano via consigli; decisioni lente.
> **3 · Policentrica** — Più centri di potere con autorità centrale debole.
> **4 · Centralizzata** — Autorità unificata; periferie soggette a leggi comuni.
> **5 · Monolitica** — Potere assoluto e indiviso; la dissidenza è tradimento.

> [!note]- Stabilità — Solidità del regno nel presente.
> **1 · Sull'orlo** — Collasso imminente; guerra civile o invasione.
> **2 · Fragile** — Crisi aperte; il trono vacilla.
> **3 · Contesa** — Tensioni gestite; equilibrio precario ma in piedi.
> **4 · Salda** — Istituzioni solide; le crisi sono contenute.
> **5 · Granitica** — Ordine duraturo; pace e continuità da generazioni.

> [!note]- Apertura — Atteggiamento verso stranieri, idee e altri popoli.
> **1 · Isolazionista** — Chiuso e diffidente; confini sigillati.
> **2 · Protezionista** — Scambi limitati e sorvegliati.
> **3 · Pragmatico** — Aperto per convenienza; alleanze mutevoli.
> **4 · Aperto** — Commerci e migrazioni incoraggiati; cosmopolita.
> **5 · Cosmopolita** — Crocevia di popoli; identità plurale e fluida.

> [!note]- Proiezione — Quanto il regno cerca di espandersi o influenzare fuori dai confini.
> **1 · Ripiegato** — Solo sopravvivenza interna; nessuna ambizione esterna.
> **2 · Difensivo** — Tutela i confini; non cerca espansione.
> **3 · Influente** — Pesa nella diplomazia regionale; gioca di sponda.
> **4 · Espansionista** — Conquista o colonizza attivamente.
> **5 · Egemonico** — Mira al dominio totale; impero in marcia.

> [!note]- Potenza — Il peso aggregato — militare ed economico — che il regno può proiettare.
> **1 · Trascurabile** — Sopravvive per concessione altrui; nessun peso.
> **2 · Modesta** — Si difende, non attacca; conta a livello locale.
> **3 · Regionale** — Una potenza fra pari; pesa nei suoi confini.
> **4 · Maggiore** — Detta legge a vicini più deboli; eserciti veri.
> **5 · Egemone** — Il suo solo nome muove alleanze e paure.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCoerenza");
```

--- 🕰 Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Capitale**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):capitale]`
> **Territori**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):territori]`
> **Cultura dominante**: `INPUT[suggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):cultura]`
> **Dinastia / sovrani**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):dinastia]`
> **Organi e fazioni di stato**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Regni alleati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):alleati]`
> **Regni rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):rivali]`
> **Editti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Editti"), useLinks(partial), allowOther):editti]`
> **Eserciti / forze armate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eserciti"), useLinks(partial), allowOther):eserciti]`
> **Risorse / economia**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):risorse]`
> **Religione di stato**: `INPUT[suggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):religione_stato]`
> **Lingua ufficiale**: `INPUT[suggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):lingua_ufficiale]`
> **Background d'origine**: `INPUT[inlineListSuggester(optionQuery("Mondi/Background"), useLinks(partial), allowOther):background]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
