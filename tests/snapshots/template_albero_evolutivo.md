<% await tp.user.crea_albero_evolutivo(tp) %>
# `=this.nome`

> [!infobox|albero_evolutivo] Albero evolutivo
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Portata** | `VIEW[{portata} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- 📖 Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`

> [!note] Origine
> `INPUT[textArea:origine]`

> [!note] Accesso e avanzamento
> `INPUT[textArea:accesso]`


--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderClock");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderPressioni");
```

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Avanza / scatena
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
--- 🌳 Albero

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderAlbero");
```
--- 🔗 Collegamenti

> [!example] Relazioni
> **Tradizione magica**: `INPUT[suggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistema_magico]`
> **Specie**: `INPUT[suggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):specie]`
> **Culto / ordine**: `INPUT[suggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culto]`
> **Esempi viventi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
