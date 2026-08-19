<% await tp.user.crea_culto(tp) %>
# `=this.nome`

> [!infobox|culto] 🕯️ Culto
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Luogo sacro** | `VIEW[{luogo_sacro}][link]` |
> | **Portata** | `INPUT[portata][:portata]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(religione), option(ordine monastico), option(setta), option(culto misterico), option(fede popolare)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Culto
> **Cos'è** · Una religione organizzata (dottrina, clero, riti, fedeli) — distinta dalla divinità che venera e dalla fazione politica.
> **Campi chiave** · **Tipo** (setta, misterico, popolare…); **Divinità** venerate; **Portata** (diffusione); sul Carattere **Legalità** ne fissa il rapporto col potere.
> **Spunti** · Cosa promette ai fedeli, e cosa pretende in cambio? C'è un'eresia o uno scisma che lo minaccia dall'interno? Qual è la verità che solo gli iniziati conoscono?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Dottrina
> [!question]- 💡 Dottrina: cosa insegna, cosa promette

## Riti
> [!question]- 💡 Riti e pratiche: come si onora il sacro

## Gerarchia
> [!question]- 💡 Clero e gerarchia: chi comanda, come si entra

## Tabù
> [!question]- 💡 Tabù e peccati: cosa è proibito

## Nel presente
> [!question]- 💡 Stato attuale: diffusione, alleati, nemici

> [!rivela|segreto]- Segreto
> 💡 *Il segreto del culto (eresia, verità occulta)*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Divinità venerate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luogo sacro**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_sacro]`
> **Figure di spicco**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):capi]`
> **Braccio politico**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`
> **Culti rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):rivali]`
> **Profezie custodite**: `INPUT[inlineListSuggester(optionQuery("Mondi/Profezie"), useLinks(partial), allowOther):profezie]`
> **Miti tramandati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):miti]`
> **Popoli devoti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`
> **Reliquie / paramenti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):reliquie]`
> **Gradi d'iniziazione**: `INPUT[inlineListSuggester(optionQuery("Mondi/Alberi"), useLinks(partial), allowOther):alberi]`
> **Primordiale venerata**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):entita_primordiale]`
> **Leggi sacre / interdetti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Editti"), useLinks(partial), allowOther):editti]`
> **Stato che lo sancisce**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`

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
