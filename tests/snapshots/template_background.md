<% await tp.user.crea_background(tp) %>
# `=this.nome`

> [!infobox|background] 📖 Background
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Caratteristiche** | `VIEW[{car_background} ?? "—"]` |
> | **Competenze in abilità** | `VIEW[{abilita_background} ?? "—"]` |
> | **Competenza in strumenti** | `VIEW[{strumento} ?? "—"]` |
> | **Talento d'origine** | `VIEW[{talento_origine} ?? "—"]` |
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


````tabs
--- 📋 Scheda

> [!abstract] Scheda
> Caratteristiche: `INPUT[text:car_background]`
> Competenze in abilità: `INPUT[text:abilita_background]`
> Competenza in strumenti: `INPUT[text:strumento]`
> Talento d'origine: `INPUT[text:talento_origine]`

--- 📖 Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Descrizione
> `INPUT[textArea:descrizione]`

> [!note] Equipaggiamento
> `INPUT[textArea:equipaggiamento]`


--- 🔗 Collegamenti

> [!example]- 🎭 Chi viene da qui
> I personaggi del vault che hanno scelto questa nota (si popola creando un PG/PNG che la sceglie):
```dataview
list
from ""
where categoria = "personaggio" and lower(string(background)) = lower(this.file.name)
sort tipo asc, file.name asc
```

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

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
