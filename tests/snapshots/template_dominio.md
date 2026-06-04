<% await tp.user.crea_dominio(tp) %>
# `=this.nome`

> [!infobox|dominio] 🌐 Dominio
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(sfera ontologica), option(principio attivo), option(aspetto cosmico)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(ordine), option(caos), option(vita), option(morte), option(natura), option(conoscenza), option(energia), option(fato)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

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
--- 📖 Lore


> [!note] Natura
> `INPUT[textArea:natura]`

> [!note] Dinamica
> `INPUT[textArea:dinamica]`

> [!note] Tensione
> `INPUT[textArea:tensione]`

> [!note] Manifestazioni
> `INPUT[textArea:manifestazioni]`


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
> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

> [!abstract] Carattere
> **Ampiezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):ampiezza]` → `VIEW[{ampiezza} == 5 ? "5 · Totalità" : ({ampiezza} == 4 ? "4 · Pilastro" : ({ampiezza} == 3 ? "3 · Sfera" : ({ampiezza} == 2 ? "2 · Settore" : ({ampiezza} == 1 ? "1 · Aspetto" : ("—")))))]`
> **Orientamento** `INPUT[slider(minValue(1), maxValue(5), addLabels):orientamento]` → `VIEW[{orientamento} == 5 ? "5 · Dissolutivo" : ({orientamento} == 4 ? "4 · Trasformativo" : ({orientamento} == 3 ? "3 · Neutro" : ({orientamento} == 2 ? "2 · Nutriente" : ({orientamento} == 1 ? "1 · Generativo" : ("—")))))]`
> **Attività** `INPUT[slider(minValue(1), maxValue(5), addLabels):attivita]` → `VIEW[{attivita} == 5 ? "5 · Dominante" : ({attivita} == 4 ? "4 · Pressante" : ({attivita} == 3 ? "3 · Operante" : ({attivita} == 2 ? "2 · Sottesa" : ({attivita} == 1 ? "1 · Latente" : ("—")))))]`
> **Pervasività** `INPUT[slider(minValue(1), maxValue(5), addLabels):pervasivita]` → `VIEW[{pervasivita} == 5 ? "5 · Assoluta" : ({pervasivita} == 4 ? "4 · Fondante" : ({pervasivita} == 3 ? "3 · Strutturale" : ({pervasivita} == 2 ? "2 · Diffusa" : ({pervasivita} == 1 ? "1 · Periferica" : ("—")))))]`
> **Tensione** `INPUT[slider(minValue(1), maxValue(5), addLabels):tensione]` → `VIEW[{tensione} == 5 ? "5 · In guerra" : ({tensione} == 4 ? "4 · In lotta" : ({tensione} == 3 ? "3 · In attrito" : ({tensione} == 2 ? "2 · Equilibrato" : ({tensione} == 1 ? "1 · In armonia" : ("—")))))]`

> [!note]- Ampiezza — Quanta parte della realtà cade sotto questa sfera.
> **1 · Aspetto** — Governa un solo, preciso aspetto della realtà.
> **2 · Settore** — Regge un settore definito dell'esistenza.
> **3 · Sfera** — Abbraccia un'intera sfera dell'essere.
> **4 · Pilastro** — Uno dei grandi pilastri su cui poggia il cosmo.
> **5 · Totalità** — Pervade ogni cosa; nulla gli è estraneo.

> [!note]- Orientamento — Se il dominio tende a generare o a dissolvere.
> **1 · Generativo** — Crea, fa nascere, dà forma e ordine.
> **2 · Nutriente** — Sostiene, conserva, fa durare.
> **3 · Neutro** — Né crea né distrugge; semplicemente è.
> **4 · Trasformativo** — Muta, scompone e ricompone senza sosta.
> **5 · Dissolutivo** — Erode, disfa, riconduce al nulla.

> [!note]- Attività — Quanto la sfera agisce sul mondo o resta fondamento inerte.
> **1 · Latente** — Principio inerte, fondamento muto.
> **2 · Sottesa** — Opera sotto la superficie, senza volontà.
> **3 · Operante** — Agisce con regolarità sul mondo.
> **4 · Pressante** — Spinge, preme, forza gli eventi.
> **5 · Dominante** — Detta legge; ogni cosa si piega al suo moto.

> [!note]- Pervasività — Quanto in profondità permea la trama del reale.
> **1 · Periferica** — Tocca la realtà solo ai margini.
> **2 · Diffusa** — Presente ovunque ma tenue.
> **3 · Strutturale** — Parte dell'ossatura del reale.
> **4 · Fondante** — Senza di esso quell'aspetto del cosmo crolla.
> **5 · Assoluta** — È la trama stessa dell'esistenza.

> [!note]- Tensione — Rapporto con i domini opposti o affini.
> **1 · In armonia** — Coopera coi domini affini, nessun conflitto.
> **2 · Equilibrato** — Bilanciato dal suo opposto, stabile.
> **3 · In attrito** — Frizione costante coi domini rivali.
> **4 · In lotta** — Conflitto aperto che muove la storia cosmica.
> **5 · In guerra** — Lacera il cosmo; il suo scontro è cataclisma.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "dominio", component);
```

--- 🔗 Collegamenti

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
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
