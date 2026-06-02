<% await tp.user.crea_divinita(tp) %>
# `=this.nome`

> [!infobox] ☀️ Divinità
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Dominio** | `VIEW[{dominio} ?? "—"]` |
> | **Allineamento** | `VIEW[{allineamento} ?? "—"]` |
> | **Simbolo** | `VIEW[{simbolo} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(primordiale), option(archetipica), option(elementale), option(culturale), option(mitica), option(spirituale), option(onirica)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **primordiale** — Preesistente alla creazione dei piani e delle leggi strutturate.
> **archetipica** — Incarna forze universali o concetti eterni.
> **elementale** — Collegata a uno degli elementi fondamentali o ai loro derivati.
> **culturale** — Creata, immaginata o evocata dai mortali.
> **mitica** — Figura simbolica o alchemica, nata dalla convergenza cosmica.
> **spirituale** — Legata al ciclo dell'anima, alla morte, alla purificazione o al karma.
> **onirica** — Nata dall'inconscio collettivo, dai sogni cosmici o da archetipi inconsci.

````tabs
--- Scheda

> [!abstract] Scheda
> Dominio: `INPUT[text:dominio]`
> Allineamento: `INPUT[allineamento][:allineamento]`
> Simbolo: `INPUT[text:simbolo]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Dogmi
> `INPUT[textArea:dogmi]`

> [!note] Culto
> `INPUT[textArea:culto]`


--- Carattere

> [!abstract] Carattere
> **Presenza Cosmica** `INPUT[slider(minValue(1), maxValue(5), addLabels):presenza_cosmica]` → `VIEW[{presenza_cosmica} == 5 ? "5 · Immanente" : ({presenza_cosmica} == 4 ? "4 · Ancorata" : ({presenza_cosmica} == 3 ? "3 · Focalizzata" : ({presenza_cosmica} == 2 ? "2 · Diffusa" : ({presenza_cosmica} == 1 ? "1 · Trascendente" : ("—")))))]`
> **Volontà** `INPUT[slider(minValue(1), maxValue(5), addLabels):volonta]` → `VIEW[{volonta} == 5 ? "5 · Interventista" : ({volonta} == 4 ? "4 · Attiva" : ({volonta} == 3 ? "3 · Reattiva" : ({volonta} == 2 ? "2 · Risonante" : ({volonta} == 1 ? "1 · Silente" : ("—")))))]`
> **Etica Divina** `INPUT[slider(minValue(1), maxValue(5), addLabels):etica_divina]` → `VIEW[{etica_divina} == 5 ? "5 · Giudicante" : ({etica_divina} == 4 ? "4 · Normativa" : ({etica_divina} == 3 ? "3 · Ambigua" : ({etica_divina} == 2 ? "2 · Osservatrice" : ({etica_divina} == 1 ? "1 · Indifferente" : ("—")))))]`
> **Modalità di Interazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):interazione_divina]` → `VIEW[{interazione_divina} == 5 ? "5 · Totale" : ({interazione_divina} == 4 ? "4 · Esplicita" : ({interazione_divina} == 3 ? "3 · Stratificata" : ({interazione_divina} == 2 ? "2 · Simbolica" : ({interazione_divina} == 1 ? "1 · Ineffabile" : ("—")))))]`
> **Incarnazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):incarnazione]` → `VIEW[{incarnazione} == 5 ? "5 · Manifesta" : ({incarnazione} == 4 ? "4 · Iconica" : ({incarnazione} == 3 ? "3 · Parziale" : ({incarnazione} == 2 ? "2 · Impalpabile" : ({incarnazione} == 1 ? "1 · Pura" : ("—")))))]`
> **Polarità Cosmica** `INPUT[slider(minValue(1), maxValue(5), addLabels):polarita_cosmica]` → `VIEW[{polarita_cosmica} == 5 ? "5 · Militante" : ({polarita_cosmica} == 4 ? "4 · Allineata" : ({polarita_cosmica} == 3 ? "3 · Ambivalente" : ({polarita_cosmica} == 2 ? "2 · Equilibratrice" : ({polarita_cosmica} == 1 ? "1 · Neutrale" : ("—")))))]`
> **Accessibilità Cultuale** `INPUT[slider(minValue(1), maxValue(5), addLabels):accessibilita]` → `VIEW[{accessibilita} == 5 ? "5 · Universale" : ({accessibilita} == 4 ? "4 · Aperta" : ({accessibilita} == 3 ? "3 · Condizionata" : ({accessibilita} == 2 ? "2 · Iniziatica" : ({accessibilita} == 1 ? "1 · Elitaria" : ("—")))))]`

