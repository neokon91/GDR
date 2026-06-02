<% await tp.user.crea_lingua(tp) %>
# `=this.nome`

> [!infobox] 🗣️ Lingua
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Vitalità** | `VIEW[{vitalita} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(primordiale), option(divina), option(planare), option(elementale), option(ancestrale), option(rituale), option(arcana), option(segreta)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **primordiale** — Linguaggi originari, emanazioni cosmiche o divine anteriori alla realtà ordinata.
> **divina** — Idiomi delle entità divine o delle sfere celesti, spesso incomprensibili ai mortali.
> **planare** — Associati a uno o più piani; riflettono le proprietà metafisiche del piano.
> **elementale** — Linguaggi naturali legati ai quattro elementi primari.
> **ancestrale** — Idiomi di civiltà estinte o epoche dimenticate.
> **rituale** — Usati per scopi cerimoniali, religiosi o liturgici.
> **arcana** — Linguaggi specialistici per incantesimi, formule, sigilli e grimori.
> **segreta** — Codici cifrati e idiomi criptici di sette, ladri, spie o ordini iniziatici.

````tabs
--- Lore

> [!abstract] Scheda
> Vitalità: `INPUT[vitalita][:vitalita]`

> [!note] Parlanti
> `INPUT[textArea:chi_parla]`

> [!note] Suono
> `INPUT[textArea:suono]`

> [!note] Scrittura
> `INPUT[textArea:scrittura]`

> [!note] Lessico
> `INPUT[textArea:lessico]`


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
> **Complessità** `INPUT[slider(minValue(1), maxValue(5), addLabels):complessita]` → `VIEW[{complessita} == 5 ? "5 · Ipersistemica" : ({complessita} == 4 ? "4 · Complessa" : ({complessita} == 3 ? "3 · Bilanciata" : ({complessita} == 2 ? "2 · Ridotta" : ({complessita} == 1 ? "1 · Semplice" : ("—")))))]`
> **Formalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):formalita]` → `VIEW[{formalita} == 5 ? "5 · Rituale" : ({formalita} == 4 ? "4 · Solenne" : ({formalita} == 3 ? "3 · Neutra" : ({formalita} == 2 ? "2 · Colloquiale" : ({formalita} == 1 ? "1 · Orale spontanea" : ("—")))))]`
> **Polivalenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):funzione]` → `VIEW[{funzione} == 5 ? "5 · Magica" : ({funzione} == 4 ? "4 · Sacrale" : ({funzione} == 3 ? "3 · Poetica" : ({funzione} == 2 ? "2 · Descrittiva" : ({funzione} == 1 ? "1 · Funzionale" : ("—")))))]`
> **Origine** `INPUT[slider(minValue(1), maxValue(5), addLabels):origine]` → `VIEW[{origine} == 5 ? "5 · Iniettata" : ({origine} == 4 ? "4 · Artificiale" : ({origine} == 3 ? "3 · Riformata" : ({origine} == 2 ? "2 · Evoluta" : ({origine} == 1 ? "1 · Naturale" : ("—")))))]`
> **Conoscibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):accesso]` → `VIEW[{accesso} == 5 ? "5 · Proibita" : ({accesso} == 4 ? "4 · Occulta" : ({accesso} == 3 ? "3 · Specializzata" : ({accesso} == 2 ? "2 · Comune rituale" : ({accesso} == 1 ? "1 · Diffusa" : ("—")))))]`
> **Effetto Magico** `INPUT[slider(minValue(1), maxValue(5), addLabels):effetto_magico]` → `VIEW[{effetto_magico} == 5 ? "5 · Performativa" : ({effetto_magico} == 4 ? "4 · Attivante" : ({effetto_magico} == 3 ? "3 · Condizionata" : ({effetto_magico} == 2 ? "2 · Carica" : ({effetto_magico} == 1 ? "1 · Inerte" : ("—")))))]`
> **Rischio Ontologico** `INPUT[slider(minValue(1), maxValue(5), addLabels):rischio]` → `VIEW[{rischio} == 5 ? "5 · Distruttiva" : ({rischio} == 4 ? "4 · Instabile" : ({rischio} == 3 ? "3 · Corrosiva" : ({rischio} == 2 ? "2 · Faticosa" : ({rischio} == 1 ? "1 · Sicura" : ("—")))))]`
> **Stratificazione** `INPUT[slider(minValue(1), maxValue(5), addLabels):stratificazione]` → `VIEW[{stratificazione} == 5 ? "5 · Multiplanare" : ({stratificazione} == 4 ? "4 · Simbolica" : ({stratificazione} == 3 ? "3 · Polisemica" : ({stratificazione} == 2 ? "2 · Ambivalente" : ({stratificazione} == 1 ? "1 · Unilivello" : ("—")))))]`

> [!note]- Complessità — Struttura interna della lingua, in termini di grammatica, fonologia, sintassi e irregolarità.
> **1 · Semplice** — Struttura diretta, poche regole, vocabolario essenziale. Lingua quotidiana o infantile.
> **2 · Ridotta** — Morfologia limitata, poche eccezioni. Tipica di lingue funzionali o pidgin.
> **3 · Bilanciata** — Struttura regolare, con varietà ma senza eccessiva complessità. Equilibrio tra espressività e accessibilità.
> **4 · Complessa** — Ricca di casi, declinazioni, eccezioni e costruzioni sintattiche articolate. Tipica di lingue antiche o colte.
> **5 · Ipersistemica** — Struttura estremamente sofisticata o multidimensionale. Richiede anni di studio. Può riflettere logiche magiche, metafisiche o matematiche.

