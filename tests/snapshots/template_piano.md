<% await tp.user.crea_piano(tp) %>
# `=this.nome`

> [!infobox] 🌀 Piano d'esistenza
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Accessibilità** | `VIEW[{accessibilita} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Lore

> [!abstract] Scheda
> Accessibilità: `INPUT[accessibilita][:accessibilita]`

> [!note] Natura
> `INPUT[textArea:natura]`

> [!note] Funzione cosmica
> `INPUT[textArea:funzione_cosmica]`

> [!note] Caratteristiche
> `INPUT[textArea:caratteristiche]`

> [!note] Accesso
> `INPUT[textArea:accesso]`

> [!note] Influenza
> `INPUT[textArea:influenza]`


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
--- Carattere

> [!abstract] Carattere
> **Materialità** `INPUT[slider(minValue(1), maxValue(5), addLabels):materialita]` → `VIEW[{materialita} == 5 ? "5 · Iperreale" : ({materialita} == 4 ? "4 · Solido" : ({materialita} == 3 ? "3 · Fluido" : ({materialita} == 2 ? "2 · Eterico" : ({materialita} == 1 ? "1 · Immateriale" : ("—")))))]`
> **Stabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita]` → `VIEW[{stabilita} == 5 ? "5 · Immutabile" : ({stabilita} == 4 ? "4 · Stabile" : ({stabilita} == 3 ? "3 · Ciclico" : ({stabilita} == 2 ? "2 · Mutevole" : ({stabilita} == 1 ? "1 · Caotico" : ("—")))))]`
> **Ospitalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):ospitalita]` → `VIEW[{ospitalita} == 5 ? "5 · Accogliente" : ({ospitalita} == 4 ? "4 · Vivibile" : ({ospitalita} == 3 ? "3 · Estraneo" : ({ospitalita} == 2 ? "2 · Ostile" : ({ospitalita} == 1 ? "1 · Letale" : ("—")))))]`
> **Risonanza** `INPUT[slider(minValue(1), maxValue(5), addLabels):risonanza]` → `VIEW[{risonanza} == 5 ? "5 · Traboccante" : ({risonanza} == 4 ? "4 · Risonante" : ({risonanza} == 3 ? "3 · Permeabile" : ({risonanza} == 2 ? "2 · Remoto" : ({risonanza} == 1 ? "1 · Sigillato" : ("—")))))]`
> **Inclinazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):inclinazione]` → `VIEW[{inclinazione} == 5 ? "5 · Maligno" : ({inclinazione} == 4 ? "4 · Sinistro" : ({inclinazione} == 3 ? "3 · Indifferente" : ({inclinazione} == 2 ? "2 · Sereno" : ({inclinazione} == 1 ? "1 · Luminoso" : ("—")))))]`

> [!note]- Materialità — Quanto il piano è sostanza tangibile o puro spirito.
> **1 · Immateriale** — Puro pensiero o energia, senza sostanza.
> **2 · Eterico** — Tenue, attraversabile, quasi-fisico.
> **3 · Fluido** — Sostanza mutevole, senza forma fissa.
> **4 · Solido** — Tangibile e percorribile come il mondo materiale.
> **5 · Iperreale** — Più denso e «vero» del reale; schiaccia i sensi.

> [!note]- Stabilità — Quanto le sue leggi sono costanti o mutevoli.
> **1 · Caotico** — Leggi fisiche instabili, in continuo mutamento.
> **2 · Mutevole** — Cambia con lentezza o a ondate.
> **3 · Ciclico** — Muta secondo cicli o stagioni cosmiche.
> **4 · Stabile** — Leggi costanti e affidabili.
> **5 · Immutabile** — Eterno e identico a sé stesso.

> [!note]- Ospitalità — Quanto un mortale può sopravvivervi.
> **1 · Letale** — Uccide chi vi entra senza protezione.
> **2 · Ostile** — Sopravvivibile a stento, a caro prezzo.
> **3 · Estraneo** — Vivibile ma profondamente alieno.
> **4 · Vivibile** — Un mortale può dimorarvi.
> **5 · Accogliente** — Prospero, persino paradisiaco.

> [!note]- Risonanza — Quanto il piano tocca e influenza il mondo materiale.
> **1 · Sigillato** — Isolato; non tocca il mondo.
> **2 · Remoto** — Influenza rara e debole.
> **3 · Permeabile** — Filtra nel mondo per soglie e riti.
> **4 · Risonante** — La sua impronta si sente nel mondo.
> **5 · Traboccante** — Dilaga nel reale; lo plasma e lo invade.

> [!note]- Inclinazione — La tinta morale del piano.
> **1 · Luminoso** — Benevolo, redentivo, votato al bene.
> **2 · Sereno** — Pacifico e neutro-positivo.
> **3 · Indifferente** — Amorale, oltre il bene e il male.
> **4 · Sinistro** — Inquietante, corruttore, tendente al male.
> **5 · Maligno** — Ostile a ogni vita; male incarnato.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "piano", component);
```

--- Collegamenti

> [!example] Relazioni
> **Leggi che lo governano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Dominio cosmico**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Abitanti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):abitanti]`
> **Soglie / accessi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):soglie]`

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
