<% await tp.user.crea_entita_primordiale(tp) %>
# `=this.nome`

> [!infobox|entita_primordiale] 🌑 Entità primordiale
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Stato cosmico** | `INPUT[stato_cosmico][:stato_cosmico]` |
> | **Allineamento** | `INPUT[allineamento][:allineamento]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(forza primordiale), option(titano), option(entità del vuoto), option(aspetto incarnato), option(dormiente)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Entità primordiale
> **Cos'è** · Un'entità primordiale è un essere pre-divino che incarna una legge e appartiene a un dominio; da essa discendono le divinità.
> **Campi chiave** · **Stato** (sigillata/dormiente/desta, query-abile) e **Allineamento**; poi le relazioni **Legge incarnata** e **Dominio**; sul Carattere **Risveglio**.
> **Spunti** · Quale legge incarna — ed è mente cosciente o forza cieca? Dorme, è sigillata o desta? E cosa basterebbe a risvegliarla? Cosa ha lasciato dietro di sé: stirpi, divinità, una ferita nel mondo?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Ruolo cosmico
> [!question]- 💡 Ruolo cosmico: la sua funzione nell'ordine (o disordine) del cosmo

## Volontà
> [!question]- 💡 Volontà: cosa vuole, cosa muove la sua azione

## Eredità
> [!question]- 💡 Eredità: cosa ha lasciato (divinità, stirpi, luoghi, leggi)

## Manifestazioni
> [!question]- 💡 Manifestazioni: segni del suo risveglio o della sua presenza

> [!rivela|segreto]- Segreto
> 💡 *Il vero nome o la verità sigillata su di essa*
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
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "entita_primordiale", component);
```

> [!abstract] Carattere
> **Coscienza** `INPUT[slider(minValue(1), maxValue(5), addLabels):coscienza]` → `VIEW[{coscienza} == 5 ? "5 · Sovrana" : ({coscienza} == 4 ? "4 · Volitiva" : ({coscienza} == 3 ? "3 · Senziente" : ({coscienza} == 2 ? "2 · Istintiva" : ({coscienza} == 1 ? "1 · Cieca" : ("—")))))]`
> **Risveglio** `INPUT[slider(minValue(1), maxValue(5), addLabels):risveglio]` → `VIEW[{risveglio} == 5 ? "5 · Scatenata" : ({risveglio} == 4 ? "4 · Desta" : ({risveglio} == 3 ? "3 · Stirante" : ({risveglio} == 2 ? "2 · Dormiente" : ({risveglio} == 1 ? "1 · Sigillata" : ("—")))))]`
> **Potenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):potenza]` → `VIEW[{potenza} == 5 ? "5 · Illimitata" : ({potenza} == 4 ? "4 · Cosmica" : ({potenza} == 3 ? "3 · Maggiore" : ({potenza} == 2 ? "2 · Locale" : ({potenza} == 1 ? "1 · Diminuita" : ("—")))))]`
> **Disposizione** `INPUT[slider(minValue(1), maxValue(5), addLabels):disposizione]` → `VIEW[{disposizione} == 5 ? "5 · Divorante" : ({disposizione} == 4 ? "4 · Ostile" : ({disposizione} == 3 ? "3 · Indifferente" : ({disposizione} == 2 ? "2 · Benevola" : ({disposizione} == 1 ? "1 · Protettiva" : ("—")))))]`
> **Tangibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):tangibilita]` → `VIEW[{tangibilita} == 5 ? "5 · Onnipresente" : ({tangibilita} == 4 ? "4 · Incarnata" : ({tangibilita} == 3 ? "3 · Aspetto" : ({tangibilita} == 2 ? "2 · Presenza" : ({tangibilita} == 1 ? "1 · Concetto" : ("—")))))]`

> [!note]- Coscienza — Quanto è mente cosciente o forza cieca.
> **1 · Cieca** — Forza senza mente né intento.
> **2 · Istintiva** — Reagisce, non ragiona.
> **3 · Senziente** — Consapevole, ma di logica aliena.
> **4 · Volitiva** — Ha scopi, piani, una volontà lucida.
> **5 · Sovrana** — Mente vasta che abbraccia ere e mondi.

> [!note]- Risveglio — Lo stato di attività dell'entità nel cosmo.
> **1 · Sigillata** — Imprigionata o spenta, inattiva.
> **2 · Dormiente** — Assopita; sogna e mormora.
> **3 · Stirante** — Si desta a tratti, smuove il mondo.
> **4 · Desta** — Attiva e presente, agisce nel cosmo.
> **5 · Scatenata** — Pienamente libera; ogni sua azione è evento cosmico.

> [!note]- Potenza — La scala del suo potere.
> **1 · Diminuita** — Un'eco del suo antico potere.
> **2 · Locale** — Potente in un luogo o ambito.
> **3 · Maggiore** — Forza di scala continentale o planare.
> **4 · Cosmica** — Rivaleggia con le leggi del mondo.
> **5 · Illimitata** — Il suo potere non ha confini noti.

> [!note]- Disposizione — Il suo atteggiamento verso il mondo e la vita.
> **1 · Protettiva** — Custodisce vita e ordine.
> **2 · Benevola** — Favorevole, ma per fini suoi.
> **3 · Indifferente** — Il mondo non la riguarda.
> **4 · Ostile** — Nemica della vita e delle sue forme.
> **5 · Divorante** — Esiste per disfare, consumare, annullare.

> [!note]- Tangibilità — Quanto è presenza concreta o puro principio.
> **1 · Concetto** — Puro principio, senza forma.
> **2 · Presenza** — Avvertibile, senza corpo.
> **3 · Aspetto** — Si mostra in forme transitorie.
> **4 · Incarnata** — Ha un corpo o una sede fisica.
> **5 · Onnipresente** — La sua sostanza pervade luoghi e stirpi.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Legge incarnata**: `INPUT[suggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):legge]`
> **Dominio**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Divinità discese**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luoghi (prigioni, santuari)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Sistemi magici che vi attingono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`

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
