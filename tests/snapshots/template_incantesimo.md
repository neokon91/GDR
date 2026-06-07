<% await tp.user.crea_incantesimo(tp) %>
# `=this.nome`

> [!infobox|incantesimo] ✨ Incantesimo
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Livello** | `VIEW[{livello} ?? "—"]` |
> | **Tempo di lancio** | `VIEW[{tempo_lancio} ?? "—"]` |
> | **Gittata** | `VIEW[{gittata} ?? "—"]` |
> | **Componenti** | `VIEW[{componenti} ?? "—"]` |
> | **Durata** | `VIEW[{durata} ?? "—"]` |
> | **Rituale** | `VIEW[{rituale} ?? "—"]` |
> | **Classi** | `VIEW[{classi} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(abiurazione), option(ammaliamento), option(divinazione), option(evocazione), option(illusione), option(invocazione), option(necromanzia), option(trasmutazione)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Incantesimo
> **Cos'è** · Un incantesimo che i giocatori possono memorizzare e lanciare, reso nella scheda PG con slot e link.
> **Campi chiave** · **Livello** (0 = trucchetto) + **Classi che lo lanciano** per renderlo selezionabile; **Tempo di lancio**/**Durata** (concentrazione) governano l'uso in combattimento.


````tabs
--- ⚙ Meccanica

> [!abstract] Scheda
> Livello: `INPUT[number:livello]`
> Tempo di lancio: `INPUT[text(placeholder(es. 1 azione oppure 1 reazione)):tempo_lancio]`
> Gittata: `INPUT[text(placeholder(es. 9 m oppure contatto)):gittata]`
> Componenti: `INPUT[text(placeholder(es. V S M con un pizzico di zolfo)):componenti]`
> Durata: `INPUT[text(placeholder(es. Istantanea oppure Concentrazione fino a 1 minuto)):durata]`
> Rituale: `INPUT[text:rituale]`
> Classi: `INPUT[classi][:classi]`

--- ✨ Effetto

> [!note] Effetto
> `INPUT[textArea:effetto]`

> [!note] Ai livelli superiori
> `INPUT[textArea:a_livello_superiore]`


--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Sistema magico**: `INPUT[suggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistema_magico]`

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
