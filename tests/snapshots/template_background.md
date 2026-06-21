<% await tp.user.crea_background(tp) %>
# `=this.nome`

> [!infobox|background] 📖 Background
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Caratteristiche** | `INPUT[text(placeholder(es. Forza oppure Costituzione)):car_background]` |
> | **Competenze in abilità** | `INPUT[text:abilita_background]` |
> | **Competenza in strumenti** | `INPUT[text(placeholder(es. Strumenti da fabbro)):strumento]` |
> | **Talento d'origine** | `INPUT[text(placeholder(es. Fortunato)):talento_origine]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(background)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Background
> **Cos'è** · Il background che, nel 2024, dà al PG le competenze d'origine e il primo talento — scegliendolo in creazione il motore lo applica.
> **Campi chiave** · Tutti obbligatori per essere 2024-legale: **Caratteristiche** (3), **Abilità** (2), **Talento d'origine** (1) e **Strumento** (1).
> **Spunti** · Chi era prima dell'avventura — e cosa l'ha strappato a quella vita? Cosa si è lasciato alle spalle, e chi non l'ha perdonato? Quale ferita o promessa porta ancora con sé?

````tabs
--- 📋 Scheda


--- 📖 Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

%%prosa%%
## Descrizione
> [!question]- 💡 Chi era prima dell'avventura

## Equipaggiamento
> [!question]- 💡 Equipaggiamento iniziale

%%/prosa%%

--- 🔗 Collegamenti

> [!example]- 🎭 Chi viene da qui
> I personaggi del vault che hanno scelto questa nota (si popola creando un PG/PNG che la sceglie):
```dataview
list
from ""
where categoria = "personaggio" and lower(string(background)) = lower(this.file.name)
sort tipo asc, file.name asc
```
> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Cultura d'origine**: `INPUT[suggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):cultura]`
> **Regno / patria**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`
> **Fazione / gilda**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`
> **Luogo d'origine**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_origine]`
> **Lingua appresa**: `INPUT[inlineListSuggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):lingua]`

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
