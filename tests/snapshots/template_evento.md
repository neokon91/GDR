<% await tp.user.crea_evento(tp) %>
# `=this.nome`

> [!infobox|evento] 📜 Evento
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Epoca** | `VIEW[{epoca}][link]` |
> | **Luogo** | `VIEW[{luogo}][link]` |
> | **Portata** | `INPUT[portata][:portata]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(evento storico), option(evento di campagna), option(conflitto), option(conseguenza)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(cosmico), option(epocale), option(mitico), option(sacrale), option(catastrofico), option(fondativo), option(transizionale)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **cosmico** — Coinvolge l'equilibrio dell'universo: nascita o morte di leggi fondamentali, piani o entità primordiali.
> **epocale** — Marca un prima e un dopo nella linea storica, aprendo o chiudendo un'epoca.
> **mitico** — Evento archetipico tramandato in forma simbolica o leggendaria.
> **sacrale** — Implica un contatto diretto col divino o una trasformazione spirituale profonda.
> **catastrofico** — Evento distruttivo su scala vasta.
> **fondativo** — Genera un ordine, una civiltà, un pantheon o un piano.
> **transizionale** — Segna un passaggio tra stati dell'essere, condizioni metafisiche o ordini narrativi.

> [!info]- ℹ️ Guida — Evento
> **Cos'è** · Un fatto realmente accaduto nel mondo, nodo della timeline causale (a differenza del mito, che è racconto).
> **Campi chiave** · **Tipo** + **Quando** (data del mondo); **Causato da** / **Conseguenze** per agganciare la catena causale che muove la cronologia.
> **Spunti** · Cosa è successo, e perché conta ancora oggi? Chi ne è uscito vincitore, e chi distrutto? Quale ferita, o quale leggenda, ha lasciato?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!abstract] Cronologia
> Quando: `INPUT[text(placeholder(es. anno 312 o un’epoca del mondo)):quando]`
>
> Portata: `INPUT[portata][:portata]`

> [!abstract]- Calendario
> Data: `INPUT[text:fc-date]` — nel formato del calendario attivo (Gregorian: AAAA-MM-GG).
>
> Calendario: `INPUT[text:fc-calendar]` · Categoria: `INPUT[text:fc-category]`
>
> Compila *Data* per far comparire l'evento sul calendario. Lascia vuoti calendario/categoria per il calendario di default.
>
> Manca il calendario del mondo (mesi/ere)? `BUTTON[apri-calendario]` — crealo o aprilo in un clic; poi i datati vi compaiono soli.

> [!note]- Descrizione
> Cosa accade, chi coinvolge e perche' conta al tavolo.

> [!quote]- Versione player-safe
> `INPUT[text(placeholder(cosa possono sapere i giocatori)):player_safe]`

%%prosa%%
## Cause
> [!question]- 💡 Cause: perché è successo

## Cosa accade
> [!question]- 💡 Cosa accade

## Conseguenza
> [!question]- 💡 Conseguenza per il presente

## Eredità
> [!question]- 💡 Cosa ne resta oggi (ganci vivi)

%%/prosa%%

--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "evento", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderProfilo");
```

> [!tip] Profilo
> Assegna i tag coerenti derivati dagli assi: `BUTTON[applica-profilo]`

> [!abstract] Carattere
> **Risonanza** `INPUT[slider(minValue(1), maxValue(5), addLabels):risonanza]` → `VIEW[{risonanza} == 5 ? "5 · Fondante" : ({risonanza} == 4 ? "4 · Spartiacque" : ({risonanza} == 3 ? "3 · Storico" : ({risonanza} == 2 ? "2 · Eco locale" : ({risonanza} == 1 ? "1 · Dimenticato" : ("—")))))]`
> **Controversia** `INPUT[slider(minValue(1), maxValue(5), addLabels):controversia]` → `VIEW[{controversia} == 5 ? "5 · Mistero" : ({controversia} == 4 ? "4 · Conteso" : ({controversia} == 3 ? "3 · Due versioni" : ({controversia} == 2 ? "2 · Lievi discordie" : ({controversia} == 1 ? "1 · Cronaca certa" : ("—")))))]`
> **Reversibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):reversibilita]` → `VIEW[{reversibilita} == 5 ? "5 · Irreversibile" : ({reversibilita} == 4 ? "4 · Quasi irreversibile" : ({reversibilita} == 3 ? "3 · Cicatrice" : ({reversibilita} == 2 ? "2 · Difficile" : ({reversibilita} == 1 ? "1 · Sanabile" : ("—")))))]`

> [!note]- Risonanza — Quanto l'evento pesa ancora sul presente.
> **1 · Dimenticato** — Nessuno lo ricorda; non lascia traccia nel mondo di oggi.
> **2 · Eco locale** — Ricordato solo dove accadde, da chi c'era.
> **3 · Storico** — Sta nelle cronache; informa scelte e rivalità presenti.
> **4 · Spartiacque** — Divide un prima e un dopo; ridefinì equilibri.
> **5 · Fondante** — Regge ancora l'ordine del mondo; tutto vi discende.

> [!note]- Controversia — Quanto la versione dei fatti è condivisa o contesa.
> **1 · Cronaca certa** — I fatti sono accertati e concordi.
> **2 · Lievi discordie** — Dettagli in disputa, sostanza condivisa.
> **3 · Due versioni** — Vincitori e vinti lo raccontano in modo opposto.
> **4 · Conteso** — La verità è arma politica; le fonti si contraddicono.
> **5 · Mistero** — Cosa accadde davvero è perduto o nascosto.

> [!note]- Reversibilità — Quanto le sue conseguenze si possono ancora sanare.
> **1 · Sanabile** — Tutto può tornare com'era.
> **2 · Difficile** — Rimediabile a caro prezzo.
> **3 · Cicatrice** — Resta un segno, ma si convive.
> **4 · Quasi irreversibile** — Solo un prodigio potrebbe annullarlo.
> **5 · Irreversibile** — Ha cambiato il mondo per sempre.

--- ⛓ Catena causale

> [!info] Causa → conseguenza
> Cosa ha portato a questo evento e cosa ne è scaturito. Collega gli eventi con
> **Causato da** / **Conseguenze** (tab *Collegamenti*): la catena si ricostruisce
> nelle due direzioni.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCausalita");
```
--- 🕰 Cronologia mondo

```dataview
table without id file.link as Evento, quando as Quando, mondo as Mondo
from ""
where categoria = "evento"
sort quando asc
```

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Causato da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):causato_da]`
> **Conseguenze**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):conseguenze]`
> **Epoca**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoca]`
> **Luogo**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Coinvolti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):coinvolti]`
> **Fazioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni]`
> **Miti generati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):miti]`
> **Divinità coinvolte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Culti coinvolti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`
> **Profezie collegate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Profezie"), useLinks(partial), allowOther):profezie]`
> **Calamità innescata**: `INPUT[inlineListSuggester(optionQuery("Mondi/Calamita"), useLinks(partial), allowOther):calamita_innescata]`
> **Giocato nelle scene**: `INPUT[inlineListSuggester(optionQuery("Mondi/Scene"), useLinks(partial), allowOther):scene]`
> **Eserciti in campo**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eserciti"), useLinks(partial), allowOther):eserciti]`
> **Regni coinvolti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regni]`

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
