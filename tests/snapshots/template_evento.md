<% await tp.user.crea_evento(tp) %>
# `=this.nome`

> [!infobox|evento] 📜 Evento
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Portata** | `VIEW[{portata} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(cosmico), option(epocale), option(mitico), option(sacrale), option(catastrofico), option(fondativo), option(transizionale)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **cosmico** — Coinvolge l'equilibrio dell'universo: nascita o morte di leggi fondamentali, piani o entità primordiali.
> **epocale** — Marca un prima e un dopo nella linea storica, aprendo o chiudendo un'epoca.
> **mitico** — Evento archetipico tramandato in forma simbolica o leggendaria.
> **sacrale** — Implica un contatto diretto col divino o una trasformazione spirituale profonda.
> **catastrofico** — Evento distruttivo su scala vasta.
> **fondativo** — Genera un ordine, una civiltà, un pantheon o un piano.
> **transizionale** — Segna un passaggio tra stati dell'essere, condizioni metafisiche o ordini narrativi.

````tabs
--- 📖 Lore

> [!abstract] Cronologia
> Quando: `INPUT[text:quando]`
>
> Portata: `INPUT[portata][:portata]`

> [!abstract]- Calendario
> Data: `INPUT[text:fc-date]` — nel formato del calendario attivo (Gregorian: AAAA-MM-GG).
>
> Calendario: `INPUT[text:fc-calendar]` · Categoria: `INPUT[text:fc-category]`
>
> Compila *Data* per far comparire l'evento sul calendario. Lascia vuoti calendario/categoria per il calendario di default.

> [!note]- Descrizione
> Cosa accade, chi coinvolge e perche' conta al tavolo.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Cause
> `INPUT[textArea:cause]`

> [!note] Cosa accade
> `INPUT[textArea:cosa]`

> [!note] Conseguenza
> `INPUT[textArea:conseguenza]`

> [!note] Eredità
> `INPUT[textArea:eredita]`


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
