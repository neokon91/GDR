<% await tp.user.crea_insidia(tp) %>
# `=this.nome`

> [!infobox|insidia] ⚠️ Insidia
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Livello di gioco** | `VIEW[{tier} ?? "—"]` |
> | **Minaccia** | `VIEW[{minaccia} ?? "—"]` |
> | **Prova** | `VIEW[{prova} ?? "—"]` |
> | **Danno / Effetto** | `VIEW[{danno} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(trappola), option(pericolo naturale), option(effetto ambientale)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(meccanica), option(magica), option(naturale), option(biologica), option(ambientale)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Insidia
> **Cos'è** · Una trappola o pericolo ambientale pronto da piazzare in una scena, con prova per individuarlo e danno/effetto.
> **Campi chiave** · **Livello di gioco** + **Prova** (CD per individuare/disinnescare) + **Danno/Effetto**; **Innesco** e **Contromisure** dicono come scatta e come scamparla.


> [!note]- Cosa significa ogni famiglia
> **meccanica** — Trappola fisica: lame, fosse, pressione, congegni.
> **magica** — Trappola arcana: glifi, maledizioni, effetti incantati.
> **naturale** — Pericolo dell'ambiente: frane, gas, gelo, correnti.
> **biologica** — Minaccia vivente: spore, veleni, parassiti, malattie.
> **ambientale** — Condizione persistente dell'area: oscurità, terreno, clima.

````tabs
--- ⚠ Insidia

> [!abstract] Scheda
> Livello di gioco: `INPUT[tier][:tier]`
> Minaccia: `INPUT[minaccia][:minaccia]`
> Prova: `INPUT[text(placeholder(es. Destrezza CD 15)):prova]`
> Danno / Effetto: `INPUT[text(placeholder(es. 2d6 da fuoco · TS Destrezza dimezza)):danno]`

--- 🎬 Scena

## Innesco
> [!question]- 💡 Innesco: cosa la attiva

## Effetto
> [!question]- 💡 Effetto: cosa succede (TxC/CD + danno)

## Contromisure
> [!question]- 💡 Contromisure: individuare / disinnescare


> [!tip]- Tiri
> `dice: 1d20`

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Luoghi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Creature collegate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):creature]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

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
````
