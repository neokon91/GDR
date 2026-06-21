<% await tp.user.crea_piano(tp) %>
# `=this.nome`

> [!infobox|piano] 🌀 Piano d'esistenza
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Accessibilità** | `INPUT[accessibilita][:accessibilita]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(piano elementale), option(piano spirituale), option(piano onirico), option(piano astrale), option(semipiano), option(aldilà)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Piano d'esistenza
> **Cos'è** · Un piano è un livello di realtà a sé — elementale, astrale, onirico, un aldilà — con leggi, abitanti e accessi propri, distinto da un luogo materiale.
> **Campi chiave** · **Tipo** di piano + **Accessibilità** (come vi si entra); poi le relazioni a **Leggi** che lo governano e **Dominio**.
> **Spunti** · Che sostanza e che leggi fisiche ha — e cosa vi uccide un mortale? Come si entra e si esce: soglia, rito, morte, sogno? Come si fa sentire la sua presenza nel mondo materiale?

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```

%%prosa%%
## Natura
> [!question]- 💡 Natura: cos'è, che aspetto e sostanza ha

## Funzione cosmica
> [!question]- 💡 Funzione cosmica: che ruolo svolge nel multiverso

## Caratteristiche
> [!question]- 💡 Caratteristiche: leggi fisiche, ambiente, pericoli

## Accesso
> [!question]- 💡 Accesso: come si entra e si esce (soglie, riti, condizioni)

## Influenza
> [!question]- 💡 Influenza: come tocca il mondo materiale

%%/prosa%%

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
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "piano", component);
```

> [!abstract] Carattere
> **Materialità** `INPUT[slider(minValue(1), maxValue(5), addLabels):materialita]` → `VIEW[{materialita} == 5 ? "5 · Iperreale" : ({materialita} == 4 ? "4 · Solido" : ({materialita} == 3 ? "3 · Fluido" : ({materialita} == 2 ? "2 · Eterico" : ({materialita} == 1 ? "1 · Immateriale" : ("—")))))]`
> **Stabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita]` → `VIEW[{stabilita} == 5 ? "5 · Immutabile" : ({stabilita} == 4 ? "4 · Stabile" : ({stabilita} == 3 ? "3 · Ciclico" : ({stabilita} == 2 ? "2 · Mutevole" : ({stabilita} == 1 ? "1 · Caotico" : ("—")))))]`
> **Ospitalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):ospitalita]` → `VIEW[{ospitalita} == 5 ? "5 · Accogliente" : ({ospitalita} == 4 ? "4 · Vivibile" : ({ospitalita} == 3 ? "3 · Estraneo" : ({ospitalita} == 2 ? "2 · Ostile" : ({ospitalita} == 1 ? "1 · Letale" : ("—")))))]`
> **Risonanza** `INPUT[slider(minValue(1), maxValue(5), addLabels):risonanza]` → `VIEW[{risonanza} == 5 ? "5 · Traboccante" : ({risonanza} == 4 ? "4 · Risonante" : ({risonanza} == 3 ? "3 · Permeabile" : ({risonanza} == 2 ? "2 · Remoto" : ({risonanza} == 1 ? "1 · Sigillato" : ("—")))))]`
> **Inclinazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):inclinazione]` → `VIEW[{inclinazione} == 5 ? "5 · Maligno" : ({inclinazione} == 4 ? "4 · Sinistro" : ({inclinazione} == 3 ? "3 · Indifferente" : ({inclinazione} == 2 ? "2 · Sereno" : ({inclinazione} == 1 ? "1 · Luminoso" : ("—")))))]`
> **Estensione** `INPUT[slider(minValue(1), maxValue(5), addLabels):estensione]` → `VIEW[{estensione} == 5 ? "5 · Infinito" : ({estensione} == 4 ? "4 · Sconfinato" : ({estensione} == 3 ? "3 · Reame" : ({estensione} == 2 ? "2 · Regione" : ({estensione} == 1 ? "1 · Tasca" : ("—")))))]`

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

> [!note]- Estensione — La scala spaziale del piano, dalla sacca tascabile all'infinito.
> **1 · Tasca** — Una sacca piccola e chiusa; un solo luogo.
> **2 · Regione** — Vasto come una contrada; ha confini raggiungibili.
> **3 · Reame** — Ampio come un mondo; lo si esplora per ere.
> **4 · Sconfinato** — Nessun confine noto; chi lo misura si perde.
> **5 · Infinito** — Senza fine per natura; la distanza non ha senso.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Leggi che lo governano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Dominio cosmico**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Abitanti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):abitanti]`
> **Soglie / accessi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):soglie]`
> **Divinità che vi dimorano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Sistemi magici di risonanza**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Piani adiacenti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani_adiacenti]`
> **Primordiali che vi giacciono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):primordiali]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

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
