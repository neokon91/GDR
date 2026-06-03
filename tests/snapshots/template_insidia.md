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

> [!info] Famiglia: `INPUT[inlineSelect(option(meccanica), option(magica), option(naturale), option(biologica), option(ambientale)):famiglia]`

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
> Prova: `INPUT[text:prova]`
> Danno / Effetto: `INPUT[text:danno]`

--- 🎬 Scena

> [!note] Innesco
> `INPUT[textArea:innesco]`

> [!note] Effetto
> `INPUT[textArea:effetto]`

> [!note] Contromisure
> `INPUT[textArea:contromisure]`


> [!tip]- Tiri
> `dice: 1d20`

--- 🔗 Collegamenti

> [!example] Relazioni
> **Luoghi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Creature collegate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):creature]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
