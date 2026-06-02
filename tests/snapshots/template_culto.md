<% await tp.user.crea_culto(tp) %>
# `=this.nome`

> [!infobox] 🕯️ Culto
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Portata** | `VIEW[{portata} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`

> [!note] Dottrina
> `INPUT[textArea:dottrina]`

> [!note] Riti
> `INPUT[textArea:riti]`

> [!note] Gerarchia
> `INPUT[textArea:gerarchia]`

> [!note] Tabù
> `INPUT[textArea:tabu]`

> [!note] Nel presente
> `INPUT[textArea:presente]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


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
> **Struttura** `INPUT[slider(minValue(1), maxValue(5), addLabels):struttura]` → `VIEW[{struttura} == 5 ? "5 · Dogmatico" : ({struttura} == 4 ? "4 · Gerarchico" : ({struttura} == 3 ? "3 · Semi-istituzionale" : ({struttura} == 2 ? "2 · Comunitario" : ({struttura} == 1 ? "1 · Anarchico" : ("—")))))]`
> **Rivelazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):rivelazione]` → `VIEW[{rivelazione} == 5 ? "5 · Universale" : ({rivelazione} == 4 ? "4 · Aperta" : ({rivelazione} == 3 ? "3 · Misto" : ({rivelazione} == 2 ? "2 · Filtrata" : ({rivelazione} == 1 ? "1 · Iniziatico" : ("—")))))]`
> **Trascendenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):trascendenza]` → `VIEW[{trascendenza} == 5 ? "5 · Trascendente" : ({trascendenza} == 4 ? "4 · Separato" : ({trascendenza} == 3 ? "3 · Ambivalente" : ({trascendenza} == 2 ? "2 · Diffuso" : ({trascendenza} == 1 ? "1 · Immanente" : ("—")))))]`
> **Legalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):legalita]` → `VIEW[{legalita} == 5 ? "5 · Ufficiale" : ({legalita} == 4 ? "4 · Accettato" : ({legalita} == 3 ? "3 · Riconosciuto" : ({legalita} == 2 ? "2 · Tollerato" : ({legalita} == 1 ? "1 · Illegale" : ("—")))))]`
> **Motivazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):motivazione]` → `VIEW[{motivazione} == 5 ? "5 · Amore" : ({motivazione} == 4 ? "4 · Fiducia" : ({motivazione} == 3 ? "3 · Equilibrata" : ({motivazione} == 2 ? "2 · Placazione" : ({motivazione} == 1 ? "1 · Paura" : ("—")))))]`
> **Ordine** `INPUT[slider(minValue(1), maxValue(5), addLabels):ordine]` → `VIEW[{ordine} == 5 ? "5 · Caotico" : ({ordine} == 4 ? "4 · Sovversivo" : ({ordine} == 3 ? "3 · Neutrale dinamico" : ({ordine} == 2 ? "2 · Ordinato" : ({ordine} == 1 ? "1 · Armonico" : ("—")))))]`
> **Missione** `INPUT[slider(minValue(1), maxValue(5), addLabels):missione]` → `VIEW[{missione} == 5 ? "5 · Missionaria" : ({missione} == 4 ? "4 · Propagandista" : ({missione} == 3 ? "3 · Opportunista" : ({missione} == 2 ? "2 · Conservativo" : ({missione} == 1 ? "1 · Inerziale" : ("—")))))]`
> **Contatto Divino** `INPUT[slider(minValue(1), maxValue(5), addLabels):contatto_divino]` → `VIEW[{contatto_divino} == 5 ? "5 · Mediato" : ({contatto_divino} == 4 ? "4 · Mediato flessibile" : ({contatto_divino} == 3 ? "3 · Misto" : ({contatto_divino} == 2 ? "2 · Intuitivo" : ({contatto_divino} == 1 ? "1 · Diretto" : ("—")))))]`

> [!note]- Struttura — Grado di organizzazione interna e rigidità della gerarchia.
> **1 · Anarchico** — Nessuna gerarchia; fluido, spontaneo, decentralizzato.
> **2 · Comunitario** — Guide senza autorità vincolante; decisioni collettive.
> **3 · Semi-istituzionale** — Struttura leggera; incarichi riconosciuti ma locali.
> **4 · Gerarchico** — Gerarchia formalizzata, con margini di eccezione.
> **5 · Dogmatico** — Piramide rigida; autorità centrale, sacra, indiscutibile.

> [!note]- Rivelazione — Quanto la verità sacra è riservata a pochi o aperta a tutti.
> **1 · Iniziatico** — Verità occulta, solo per gradi e riti segreti.
> **2 · Filtrata** — Sapere parziale ai neofiti; le verità profonde celate.
> **3 · Misto** — Molto pubblico, ma un nucleo segreto per gli iniziati.
> **4 · Aperta** — Insegnamenti divulgati via predicazione e testi.
> **5 · Universale** — Verità per tutti; missionaria, nessun segreto.

> [!note]- Trascendenza — Quanto il divino è immerso nel mondo o separato e superiore.
> **1 · Immanente** — Il divino permea tutto; sacro e mondo non si distinguono.
> **2 · Diffuso** — Presente ovunque, ma non tutto è sacro in egual misura.
> **3 · Ambivalente** — Sia immanente che trascendente; si incarna e supera.
> **4 · Separato** — Distinto dalla creazione; si manifesta in eletti.
> **5 · Trascendente** — Del tutto altro; piano superiore, accessibile per grazia.

> [!note]- Legalità — Posizione del culto rispetto all'autorità vigente.
> **1 · Illegale** — Proibito e perseguitato; clandestino.
> **2 · Tollerato** — Non legale ma tollerato, a profilo basso.
> **3 · Riconosciuto** — Riconoscimento limitato; status minoritario.
> **4 · Accettato** — Pienamente legale e rispettato, non dominante.
> **5 · Ufficiale** — Religione di stato, legata al potere politico.

> [!note]- Motivazione — La spinta emotiva alla base della fede.
> **1 · Paura** — Timore reverenziale; si agisce per evitare punizioni.
> **2 · Placazione** — Offerte e riti per mantenere la benevolenza divina.
> **3 · Equilibrata** — Timore e gratitudine insieme; obbedienza e fiducia.
> **4 · Fiducia** — Si onora per scelta; la divinità è giusta e guida.
> **5 · Amore** — Legame affettivo profondo; si cerca l'unione, l'estasi.

> [!note]- Ordine — Rapporto del culto con l’idea di ordine universale. Esprime quanto il culto promuova equilibrio, ciclicità e stabilità, oppure alimenti disordine, mutamento e crisi come aspetti sacri del cosmo.
> **1 · Armonico** — Il culto si fonda sull’armonia cosmica. Venera l’equilibrio tra opposti, la ciclicità naturale e le leggi immutabili dell’universo. Spesso promuove stabilità, moderazione e conservazione spirituale.
> **2 · Ordinato** — Il culto valorizza la struttura e la coerenza, ma ammette forme controllate di mutamento. Il disordine è tollerato come eccezione da rimettere in equilibrio. Rituale e regolazione sono centrali.
> **3 · Neutrale dinamico** — Il culto riconosce che ordine e caos sono entrambi necessari. Favorisce il cambiamento ciclico, la trasformazione bilanciata, e considera crisi e rigenerazione parti di un unico disegno.
> **4 · Sovversivo** — Il culto abbraccia la trasformazione. Cerca la rottura degli equilibri attuali per rivelare verità nascoste o generare nuove realtà. La distruzione è vista come mezzo sacro.
> **5 · Caotico** — Il culto è devoto all’entropia, all’instabilità, al crollo dell’ordine. Vede nel caos puro la verità ultima, e nel disfacimento la rivelazione. Perfetto per culti del Vuoto, della Follia o dell’Apocalisse.

> [!note]- Missione — Tendenza del culto a trasmettersi, propagarsi e convertire nuovi adepti. Esprime quanto esso si espanda attivamente oltre il suo contesto originario o preferisca restare confinato e stabile.
> **1 · Inerziale** — Il culto non cerca espansione. È tramandato solo per tradizione familiare o locale. Non ha intenzione né struttura per diffondersi. Tipico di culti ancestrali, rurali o etnici chiusi.
> **2 · Conservativo** — Il culto è legato a un territorio o a una comunità specifica. Può accogliere nuovi membri, ma non attivamente. La continuità prevale sulla diffusione.
> **3 · Opportunista** — Il culto si diffonde quando possibile, soprattutto per influenza culturale o migrazioni. Non ha un vero proselitismo, ma si adatta e attecchisce in nuovi contesti quando le condizioni lo favoriscono.
> **4 · Propagandista** — Il culto dispone di strumenti per diffondersi: predicatori, testi, emissari. Mira a crescere in modo controllato, senza imporsi con la forza. È spesso supportato da mecenati o autorità locali.
> **5 · Missionaria** — La diffusione è un dovere sacro. Il culto mira alla conversione globale, anche tramite imposizione, crociate o annessione. Considera ogni non adepto come ignorante, corrotto o perduto.

> [!note]- Contatto Divino — Modalità con cui i fedeli stabiliscono una connessione con il sacro. Rappresenta il grado di immediatezza o mediazione nella comunicazione con la divinità o le forze spirituali.
> **1 · Diretto** — Il contatto con il divino avviene attraverso esperienze personali: visioni, sogni, estasi, trance, possessione. Ogni fedele può accedere autonomamente al sacro senza bisogno di interpreti.
> **2 · Intuitivo** — La comunicazione è ancora personale, ma filtrata da simboli, presagi, animali guida, segni della natura o pratiche rituali spontanee. L’esperienza richiede sensibilità o predisposizione spirituale.
> **3 · Misto** — Alcuni accedono direttamente, altri tramite figure di guida (sciamani, profeti, oracoli). Il culto ammette forme parallele di connessione, combinando immediatezza e mediazione sociale.
> **4 · Mediato flessibile** — Il contatto con il divino è affidato a ruoli specifici, ma non è necessariamente esclusivo. I riti ufficiali sono richiesti per le manifestazioni maggiori del sacro.
> **5 · Mediato** — Solo tramite clero, testi sacri, liturgie o artefatti consacrati si può accedere al divino. La fede passa attraverso una struttura di mediazione istituzionale e rituale. Il fedele non può comunicare da sé.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "culto", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderProfilo");
```

> [!tip] Profilo
> Assegna i tag coerenti derivati dagli assi: `BUTTON[applica-profilo]`

--- Collegamenti

> [!example] Relazioni
> **Divinità venerate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luogo sacro**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo_sacro]`
> **Figure di spicco**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):capi]`
> **Braccio politico**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`

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
