<% await tp.user.crea_regno(tp) %>
# `=this.nome`

> [!infobox|regno] 👑 Regno
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Sovrano / capo** | `VIEW[{sovrano} ?? "—"]` |
> | **Portata** | `VIEW[{portata} ?? "—"]` |
> | **Popolazione** | `VIEW[{popolazione} ?? "—"]` |
> | **Simbolo** | `VIEW[{simbolo} ?? "—"]` |
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
> [!abstract] Scheda
> Sovrano / capo: `INPUT[text:sovrano]`
> Portata: `INPUT[portata][:portata]`
> Popolazione: `INPUT[text:popolazione]`
> Simbolo: `INPUT[text:simbolo]`

> [!note] Storia
> `INPUT[textArea:storia_regno]`

> [!note] Società
> `INPUT[textArea:societa]`

> [!note] Economia
> `INPUT[textArea:economia]`

> [!note] Forza
> `INPUT[textArea:forza]`

> [!note] Tensione
> `INPUT[textArea:tensione]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


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
--- 📊 Carattere

> [!abstract] Carattere
> **Coesione Politica** `INPUT[slider(minValue(1), maxValue(5), addLabels):coesione_politica]` → `VIEW[{coesione_politica} == 5 ? "5 · Monolitica" : ({coesione_politica} == 4 ? "4 · Centralizzata" : ({coesione_politica} == 3 ? "3 · Policentrica" : ({coesione_politica} == 2 ? "2 · Confederale" : ({coesione_politica} == 1 ? "1 · Tribale" : ("—")))))]`
> **Stabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita]` → `VIEW[{stabilita} == 5 ? "5 · Granitica" : ({stabilita} == 4 ? "4 · Salda" : ({stabilita} == 3 ? "3 · Contesa" : ({stabilita} == 2 ? "2 · Fragile" : ({stabilita} == 1 ? "1 · Sull'orlo" : ("—")))))]`
> **Apertura** `INPUT[slider(minValue(1), maxValue(5), addLabels):apertura]` → `VIEW[{apertura} == 5 ? "5 · Cosmopolita" : ({apertura} == 4 ? "4 · Aperto" : ({apertura} == 3 ? "3 · Pragmatico" : ({apertura} == 2 ? "2 · Protezionista" : ({apertura} == 1 ? "1 · Isolazionista" : ("—")))))]`
> **Proiezione** `INPUT[slider(minValue(1), maxValue(5), addLabels):proiezione]` → `VIEW[{proiezione} == 5 ? "5 · Egemonico" : ({proiezione} == 4 ? "4 · Espansionista" : ({proiezione} == 3 ? "3 · Influente" : ({proiezione} == 2 ? "2 · Difensivo" : ({proiezione} == 1 ? "1 · Ripiegato" : ("—")))))]`

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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "regno", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCoerenza");
```

--- 🕰 Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- 🔗 Collegamenti

> [!example] Relazioni
> **Capitale**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):capitale]`
> **Territori**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):territori]`
> **Cultura dominante**: `INPUT[suggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):cultura]`
> **Dinastia / sovrani**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):dinastia]`
> **Fazioni di corte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Regni alleati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):alleati]`
> **Regni rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):rivali]`

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

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
