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
````

> [!tip] ＋ Componenti
> Aggiungi ciò che ti serve, quando ti serve — **Al tavolo**, **Clock del fronte**, **Carattere**, **Cronologia**, **Vista**…
> `BUTTON[aggiungi-componente]`
>
> `BUTTON[marca-canonico]` · `BUTTON[archivia-nota]`