> [!note]- Formalità — Livello di codifica rituale, cerimoniale o solenne nella lingua. Indica quanto il suo uso sia quotidiano o sacralizzato.
> **1 · Orale spontanea** — Usata in modo informale, istintivo, nel parlato comune. Poco adatta alla scrittura o ai riti.
> **2 · Colloquiale** — Lingua usata nel parlato sociale, con alcune regole e registri, ma priva di sacralità.
> **3 · Neutra** — Lingua polivalente, usata sia in contesti pubblici che privati. Adatta a vari registri.
> **4 · Solenne** — Usata in cerimonie, trattati, preghiere. Richiede formulae codificate e rispetto della forma.
> **5 · Rituale** — Ogni parola ha valore liturgico o magico. La pronuncia errata può alterare il significato o causare effetti indesiderati.

> [!note]- Polivalenza — Natura della lingua in relazione alla sua funzione: strumento pratico o veicolo simbolico/sacro.
> **1 · Funzionale** — Usata solo per comunicare informazioni o comandi. Priva di valore simbolico.
> **2 · Descrittiva** — Serve a descrivere e trasmettere sapere, ma senza implicazioni metafisiche.
> **3 · Poetica** — Ricca di simboli, allegorie e potenza evocativa. Linguaggio della cultura e della memoria.
> **4 · Sacrale** — Ha un valore spirituale o religioso. Le parole possono invocare o celebrare potenze superiori.
> **5 · Magica** — Le parole sono potere. Pronunciare equivale ad agire. È una lingua performativa.

> [!note]- Origine — Processo attraverso cui la lingua è nata: evoluzione naturale o creazione deliberata.
> **1 · Naturale** — Nata spontaneamente da una comunità attraverso secoli di mutazioni linguistiche.
> **2 · Evoluta** — Ha una storia, ma con influenze significative esterne (invasioni, magie, interventi religiosi).
> **3 · Riformata** — Modificata volontariamente in epoca tarda per scopi politici, religiosi o esoterici.
> **4 · Artificiale** — Inventata consapevolmente da studiosi, sacerdoti o ordini mistici. Può avere struttura regolare.
> **5 · Iniettata** — Imposta da entità divine, cosmiche o arcane. Lingua rivelata, non nata, ma trasmessa integralmente.

> [!note]- Conoscibilità — Accessibilità e diffusione della lingua. Misura quanto è parlata o riservata a élite selezionate.
> **1 · Diffusa** — Lingua comune, conosciuta dalla maggioranza della popolazione o del piano di esistenza.
> **2 · Comune rituale** — Usata in contesti pubblici e rituali, ma non per uso domestico o quotidiano.
> **3 · Specializzata** — Parlata da caste, mestieri o regioni specifiche. Serve per scopi pratici o culturali specifici.
> **4 · Occulta** — Insegnata solo a membri selezionati di gilde, culti o ordini magici. La sua esistenza può essere nascosta.
> **5 · Proibita** — La lingua è segreta e vietata. Solo chi è destinato o maledetto può comprenderla. Parlare può avere effetti cosmici o letali.

> [!note]- Effetto Magico — Capacità della lingua di generare effetti concreti nella realtà attraverso la sola enunciazione.
> **1 · Inerte** — Non produce alcun effetto al di fuori della comunicazione.
> **2 · Carica** — Può amplificare l’emozione o l’intento del parlante, ma senza effetto oggettivo.
> **3 · Condizionata** — Produce effetti magici solo se accompagnata da gesti, rituali o componenti specifici.
> **4 · Attivante** — Attiva direttamente oggetti magici, portali o sigilli tramite parole chiave o formule.
> **5 · Performativa** — Parlare **è** agire. Ogni parola pronunciata realizza un effetto magico reale, permanente o cosmico.

> [!note]- Rischio Ontologico — Rischio esistenziale associato all’uso della lingua. Più è elevato, più l’uso comporta instabilità metafisica o danni all’essere.
> **1 · Sicura** — Nessun pericolo. La lingua è stabile e non influisce sull’essenza.
> **2 · Faticosa** — Richiede energia spirituale o concentrazione intensa. Abuso può esaurire la mente o l’anima.
> **3 · Corrosiva** — L’uso costante erode i ricordi, altera la percezione o consuma la personalità.
> **4 · Instabile** — Parlare può causare mutazioni, frammentazioni dell’identità o squilibri planari.
> **5 · Distruttiva** — Ogni parola modifica il reale e chi la pronuncia. Può spezzare le leggi cosmiche. Uso prolungato implica annichilimento del sé o perdita dell’identità ontologica.

> [!note]- Stratificazione — Livelli di significato presenti in ogni parola. Misura la complessità semantica della lingua.
> **1 · Unilivello** — Ogni parola ha un significato chiaro e unico.
> **2 · Ambivalente** — Le parole possono avere doppi sensi o ambiguità culturali.
> **3 · Polisemica** — Ogni parola può significare più cose a seconda del contesto o dell'intonazione.
> **4 · Simbolica** — Ogni parola è un simbolo con significati spirituali, mistici o archetipici.
> **5 · Multiplanare** — Ogni parola esiste in più livelli semantici: reale, spirituale, magico, onirico. Serve un’iniziazione per comprenderla pienamente.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "lingua", component);
```

--- Collegamenti

> [!example] Relazioni
> **Parlata in**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):parlata_in]`
> **Culture**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

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
