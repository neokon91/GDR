<% await tp.user.crea_bastione(tp) %>
# `=this.nome`

> [!infobox] 🏰 Bastione
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Livello** | `VIEW[{livello} ?? "—"]` |
> | **Difensori** | `VIEW[{difensori} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Scheda

> [!abstract] Scheda
> Livello: `INPUT[number:livello]`
> Difensori: `INPUT[number:difensori]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Descrizione
> `INPUT[textArea:descrizione]`

> [!note] Strutture
> `INPUT[textArea:strutture]`

> [!note] Turno di bastione
> `INPUT[textArea:turno]`


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
> [!tip] Turno di bastione
> Registra un turno (7 giorni) nel *Registro dei turni*: `BUTTON[turno-bastione]`
--- Collegamenti

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
--- Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