> [!note]- Presenza Cosmica — Determina dove e come la divinità esiste nel cosmo. Unisce la densità ontologica alla distribuzione planare.
> **1 · Trascendente** — Esiste oltre il cosmo, non localizzabile, né accessibile. È puro principio.
> **2 · Diffusa** — Presente in molteplici piani e luoghi, ma non incarnata né vincolata. Si manifesta ovunque ma debolmente.
> **3 · Focalizzata** — Possiede una sede principale, ma può agire altrove. Il suo dominio è localizzato, ma non esclusivo.
> **4 · Ancorata** — Legata profondamente a un luogo, piano o popolo. Fuori da esso è muta o assente.
> **5 · Immanente** — È il mondo stesso. Ogni cosa è sua emanazione, esistenza, manifestazione vivente.

> [!note]- Volontà — Intensità e modalità con cui la divinità esercita la propria volontà nel cosmo. Esprime se agisce in modo diretto e visibile, oppure lascia che gli eventi seguano un proprio corso senza interferire.
> **1 · Silente** — La divinità non esercita volontà apparente. Osserva senza agire, non impartisce ordini né influisce sugli eventi. Il libero arbitrio è assoluto, la divinità è puro fondamento, non guida.
> **2 · Risonante** — La volontà divina è presente ma non coercitiva. Si manifesta in sincronicità, ispirazioni o segnali sottili. I fedeli la percepiscono, ma non ricevono comandi né miracoli diretti.
> **3 · Reattiva** — La divinità interviene in risposta a invocazioni, sacrifici o squilibri cosmici. La sua volontà si attiva quando necessaria, ma non domina il flusso degli eventi.
> **4 · Attiva** — La divinità guida, consiglia, punisce, premia. È presente nel mondo attraverso i suoi campioni, i segni e gli eventi. La sua volontà plasma la storia e il destino dei suoi seguaci.
> **5 · Interventista** — La divinità agisce costantemente. Impone la sua visione, determina eventi, plasma la realtà. Nulla accade senza la sua volontà diretta. I fedeli sono strumenti della sua missione.

> [!note]- Etica Divina — Atteggiamento della divinità nei confronti delle azioni morali, delle scelte dei mortali e dell’ordine etico del cosmo. Esprime se la divinità lascia libertà totale, oppure impone un codice e giudica chi lo infrange.
> **1 · Indifferente** — La divinità non si interessa dell’etica umana o del concetto di bene e male. Le azioni non hanno conseguenze spirituali. Ogni giudizio è un’illusione mortale.
> **2 · Osservatrice** — La divinità contempla il comportamento umano, ma non interviene. La moralità è vista come esperienza o prova. Può fornire simboli o sfide, ma senza punizioni o premi.
> **3 · Ambigua** — La divinità esprime un’etica fluida o paradossale. I suoi giudizi cambiano nel tempo o variano secondo il contesto. Può premiare un atto e punirlo altrove. Il mistero è parte della sua giustizia.
> **4 · Normativa** — La divinità impone un codice etico. Riconosce il merito, punisce l’empietà o il crimine spirituale. I riti, le regole e la condotta morale sono centrali per il culto.
> **5 · Giudicante** — La divinità è giudice assoluto. Valuta ogni azione, anche i pensieri, e interviene direttamente. Le anime sono pesate, punite o salvate. Il suo culto è legge spirituale.

> [!note]- Modalità di Interazione — Esprime il modo in cui la divinità comunica, si rivela e si relaziona con il mondo sensibile o spirituale. Unisce i canali comunicativi e la trasparenza simbolica del messaggio divino.
> **1 · Ineffabile** — Nessuna comunicazione verbale o esplicita. Solo stati mistici, simboli interiori, esperienze estatiche.
> **2 · Simbolica** — Opera tramite enigmi, sogni, archetipi, oracoli e visioni. Interazione per decodifica iniziatica.
> **3 · Stratificata** — Parla a più livelli. Parte del messaggio è chiaro, parte è occulto o misterico. Necessita interpretazione.
> **4 · Esplicita** — Comunica tramite parole, profeti, testi sacri, precetti. Messaggio diretto, ma mediato.
> **5 · Totale** — Ogni essere percepisce la sua voce. La realtà stessa è linguaggio divino. Interazione continua e universale.

