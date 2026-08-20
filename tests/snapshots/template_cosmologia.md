<% await tp.user.crea_cosmologia(tp) %>
# `=this.nome`

> [!infobox|cosmologia] 🌌 Cosmologia
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(quadro cosmico), option(concetto cosmico), option(mistero cosmico)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(origine), option(struttura), option(forze), option(destino), option(mistero)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **origine** — Come e da cosa nasce la realtà: principi e atti primigeni.
> **struttura** — Come è ordinato il cosmo: piani, leggi, gerarchie dell'essere.
> **forze** — Le energie e i poteri che muovono e reggono il mondo.
> **destino** — Dove tende la realtà: cicli, fine, rinascita, scopo ultimo.
> **mistero** — Ciò che resta ignoto o inconoscibile: enigmi e verità nascoste.

> [!info]- ℹ️ Guida — Cosmologia
> **Cos'è** · La cosmologia è il quadro d'insieme di come funziona la realtà del mondo: lega in un nodo origini, leggi, piani, forze primordiali e magie.
> **Campi chiave** · **Tipo** e **famiglia** (origine, struttura, forze, destino, mistero) inquadrano la questione; le relazioni la collegano a Leggi, Piani e Primordiali che la incarnano.
> **Spunti** · Qual è il principio primo da cui tutto discende — e cosa c'era prima? Verso dove tende il cosmo: ciclo eterno, fine annunciata, rinascita? Cosa di questo quadro è ignoto persino ai sapienti?

````tabs
--- 📖 Lore


> [!note]- Natura cosmica
> Cos'è questo principio, dove sta nella struttura del mondo, come lo percepiscono i mortali.

> [!quote]- Versione player-safe
> `INPUT[text(placeholder(cosa possono sapere i giocatori)):player_safe]`

%%prosa%%
## Natura
> [!question]- 💡 Cos'e' / come si manifesta

## Principio
> [!question]- 💡 Cosa governa o definisce (il principio attivo)

## Influenza
> [!question]- 💡 Come tocca il mondo mortale (magia, destino, vita)

## Manifestazioni
> [!question]- 💡 Come si vede nel mondo (segni, fenomeni, presagi)

## Abitanti
> [!question]- 💡 Chi o cosa la abita/incarna (per piani e forze)

## Accesso
> [!question]- 💡 Come ci si arriva o vi si attinge (per piani, riti, soglie)

> [!rivela|segreto]- Segreto
> 💡 *Verita' nascosta*
>

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Domini**: `INPUT[inlineListSuggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):domini]`
> **Leggi fondamentali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Entità primordiali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):primordiali]`
> **Piani d'esistenza**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Sistemi magici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Luoghi che la manifestano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`

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
