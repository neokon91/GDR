<% await tp.user.crea_legge_fondamentale(tp) %>
# `=this.nome`

> [!infobox|legge_fondamentale] ⚖️ Legge fondamentale
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Poli** | `VIEW[{poli} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(polarità), option(principio assoluto), option(vincolo cosmico)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(esistenziale), option(morale), option(causale), option(formale), option(temporale), option(magica)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **esistenziale** — Regge l'essere e il non-essere: vita, morte, presenza.
> **morale** — Regge bene e male, luce e ombra, colpa e redenzione.
> **causale** — Regge causa ed effetto, destino e libero arbitrio, caso.
> **formale** — Regge forma e dissoluzione, ordine ed entropia, identità.
> **temporale** — Regge tempo, durata, eternità e ciclicità.
> **magica** — Regge il flusso dell'energia, il vuoto e i limiti del potere.

> [!info]- ℹ️ Guida — Legge fondamentale
> **Cos'è** · Una legge fondamentale è un principio cosmico assoluto, spesso una polarità (Vita↔Morte): la tensione fra i due poli regge un aspetto della realtà.
> **Campi chiave** · **Poli** (i due estremi) e **Famiglia** (esistenziale, morale, causale…); sul Carattere **Equilibrio** dice verso quale polo pende il mondo ora.
> **Spunti** · Quali sono i due poli, e verso quale pende oggi la realtà? Cosa accade — nel mondo, non in astratto — se la legge si spezza? Chi o cosa la incarna, e chi sogna di infrangerla?

````tabs
--- 📖 Lore

> [!abstract] Scheda
> Poli: `INPUT[text:poli]`

> [!note] Principio
> `INPUT[textArea:principio]`

> [!note] Quando si spezza
> `INPUT[textArea:rottura]`

> [!note] Manifestazioni
> `INPUT[textArea:manifestazioni]`

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
> Prossima mossa: `INPUT[text(placeholder(es. il barone raddoppia le guardie)):prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti · scadenza (opz.) `INPUT[number:scadenza]` giri
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
> **Pressione** = quanto scotta *adesso* (temperatura) · **Clock** = il countdown alla conseguenza. Pressione e spinte dal grafo *giustificano* di avanzare il clock; l'imminenza nei cruscotti le pesa entrambe.
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza e chiede se il fronte è *risolto* (si chiude, archiviato) o *ricorrente* (riparte, clock azzerato).

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "legge_fondamentale", component);
```

> [!abstract] Carattere
> **Rigidità** `INPUT[slider(minValue(1), maxValue(5), addLabels):rigidita]` → `VIEW[{rigidita} == 5 ? "5 · Aggirabile" : ({rigidita} == 4 ? "4 · Negoziabile" : ({rigidita} == 3 ? "3 · Flessibile" : ({rigidita} == 2 ? "2 · Ferrea" : ({rigidita} == 1 ? "1 · Inviolabile" : ("—")))))]`
> **Equilibrio dei poli** `INPUT[slider(minValue(1), maxValue(5), addLabels):equilibrio]` → `VIEW[{equilibrio} == 5 ? "5 · Secondo polo egemone" : ({equilibrio} == 4 ? "4 · Bilanciata" : ({equilibrio} == 3 ? "3 · In tensione" : ({equilibrio} == 2 ? "2 · Sbilanciata" : ({equilibrio} == 1 ? "1 · Primo polo egemone" : ("—")))))]`
> **Portata** `INPUT[slider(minValue(1), maxValue(5), addLabels):portata]` → `VIEW[{portata} == 5 ? "5 · Universale" : ({portata} == 4 ? "4 · Cardinale" : ({portata} == 3 ? "3 · Ampia" : ({portata} == 2 ? "2 · Settoriale" : ({portata} == 1 ? "1 · Circoscritta" : ("—")))))]`
> **Stabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita]` → `VIEW[{stabilita} == 5 ? "5 · Morente" : ({stabilita} == 4 ? "4 · Erosa" : ({stabilita} == 3 ? "3 · Vacillante" : ({stabilita} == 2 ? "2 · Salda" : ({stabilita} == 1 ? "1 · Eterna" : ("—")))))]`
> **Manifestazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):manifestazione]` → `VIEW[{manifestazione} == 5 ? "5 · Incarnata" : ({manifestazione} == 4 ? "4 · Palese" : ({manifestazione} == 3 ? "3 · Segnata" : ({manifestazione} == 2 ? "2 · Inferita" : ({manifestazione} == 1 ? "1 · Astratta" : ("—")))))]`

> [!note]- Rigidità — Quanto la legge è inviolabile o aggirabile.
> **1 · Inviolabile** — Assoluta; nessuno può infrangerla.
> **2 · Ferrea** — Cede solo a potenze cosmiche.
> **3 · Flessibile** — Ammette eccezioni rare e costose.
> **4 · Negoziabile** — Si piega a patti, riti, prezzi.
> **5 · Aggirabile** — Chi sa come, la elude.

> [!note]- Equilibrio dei poli — Verso quale dei due poli pende la realtà del mondo.
> **1 · Primo polo egemone** — Il primo polo schiaccia l'altro.
> **2 · Sbilanciata** — Un polo prevale nettamente.
> **3 · In tensione** — I poli si contendono: equilibrio dinamico.
> **4 · Bilanciata** — I poli si tengono in pareggio stabile.
> **5 · Secondo polo egemone** — Il secondo polo schiaccia il primo.

> [!note]- Portata — Quanta parte della realtà la legge tiene insieme.
> **1 · Circoscritta** — Regge un singolo fenomeno.
> **2 · Settoriale** — Governa un ambito definito.
> **3 · Ampia** — Tiene insieme un grande dominio del reale.
> **4 · Cardinale** — Uno dei perni della realtà.
> **5 · Universale** — Senza di essa il cosmo non sta in piedi.

> [!note]- Stabilità — Quanto la legge è eterna o sta cedendo.
> **1 · Eterna** — Immutabile da sempre e per sempre.
> **2 · Salda** — Stabile, con derive lentissime.
> **3 · Vacillante** — Mostra crepe; può indebolirsi.
> **4 · Erosa** — Già intaccata; il suo effetto sfuma a tratti.
> **5 · Morente** — In dissoluzione; cede a un nuovo ordine.

> [!note]- Manifestazione — Quanto la legge è percepibile nel mondo.
> **1 · Astratta** — Pura legge, impercettibile.
> **2 · Inferita** — Si deduce dai suoi effetti.
> **3 · Segnata** — Lascia presagi e fenomeni leggibili.
> **4 · Palese** — Evidente, innegabile a tutti.
> **5 · Incarnata** — Ha un volto o una voce nel mondo.

--- 🔗 Collegamenti

> [!example] Relazioni
> **Dominio che la esprime**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Incarnata da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):incarnata_da]`
> **Piani che la riflettono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Sistemi magici che vi poggiano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`

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
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
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
