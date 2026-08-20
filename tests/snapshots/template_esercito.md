<% await tp.user.crea_esercito(tp) %>
# `=this.nome`

> [!infobox|esercito] 🪖 Esercito
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Stato / regno** | `VIEW[{regno}][link]` |
> | **Comandante** | `VIEW[{comandante}][link]` |
> | **Consistenza** | `INPUT[consistenza][:consistenza]` |
> | **Morale** | `INPUT[morale][:morale]` |
> | **Composizione** | `INPUT[text:composizione]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(esercito regolare), option(milizia), option(mercenari), option(orda), option(flotta), option(guardia)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Esercito
> **Cos'è** · Un esercito è una forza armata organizzata: il braccio bellico di un regno o di una fazione, che può marciare come Fronte verso una battaglia o una conquista.
> **Campi chiave** · **Tipo** (forma: regolare, mercenari, flotta…) e **Comandante**; **Consistenza** e **Morale** dicono quanto è grosso e quanto regge; con un **clock** marcia verso il suo obiettivo.
> **Spunti** · Cosa vuole conquistare, e cosa è disposto a bruciare? Qual è la sua debolezza, o la crepa nelle file? Quanto è leale — e cosa lo farebbe disertare?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Composizione
> [!question]- 💡 Composizione: fanteria, cavalleria, arcieri, bestie, macchine

## Tattica
> [!question]- 💡 Tattica e punti di forza / debolezza

## Obiettivo
> [!question]- 💡 Obiettivo: cosa marcia a fare (la posta del clock)

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Stato / regno**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`
> **Comandante**: `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):comandante]`
> **Fazione**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`
> **Schierato in**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):schierato_in]`
> **Nemici in campo**: `INPUT[inlineListSuggester(optionQuery("Mondi/Eserciti"), useLinks(partial), allowOther):nemici]`

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
