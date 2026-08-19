<% await tp.user.crea_piano(tp) %>
# `=this.nome`

> [!infobox|piano] 🌀 Piano d'esistenza
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Accessibilità** | `INPUT[accessibilita][:accessibilita]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(piano elementale), option(piano spirituale), option(piano onirico), option(piano astrale), option(semipiano), option(aldilà)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Piano d'esistenza
> **Cos'è** · Un piano è un livello di realtà a sé — elementale, astrale, onirico, un aldilà — con leggi, abitanti e accessi propri, distinto da un luogo materiale.
> **Campi chiave** · **Tipo** di piano + **Accessibilità** (come vi si entra); poi le relazioni a **Leggi** che lo governano e **Dominio**.
> **Spunti** · Che sostanza e che leggi fisiche ha — e cosa vi uccide un mortale? Come si entra e si esce: soglia, rito, morte, sogno? Come si fa sentire la sua presenza nel mondo materiale?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Natura
> [!question]- 💡 Natura: cos'è, che aspetto e sostanza ha

## Funzione cosmica
> [!question]- 💡 Funzione cosmica: che ruolo svolge nel multiverso

## Caratteristiche
> [!question]- 💡 Caratteristiche: leggi fisiche, ambiente, pericoli

## Accesso
> [!question]- 💡 Accesso: come si entra e si esce (soglie, riti, condizioni)

## Influenza
> [!question]- 💡 Influenza: come tocca il mondo materiale

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Leggi che lo governano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Dominio cosmico**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Abitanti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):abitanti]`
> **Soglie / accessi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):soglie]`
> **Divinità che vi dimorano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Sistemi magici di risonanza**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Piani adiacenti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani_adiacenti]`
> **Primordiali che vi giacciono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):primordiali]`

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
````

> [!tip] ＋ Componenti
> Aggiungi ciò che ti serve, quando ti serve — **Al tavolo**, **Clock del fronte**, **Carattere**, **Cronologia**, **Vista**…
> `BUTTON[aggiungi-componente]`
>
> `BUTTON[marca-canonico]` · `BUTTON[archivia-nota]`
