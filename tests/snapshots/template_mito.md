<% await tp.user.crea_mito(tp) %>
# `=this.nome`

> [!infobox|mito] 📖 Mito
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(mito di origine), option(leggenda), option(diceria), option(dottrina), option(sogno profetico)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Mito
> **Cos'è** · Un racconto tramandato (vero, falso o distorto) che dà senso e mistero al mondo — distinto dall'evento, che è fatto.
> **Campi chiave** · **Tipo** (leggenda, diceria, dottrina…); sul Carattere **Veridicità** (quanto è vero) e **Vitalità** (quanto agisce ancora) ne fissano la presa al tavolo.
> **Spunti** · Chi lo racconta, e a chi conviene che ci si creda? C'è un nocciolo di verità sotto la leggenda? Cosa succede se qualcuno scopre che è falso — o che è vero?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Narrazione
> [!question]- 💡 La narrazione (il racconto come si tramanda)

## Nucleo simbolico
> [!question]- 💡 Nucleo simbolico: cosa significa davvero

## Interpretazioni
> [!question]- 💡 Interpretazioni: ortodossa, eretica, esoterica

## Nel presente
> [!question]- 💡 Funzione nel presente: riti, simboli, ganci vivi

> [!rivela|segreto]- Segreto
> 💡 *Cosa nasconde o distorce il mito (la verità vera)*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Epoca raccontata**: `INPUT[suggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoca_raccontata]`
> **Divinità coinvolte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luogo simbolico**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Culti che lo tramandano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`
> **Fatto storico sottostante**: `INPUT[suggester(optionQuery("Mondi/Eventi"), useLinks(partial), allowOther):evento_storico]`
> **Varianti e versioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):varianti]`
> **Figure del mito**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Profezie contenute**: `INPUT[inlineListSuggester(optionQuery("Mondi/Profezie"), useLinks(partial), allowOther):profezie]`
> **Primordiali del mito**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):primordiali]`

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
