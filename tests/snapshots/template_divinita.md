<% await tp.user.crea_divinita(tp) %>
# `=this.nome`

> [!infobox|divinita] ☀️ Divinità
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Piano di dimora** | `VIEW[{piano}][link]` |
> | **Allineamento** | `INPUT[allineamento][:allineamento]` |
> | **Simbolo** | `INPUT[text(placeholder(es. un sole infranto su campo nero)):simbolo]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(divinità maggiore), option(divinità minore), option(semidio), option(pantheon)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(primordiale), option(archetipica), option(elementale), option(culturale), option(mitica), option(spirituale), option(onirica)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **primordiale** — Preesistente alla creazione dei piani e delle leggi strutturate.
> **archetipica** — Incarna forze universali o concetti eterni.
> **elementale** — Collegata a uno degli elementi fondamentali o ai loro derivati.
> **culturale** — Creata, immaginata o evocata dai mortali.
> **mitica** — Figura simbolica o alchemica, nata dalla convergenza cosmica.
> **spirituale** — Legata al ciclo dell'anima, alla morte, alla purificazione o al karma.
> **onirica** — Nata dall'inconscio collettivo, dai sogni cosmici o da archetipi inconsci.

> [!info]- ℹ️ Guida — Divinità
> **Cos'è** · L'entità venerata — un attore cosmico che, via culti e profezie, può premere sul tavolo come Fronte.
> **Campi chiave** · **Rango** (maggiore/minore/semidio); **Famiglia** (→ preimposta gli assi cosmici); **Domini cosmici** e **Allineamento** per la sua identità.
> **Spunti** · Di cosa è dio/dea — e cosa chiede ai suoi fedeli? Come si manifesta nel mondo? (miracoli, segni, silenzi) Chi la odia, e perché?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Dogmi
> [!question]- 💡 Dogmi e aspettative

## Culto
> [!question]- 💡 Culto: fedeli, riti, templi

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Domini cosmici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):domini]`
> **Origine primordiale**: `INPUT[suggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):origine]`
> **Culti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`
> **Piano di dimora**: `INPUT[suggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piano]`
> **Divinità opposte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):rivali]`
> **Miti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):miti]`
> **Divinità alleate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):alleati]`
> **Leggi incarnate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Sistemi magici alimentati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Specie create**: `INPUT[inlineListSuggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):creo_specie]`
> **Epoche di dominio**: `INPUT[inlineListSuggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoche]`
> **Avatar / Prescelti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):avatar]`

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
