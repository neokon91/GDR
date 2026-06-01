<% await tp.user.crea_dominio(tp) %>
# `=this.nome`

> [!infobox] 🌐 Dominio
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(ordine), option(caos), option(vita), option(morte), option(natura), option(conoscenza), option(energia), option(fato)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **ordine** — La sfera della struttura, della legge e della stabilità.
> **caos** — La sfera del mutamento, dell'imprevedibile e della distruzione.
> **vita** — La sfera della crescita, della nascita e della fertilità.
> **morte** — La sfera della fine, del trapasso e dell'oltretomba.
> **natura** — La sfera del mondo vivente, degli elementi e dei cicli naturali.
> **conoscenza** — La sfera del sapere, della mente e della verità.
> **energia** — La sfera del potere grezzo, della magia e delle forze primarie.
> **fato** — La sfera del destino, del tempo e degli eventi predeterminati.

````tabs
--- Lore


> [!note] Natura
> `INPUT[textArea:natura]`

> [!note] Dinamica
> `INPUT[textArea:dinamica]`

> [!note] Tensione
> `INPUT[textArea:tensione]`

> [!note] Manifestazioni
> `INPUT[textArea:manifestazioni]`


--- Al tavolo

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

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Scatena
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
--- Collegamenti

> [!example] Relazioni
> **Leggi fondamentali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Magie del dominio**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Entità collegate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):entita]`
> **Piani collegati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Divinità affini**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`

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
--- Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