> [!note]- Incarnazione — Grado con cui la divinità assume forma, figura o presenza concreta. Esprime se resta un principio puro e astratto, oppure si manifesta in corpi, avatar, oggetti, esseri viventi o ambienti.
> **1 · Pura** — La divinità non ha alcuna forma. È concetto, energia, presenza astratta. Non è mai visibile né rappresentabile. Ogni tentativo di raffigurazione è eresia o illusione.
> **2 · Impalpabile** — Assume forme solo simboliche: fuoco, luce, suono, vento, ombra. Non è antropomorfa né stabile. È percepita, ma non fissabile in immagini o idoli.
> **3 · Parziale** — Può manifestarsi in avatar temporanei, animali sacri, oggetti leggendari o fenomeni naturali. Non ha un’unica forma, ma assume veicoli transitori o epifanici.
> **4 · Iconica** — Ha una forma costante, riconoscibile, spesso antropomorfa o mitica. È rappresentata nei templi, statue, sogni. I suoi simboli e tratti sono codificati nel culto.
> **5 · Manifesta** — La divinità esiste fisicamente nel mondo, incarnata in corpi, regni, luoghi sacri o persone viventi. Può camminare, parlare, combattere. È un essere tangibile e attivo nella realtà.

> [!note]- Polarità Cosmica — Posizionamento della divinità all’interno dei conflitti cosmici, morali o metafisici. Esprime se essa si mantiene al di sopra delle polarità (es. bene/male, ordine/caos), oppure prende posizione attiva in una fazione o visione del cosmo.
> **1 · Neutrale** — La divinità trascende ogni dualismo. Non prende parte a nessuna causa, conflitto o opposizione. È pura presenza o principio oltre bene e male, ordine e caos.
> **2 · Equilibratrice** — La divinità interviene solo per bilanciare gli eccessi. Non è parte di una fazione, ma agisce per impedire la vittoria di uno dei poli. Sacralizza l’armonia cosmica.
> **3 · Ambivalente** — La divinità mostra tratti sia di una parte che dell’altra, o cambia posizione in base ai cicli, alle epoche o ai suoi avatar. È complessa, contraddittoria o ciclica.
> **4 · Allineata** — La divinità sostiene chiaramente una fazione cosmica (es. Luce, Ordine, Caos), pur tollerando l’esistenza dell’opposto. I suoi culti sono schierati ma non fanatici.
> **5 · Militante** — La divinità combatte attivamente per l’annientamento dell’opposto. Vede la propria parte come assoluta verità e l’altra come errore da distruggere. I suoi culti sono crociati, inquisitori o apocalittici.

> [!note]- Accessibilità Cultuale — Misura quanto è semplice o complesso stabilire una relazione autentica, efficace e riconosciuta con la divinità. Indica se essa si offre liberamente a chiunque o richiede iniziazioni, lignaggi o stati particolari per essere raggiunta.
> **1 · Elitaria** — Solo pochi eletti, nati con un dono o parte di lignaggi spirituali, possono accedere alla divinità. Il culto è chiuso, riservato e spesso misterico. Il contatto è un privilegio raro.
> **2 · Iniziatica** — L'accesso è possibile ma subordinato a riti, prove o studi. La divinità si rivela gradualmente e solo a chi ha attraversato un percorso specifico. Il culto è strutturato e gerarchico.
> **3 · Condizionata** — Chiunque può cercare la divinità, ma solo in particolari condizioni: rituali, momenti cosmici, stati d’animo o purificazione. L’accesso è selettivo ma non chiuso.
> **4 · Aperta** — La divinità è accessibile alla maggior parte degli esseri senzienti. Il culto è diffuso, i riti sono noti, l’interazione è incoraggiata ma richiede dedizione.
> **5 · Universale** — Tutti, indipendentemente da cultura, status o preparazione, possono accedere alla divinità. Essa risponde anche a preghiere non rituali. È presente in ogni cuore e ogni luogo.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "divinita", component);
```

--- Collegamenti

> [!example] Relazioni
> **Domini cosmici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):domini]`
> **Origine primordiale**: `INPUT[suggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):origine]`
> **Culti**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culti"), useLinks(partial), allowOther):culti]`
> **Piano di dimora**: `INPUT[suggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piano]`
> **Divinità opposte**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):rivali]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
