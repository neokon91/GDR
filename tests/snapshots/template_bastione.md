<% await tp.user.crea_bastione(tp) %>
# `=this.nome`

> [!infobox|bastione] 🏰 Bastione
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Livello** | `VIEW[{livello} ?? "—"]` |
> | **Difensori** | `VIEW[{difensori} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(torre), option(fortezza), option(santuario), option(rifugio), option(laboratorio), option(avamposto), option(tenuta)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

````tabs
--- 📋 Scheda

> [!abstract] Scheda
> Livello: `INPUT[number:livello]`
> Difensori: `INPUT[number:difensori]`

--- 📖 Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Descrizione
> `INPUT[textArea:descrizione]`

> [!note] Strutture
> `INPUT[textArea:strutture]`


> [!quote]- 🏰 Ordini di bastione 2024 (quick-ref)
> Ogni **struttura speciale** emette un ordine al **turno di bastione** (ogni 7 giorni):
>
> **Fabbricare** *(Craft)* — produce un oggetto (equipaggiamento, pozione, oggetto magico…).
>
> **Commerciare** *(Trade)* — compra o vende beni per oro.
>
> **Reclutare** *(Recruit)* — aggiunge difensori al bastione.
>
> **Raccogliere** *(Harvest)* — raccoglie risorse o materiali.
>
> **Ricercare** *(Research)* — ottiene informazioni o appunti.
>
> **Potenziare** *(Empower)* — dà un beneficio magico temporaneo a chi parte all'avventura.
>
> **Mantenere** *(Maintain)* — la struttura rende oro / si autosostiene.

> [!example] Strutture & ordini del turno
> Una riga per struttura: **`Struttura | Ordine | esito`**. L'esito può contenere dadi — `1d6`, `1d4×10`, `2d6+1` — che il **turno** tira per te.
>
> `INPUT[list:ordini]`
>
> *Esempi:* `Fucina | Fabbricare | 1d6 lingotti` · `Mercato | Commerciare | 1d4×10 mo` · `Caserma | Reclutare | 1d4 difensori` · `Biblioteca | Ricercare | un appunto sul nemico`

> [!tip] Turno di bastione
> Risolvi il turno (7 giorni): tira gli esiti delle strutture qui sopra, li numera e li data nel *Registro dei turni*. `BUTTON[turno-bastione]`
> *(Senza strutture in `ordini`, chiede un riepilogo libero.)*
--- 🔗 Collegamenti

> [!example] Relazioni
> **Proprietario**: `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`
> **Posizione**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

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
