<% await tp.user.crea_luogo(tp) %>
> [!banner]
> `INPUT[banner][:banner]`

# `=this.nome`

> [!infobox|luogo] 🗺️ Luogo
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Regione** | `VIEW[{regione}][text(renderMarkdown)]` |
> | **Controllata da** | `VIEW[{controllata_da}][text(renderMarkdown)]` |
> | **Clima** | `VIEW[{clima} ?? "—"]` |
> | **Popolazione** | `VIEW[{popolazione} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(continente), option(regione), option(insediamento), option(sito di interesse), option(struttura), option(dungeon), option(rovina), option(landmark naturale)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(mondano), option(santuario), option(confine), option(selvaggio), option(onirico), option(interdimensionale), option(simbolico)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **mondano** — Luogo ordinario del mondo materiale: abitato, coltivato o di passaggio, senza carica metafisica particolare.
> **santuario** — Spazio con forte carica spirituale, usato per riti, culti o contatto con entità superiori.
> **confine** — Punto di transizione tra realtà, epoche o stati dell'essere: soglia, varco, non-luogo.
> **selvaggio** — Spazio non civilizzato, primordiale, vivo: natura pura o ambiente magico incontaminato.
> **onirico** — Luogo tra sogno, memoria e inconscio: sognato, astrale o condiviso psichicamente.
> **interdimensionale** — Nodo tra piani, crocevia metafisico o intersezione ontologica; instabile o multistrato.
> **simbolico** — Non ha senso fisico: rappresenta concetti, leggi o archetipi. Esiste per significato.

> [!info]- ℹ️ Guida — Luogo
> **Cos'è** · Un luogo è dove succede qualcosa: lo collochi nel mondo, lo leghi a chi lo controlla e ai luoghi confinanti, e gli dai una tensione presente.
> **Campi chiave** · **Tipo** (forma) e **Mondo** per primi; poi **Controllata da** e **Confina con** per inserirlo nel grafo; **Clima**/**Popolazione** per il colore.
> **Spunti** · Cosa c'è di sbagliato o di teso qui, proprio adesso? Chi lo controlla — e chi vorrebbe strapparglielo? Cosa sta per succedere? (la pressione, la prossima mossa)

````tabs
--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!abstract] Scheda
> Clima: `INPUT[clima][:clima]`
> Popolazione: `INPUT[text:popolazione]`

> [!tip]- Genera nome/spunto
> `BUTTON[genera-locale]` (italiano, a tema) — scegli **cosa generare**: nomi (persona/luogo/fazione), PNG, taverne, bevande, ganci, dicerie, tesori (SRD), insediamenti, oggetti, meteo, stanze di dungeon… — dallo *stile* della cultura/specie collegata. Inserisce al cursore.
> [!note]- Colpo d'occhio
> Cos'è il luogo, che impressione dà entrandoci, perché conta nella storia.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Geografia
> `INPUT[textArea:geografia]`

> [!note] Funzione
> `INPUT[textArea:funzione]`

> [!note] Atmosfera
> `INPUT[textArea:atmosfera]`

> [!note] Abitanti
> `INPUT[textArea:abitanti]`

> [!note] Storia
> `INPUT[textArea:storia]`

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
> **Pressione** = quanto scotta *adesso* (temperatura) · **Clock** = il countdown alla conseguenza. Pressione e spinte dal grafo *giustificano* di avanzare il clock; l'imminenza nei cruscotti le pesa entrambe.
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza e chiede se il fronte è *risolto* (si chiude, archiviato) o *ricorrente* (riparte, clock azzerato).

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📊 Carattere

> [!abstract] Carattere
> **Stabilità Spaziale** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita_spaziale]` → `VIEW[{stabilita_spaziale} == 5 ? "5 · Mutante" : ({stabilita_spaziale} == 4 ? "4 · Instabile" : ({stabilita_spaziale} == 3 ? "3 · Anomalo" : ({stabilita_spaziale} == 2 ? "2 · Plastico" : ({stabilita_spaziale} == 1 ? "1 · Solido" : ("—")))))]`
> **Coerenza Temporale** `INPUT[slider(minValue(1), maxValue(5), addLabels):coerenza_temporale]` → `VIEW[{coerenza_temporale} == 5 ? "5 · Atemporale" : ({coerenza_temporale} == 4 ? "4 · Fratturato" : ({coerenza_temporale} == 3 ? "3 · Distorto" : ({coerenza_temporale} == 2 ? "2 · Ondulato" : ({coerenza_temporale} == 1 ? "1 · Lineare" : ("—")))))]`
> **Presenza Magica** `INPUT[slider(minValue(1), maxValue(5), addLabels):presenza_magica]` → `VIEW[{presenza_magica} == 5 ? "5 · Sovraccarica" : ({presenza_magica} == 4 ? "4 · Densa" : ({presenza_magica} == 3 ? "3 · Attiva" : ({presenza_magica} == 2 ? "2 · Debole" : ({presenza_magica} == 1 ? "1 · Nulla" : ("—")))))]`
> **Sacralità** `INPUT[slider(minValue(1), maxValue(5), addLabels):sacralita]` → `VIEW[{sacralita} == 5 ? "5 · Axis Mundi" : ({sacralita} == 4 ? "4 · Benedetto" : ({sacralita} == 3 ? "3 · Rituale" : ({sacralita} == 2 ? "2 · Neutro" : ({sacralita} == 1 ? "1 · Profano" : ("—")))))]`
> **Civilizzazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):civilizzazione]` → `VIEW[{civilizzazione} == 5 ? "5 · Iperevoluto" : ({civilizzazione} == 4 ? "4 · Urbanizzato" : ({civilizzazione} == 3 ? "3 · Colonizzato" : ({civilizzazione} == 2 ? "2 · Marginale" : ({civilizzazione} == 1 ? "1 · Selvaggio" : ("—")))))]`
> **Pericolosità Ontologica** `INPUT[slider(minValue(1), maxValue(5), addLabels):pericolosita_ontologica]` → `VIEW[{pericolosita_ontologica} == 5 ? "5 · Corrosivo" : ({pericolosita_ontologica} == 4 ? "4 · Corrompente" : ({pericolosita_ontologica} == 3 ? "3 · Instabile" : ({pericolosita_ontologica} == 2 ? "2 · Alieno" : ({pericolosita_ontologica} == 1 ? "1 · Sicuro" : ("—")))))]`
> **Stratificazione Dimensionale** `INPUT[slider(minValue(1), maxValue(5), addLabels):stratificazione_dimensionale]` → `VIEW[{stratificazione_dimensionale} == 5 ? "5 · Multi-planare" : ({stratificazione_dimensionale} == 4 ? "4 · Sospeso" : ({stratificazione_dimensionale} == 3 ? "3 · Intersezione" : ({stratificazione_dimensionale} == 2 ? "2 · Semi-velato" : ({stratificazione_dimensionale} == 1 ? "1 · Monoplanare" : ("—")))))]`
> **Risonanza Psichica** `INPUT[slider(minValue(1), maxValue(5), addLabels):risonanza_psichica]` → `VIEW[{risonanza_psichica} == 5 ? "5 · Empatico" : ({risonanza_psichica} == 4 ? "4 · Riflettente" : ({risonanza_psichica} == 3 ? "3 · Suggestivo" : ({risonanza_psichica} == 2 ? "2 · Memorizzante" : ({risonanza_psichica} == 1 ? "1 · Neutro" : ("—")))))]`

> [!note]- Stabilità Spaziale — Quanto lo spazio del luogo è fisso e misurabile, o mutevole e illusorio.
> **1 · Solido** — Confini chiari e immutabili; geografia costante, coordinate affidabili.
> **2 · Plastico** — Alcune caratteristiche cambiano lievemente nel tempo o con le condizioni.
> **3 · Anomalo** — Anomalie localizzate: stanze impossibili, passaggi che appaiono solo a volte.
> **4 · Instabile** — Si trasforma spesso o imprevedibilmente; la mappa perde validità.
> **5 · Mutante** — Nessuna forma definita; cambia con la volontà o la magia, spazio concettuale.

> [!note]- Coerenza Temporale — Come scorre il tempo nel luogo, se normalmente o alterato.
> **1 · Lineare** — Tempo stabile e prevedibile; ore, giorni e anni scorrono normalmente.
> **2 · Ondulato** — Accelera o rallenta leggermente in alcune zone, senza conseguenze gravi.
> **3 · Distorto** — Varia in modo netto: accelerazioni, ripetizioni, ritardi o salti.
> **4 · Fratturato** — Più flussi temporali simultanei; gli eventi non seguono un ordine.
> **5 · Atemporale** — Tempo assente o negato; il luogo è congelato, eterno, fuori dal tempo.

> [!note]- Presenza Magica — Quantità e densità della magia presente nel luogo.
> **1 · Nulla** — Nessuna magia; gli incantesimi faticano o falliscono. Luogo morto sul piano arcano.
> **2 · Debole** — Magia latente; piccole reazioni o presenze residue.
> **3 · Attiva** — Risponde alla magia; può ospitare nodi, fonti o rituali. Effetti normali.
> **4 · Densa** — La magia permea tutto; oggetti si incantano, creature mutano.
> **5 · Sovraccarica** — Fonte vivente di energia; la magia si manifesta senza controllo.

> [!note]- Sacralità — Valore spirituale, mistico o religioso del luogo.
> **1 · Profano** — Privo di significato spirituale, o impuro/blasfemo.
> **2 · Neutro** — Nessuna connotazione sacra o empia; solo un luogo fisico.
> **3 · Rituale** — Usato per pratiche religiose o cultuali, ma non sacro in sé.
> **4 · Benedetto** — Sacro per uno o più culti; reliquie, miracoli, presenze divine.
> **5 · Axis Mundi** — Centro del mondo, contatto coi piani; archetipo vivente, nodo cosmico.

> [!note]- Civilizzazione — Grado di presenza e influenza di civiltà intelligenti.
> **1 · Selvaggio** — Natura primordiale, nessuna presenza intelligente; ambiente incontaminato.
> **2 · Marginale** — Piccoli insediamenti, ruderi o tribù; influenza civilizzata minima.
> **3 · Colonizzato** — Villaggi, rotte, campi o torri; presenza stabile ma dispersa.
> **4 · Urbanizzato** — Città, templi, fortezze; il luogo è plasmato da architettura e cultura.
> **5 · Iperevoluto** — Tecnomagia, città viventi, coscienze collettive; civilizzazione pura.

> [!note]- Pericolosità Ontologica — Capacità del luogo di alterare, corrompere o minacciare la stabilità dell’essere, della mente o dell’anima.
> **1 · Sicuro** — Nessun rischio particolare. Il luogo è stabile, integro, non influisce sulla realtà o sull’identità dell’osservatore.
> **2 · Alieno** — L’ambiente ha regole insolite ma non pericolose. Stimola sogni strani, percezioni nuove o visioni simboliche.
> **3 · Instabile** — Il luogo distorce la mente o l’essenza dell’individuo. Le leggi della realtà vacillano. Identità e tempo possono frammentarsi.
> **4 · Corrompente** — Il luogo genera mutazioni, possessioni, paradossi. Ogni permanenza altera profondamente l’essere. L’accesso richiede protezioni rituali o sacrifici spirituali.
> **5 · Corrosivo** — Il luogo annulla o riscrive l’esistenza. L’identità si dissolve, le memorie vengono risucchiate. È una “bocca cosmica” che devasta anima e realtà. Tipico di luoghi del Vuoto o dell’Abisso.

> [!note]- Stratificazione Dimensionale — Livelli di realtà che coesistono o si intersecano nel luogo.
> **1 · Monoplanare** — Il luogo esiste su un solo livello dimensionale. Non vi sono interferenze da altri piani o realtà.
> **2 · Semi-velato** — Si percepiscono echi o tracce di altri piani (ombre, sogni, apparizioni). Alcuni rituali rivelano livelli nascosti.
> **3 · Intersezione** — Il luogo è un crocevia. Due o più piani si sovrappongono parzialmente. Magie o creature extradimensionali possono emergere.
> **4 · Sospeso** — Il luogo oscilla fra due realtà. Le leggi fisiche cambiano ciclicamente. Le entità sembrano appartenere a piani multipli.
> **5 · Multi-planare** — Il luogo esiste simultaneamente su più piani. I confini tra sogno, realtà, spirito e magia sono dissolti. Ogni punto può condurre altrove. Tipico di Axis Mundi, Nexus, Sancta Cosmici.

> [!note]- Risonanza Psichica — Interazione tra coscienza dell’individuo e “mente” del luogo. Indica se il luogo è passivo o reagisce ai pensieri, emozioni, ricordi di chi lo visita.
> **1 · Neutro** — Il luogo non presenta alcuna risonanza psichica. È materia inerte, priva di eco spirituale o coscienza.
> **2 · Memorizzante** — Il luogo conserva echi degli eventi passati. Si manifestano sogni residui, memorie ancestrali, impronte emozionali.
> **3 · Suggestivo** — Il luogo influisce su stati d’animo e visioni. Genera ispirazioni, incubi, euforia o inquietudine. La sua presenza condiziona l’esperienza soggettiva.
> **4 · Riflettente** — Il luogo si adatta alla mente di chi entra. Modifica forma, colori o eventi in base alle emozioni. Ogni visitatore lo percepisce diversamente.
> **5 · Empatico** — Il luogo ha una volontà psichica attiva. Comunica, seduce, manipola o giudica. Può fondersi con la coscienza, rivelando traumi, desideri o verità.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "luogo", component);
```

