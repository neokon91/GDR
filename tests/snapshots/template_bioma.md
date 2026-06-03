<% await tp.user.crea_bioma(tp) %>
# `=this.nome`

> [!infobox|bioma] 🌲 Bioma
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Clima** | `VIEW[{clima} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- 📖 Lore

> [!abstract] Scheda
> Clima: `INPUT[clima][:clima]`

> [!note] Geografia
> `INPUT[textArea:geografia]`

> [!note] Flora e fauna
> `INPUT[textArea:flora_fauna]`

> [!note] Fenomeni
> `INPUT[textArea:fenomeni]`

> [!note] Risorse
> `INPUT[textArea:risorse]`

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
--- 📊 Carattere

> [!abstract] Carattere
> **Ostilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):ostilita]` → `VIEW[{ostilita} == 5 ? "5 · Letale" : ({ostilita} == 4 ? "4 · Ostile" : ({ostilita} == 3 ? "3 · Aspro" : ({ostilita} == 2 ? "2 · Mite" : ({ostilita} == 1 ? "1 · Ospitale" : ("—")))))]`
> **Fertilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):fertilita]` → `VIEW[{fertilita} == 5 ? "5 · Lussureggiante" : ({fertilita} == 4 ? "4 · Rigoglioso" : ({fertilita} == 3 ? "3 · Modesto" : ({fertilita} == 2 ? "2 · Magro" : ({fertilita} == 1 ? "1 · Sterile" : ("—")))))]`
> **Magia Ambientale** `INPUT[slider(minValue(1), maxValue(5), addLabels):magia_ambientale]` → `VIEW[{magia_ambientale} == 5 ? "5 · Saturo" : ({magia_ambientale} == 4 ? "4 · Carico" : ({magia_ambientale} == 3 ? "3 · Intriso" : ({magia_ambientale} == 2 ? "2 · Toccato" : ({magia_ambientale} == 1 ? "1 · Mondano" : ("—")))))]`
> **Accessibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):accessibilita]` → `VIEW[{accessibilita} == 5 ? "5 · Inaccessibile" : ({accessibilita} == 4 ? "4 · Remoto" : ({accessibilita} == 3 ? "3 · Impervio" : ({accessibilita} == 2 ? "2 · Praticabile" : ({accessibilita} == 1 ? "1 · Aperto" : ("—")))))]`

> [!note]- Ostilità — Quanto il bioma è pericoloso per chi lo attraversa.
> **1 · Ospitale** — Sicuro e accogliente; sopravvivere è facile.
> **2 · Mite** — Pochi pericoli, gestibili con prudenza.
> **3 · Aspro** — Duro; richiede preparazione e rispetto.
> **4 · Ostile** — Insidie costanti; il bioma vuole respingerti.
> **5 · Letale** — Mortale; sopravvivere è un'impresa rara.

> [!note]- Fertilità — Quanta vita e risorse il bioma sostiene.
> **1 · Sterile** — Quasi morto; nulla cresce, nulla resta.
> **2 · Magro** — Vita scarsa e tenace; risorse rare.
> **3 · Modesto** — Sostiene una vita stabile ma non abbondante.
> **4 · Rigoglioso** — Vita ricca; risorse e specie in quantità.
> **5 · Lussureggiante** — Esplosione di vita; sovrabbondante e vorace.

> [!note]- Magia Ambientale — Quanto la magia permea il bioma.
> **1 · Mondano** — Nessuna magia; natura ordinaria.
> **2 · Toccato** — Tracce o residui magici occasionali.
> **3 · Intriso** — La magia è percepibile; fenomeni regolari.
> **4 · Carico** — La magia plasma flora, fauna e clima.
> **5 · Saturo** — Realtà alterata; la magia detta le regole.

> [!note]- Accessibilità — Quanto è facile raggiungere e percorrere il bioma.
> **1 · Aperto** — Facile da attraversare; rotte e accessi noti.
> **2 · Praticabile** — Percorribile con guida o sentieri.
> **3 · Impervio** — Difficile; ostacoli naturali continui.
> **4 · Remoto** — Isolato; pochi sanno come arrivarci.
> **5 · Inaccessibile** — Quasi irraggiungibile; barriere estreme o magiche.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "bioma", component);
```

--- 🔗 Collegamenti

> [!example] Relazioni
> **Luoghi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`
> **Specie tipiche**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):specie]`

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
