<% await tp.user.crea_risorsa(tp) %>
# `=this.nome`

> [!infobox|risorsa] 📦 Risorsa
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Fonte** | `VIEW[{fonte} ?? "—"]` |
> | **Scarsità** | `VIEW[{scarsita} ?? "—"]` |
> | **Usi** | `VIEW[{usi} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(vitale), option(bellica), option(arcana), option(voluttuaria), option(simbolica)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **vitale** — Necessaria alla sopravvivenza: cibo, acqua, sale, legname — chi la perde muore o si piega.
> **bellica** — Alimenta la guerra: metalli, cavalli, salnitro, acciaio — chi la controlla detta i conflitti.
> **arcana** — Carburante della magia: reagenti, reliquie, cristalli — rara, instabile, sempre contesa.
> **voluttuaria** — Lusso e status: spezie, gemme, sete — muove ricchezza e desiderio, non necessità.
> **simbolica** — Valore culturale/sacro oltre l'uso: ostie, insegne, materiali rituali — il prezzo è identità.

````tabs
--- 📖 Lore

> [!abstract] Scheda
> Fonte: `INPUT[text:fonte]`
> Scarsità: `INPUT[scarsita][:scarsita]`
> Usi: `INPUT[text:usi]`

> [!note] Produzione
> `INPUT[textArea:produzione]`

> [!note] Ruolo economico
> `INPUT[textArea:ruolo_economico]`

> [!note] Tensione
> `INPUT[textArea:tensione]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


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
--- 🔗 Collegamenti

> [!example] Relazioni
> **Controllata da**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`

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