--- 🕰 Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- 🧭 Spazio

> [!info] Mappa
> Pesca l'**immagine** della mappa: `INPUT[mappa][:mappa]`
>
> Diventa **interattiva** sotto — zoom/pan e righello distanze→tempi (TTRPG Tools - Maps); aggiungi i **segnaposto** con *Shift+clic* e linkali ai `[[Luoghi]]` (restano salvati accanto all'immagine). Mappe da **Azgaar/Watabou**: esporta PNG/SVG, trascina in `Media/`, poi pescala qui.
>
> Alternative: `BUTTON[disegna-mappa]` (disegnala a mano in Excalidraw, poi incorporala con `![[nome]]`) · `BUTTON[inserisci-mappa]` (blocco avanzato con overlay/livelli multipli).
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMap");
```

> [!info] Posizione
> Coordinate sulla mappa: `INPUT[text:coord]` — `x, y` (per la distanza in linea d'aria; la scala è sul **Mondo**).

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderDintorni");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderViaggio");
```
--- 🔗 Collegamenti

> [!example] Relazioni
> **Regione**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regione]`
> **Controllata da**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):controllata_da]`
> **Figure**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Bioma**: `INPUT[suggester(optionQuery("Mondi/Biomi"), useLinks(partial), allowOther):bioma]`
> **Cultura dominante**: `INPUT[suggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):cultura]`
> **Piano**: `INPUT[suggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piano]`
> **Confina con**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):confina_con]`
> **Produce**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):produce]`
> **Dipende da**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):dipende_da]`
> **Rotta commerciale con**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):rotta_con]`

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
