<% await tp.user.crea_incantesimo(tp) %>
# `=this.nome`

> [!infobox|incantesimo] ✨ Incantesimo
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Livello** | `INPUT[number:livello]` |
> | **Tempo di lancio** | `INPUT[text(placeholder(es. 1 azione oppure 1 reazione)):tempo_lancio]` |
> | **Gittata** | `INPUT[text(placeholder(es. 9 m oppure contatto)):gittata]` |
> | **Componenti** | `INPUT[text(placeholder(es. V S M con un pizzico di zolfo)):componenti]` |
> | **Durata** | `INPUT[text(placeholder(es. Istantanea oppure Concentrazione fino a 1 minuto)):durata]` |
> | **Rituale** | `INPUT[toggle:rituale]` |
> | **Classi** | `INPUT[classi][:classi]` |
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
> **Spunti** · Cosa fa di memorabile che nessun'altra magia fa? Che prezzo o rischio esige da chi lo lancia? Chi lo teme, e chi ucciderebbe per averlo?

````tabs
--- ⚙ Meccanica


--- ✨ Effetto

%%prosa%%
## Effetto
> [!question]- 💡 Effetto dell'incantesimo

## Ai livelli superiori
> [!question]- 💡 Ai livelli superiori

%%/prosa%%

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Sistema magico**: `INPUT[suggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistema_magico]`
> **Dominio**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`

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
