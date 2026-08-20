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

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Legge incarnata**: `INPUT[suggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):legge]`
> **Dominio**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Divinità discese**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luoghi (prigioni, santuari)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Sistemi magici che vi attingono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Stirpi generate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):stirpi]`
> **Ere primordiali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Epoche"), useLinks(partial), allowOther):epoche]`
> **Miti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Miti"), useLinks(partial), allowOther):miti]`
> **Piani di prigionia / dimora**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`

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
