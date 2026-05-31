<% await tp.user.crea_lingua(tp) %>
# `=this.nome`

> [!info] Lingua
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

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


--- Carattere

> [!abstract] Carattere
> **Complessità** `INPUT[slider(minValue(1), maxValue(5), addLabels):complessita]`
> **Formalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):formalita]`
> **Polivalenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):funzione]`
> **Origine** `INPUT[slider(minValue(1), maxValue(5), addLabels):origine]`
> **Conoscibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):accesso]`

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

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
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
--- Vista

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(views.renderEntityPanel(dv, page));
```

> [!tip] Azioni
> `BUTTON[marca-canonico]`
>
> `BUTTON[archivia-nota]`
````
