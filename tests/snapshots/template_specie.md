<% await tp.user.crea_specie(tp) %>
# `=this.nome`

> [!infobox|specie] 🧬 Specie
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Taglia** | `VIEW[{taglia} ?? "—"]` |
> | **Velocità** | `VIEW[{velocita} ?? "—"]` |
> | **Tipo di creatura** | `VIEW[{tipo_creatura} ?? "—"]` |
> | **Lignaggio** | `VIEW[{lignaggio} ?? "—"]` |
> | **Stile dei nomi** | `VIEW[{stile_nomi} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(comune), option(esotica), option(mostruosa)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(ancestrale), option(spirituale), option(cosmica), option(mortale), option(corrompibile), option(onirica), option(elementale), option(sintetica)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **ancestrale** — Antichissima, nata nei primordi del cosmo o da eventi mitici.
> **spirituale** — Legata al ciclo delle anime, al karma o a piani spirituali.
> **cosmica** — Opera su scala universale o planare.
> **mortale** — Finita nel tempo: soggetta a nascita, crescita e morte.
> **corrompibile** — Nata pura o neutra, ma molto influenzabile da mutazioni, magie o traumi.
> **onirica** — Nata nei sogni cosmici, nell'inconscio collettivo o nei piani onirici.
> **elementale** — Composta o generata dagli elementi primari (fuoco, acqua, aria, terra, etere).
> **sintetica** — Creata artificialmente tramite magia, alchimia o tecnologia.

> [!info]- ℹ️ Guida — Specie
> **Cos'è** · Una specie è un popolo giocabile: ne fissi i tratti meccanici (taglia, velocità) perché crea_pg li offra, e la sua natura aliena.
> **Campi chiave** · **Tipo** (rarità) + **famiglia** (origine); **Taglia** e **Velocità** la rendono giocabile in crea_pg; scrivi i **Tratti** (includi "scurovisione" se la concede).
> **Spunti** · Cosa la rende davvero ALIENA o memorabile (non «umani con le orecchie a punta»)? Qual è il suo rapporto con le altre genti? Un dono e una maledizione della sua natura.

````tabs
--- 📋 Scheda

> [!abstract] Scheda
> Taglia: `INPUT[taglia][:taglia]`
> Velocità: `INPUT[text(placeholder(es. 9 m · volo 18 m)):velocita]`
> Tipo di creatura: `INPUT[tipo_creatura][:tipo_creatura]`
> Lignaggio: `INPUT[text(placeholder(es. Discendenza infernale)):lignaggio]`
> Stile dei nomi: `INPUT[stile_nomi][:stile_nomi]`

--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Tratti
> `INPUT[textArea:tratti]`


--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "specie", component);
```

> [!abstract] Carattere
> **Socialità** `INPUT[slider(minValue(1), maxValue(5), addLabels):socialita]` → `VIEW[{socialita} == 5 ? "5 · Ipercollettiva" : ({socialita} == 4 ? "4 · Comunitaria" : ({socialita} == 3 ? "3 · Aggregativa" : ({socialita} == 2 ? "2 · Individualista" : ({socialita} == 1 ? "1 · Solitaria" : ("—")))))]`
> **Predisposizione Magica** `INPUT[slider(minValue(1), maxValue(5), addLabels):predisposizione_magica]` → `VIEW[{predisposizione_magica} == 5 ? "5 · Inerente totale" : ({predisposizione_magica} == 4 ? "4 · Inerente parziale" : ({predisposizione_magica} == 3 ? "3 · Intrinseca condizionata" : ({predisposizione_magica} == 2 ? "2 · Accessibile con fatica" : ({predisposizione_magica} == 1 ? "1 · Latente" : ("—")))))]`
> **Complessità Mentale** `INPUT[slider(minValue(1), maxValue(5), addLabels):complessita_mentale]` → `VIEW[{complessita_mentale} == 5 ? "5 · Iperevoluta" : ({complessita_mentale} == 4 ? "4 · Metacognitiva" : ({complessita_mentale} == 3 ? "3 · Coscienza strutturata" : ({complessita_mentale} == 2 ? "2 · Cognitiva basilare" : ({complessita_mentale} == 1 ? "1 · Semplice" : ("—")))))]`
> **Memoria Ancestrale** `INPUT[slider(minValue(1), maxValue(5), addLabels):memoria_ancestrale]` → `VIEW[{memoria_ancestrale} == 5 ? "5 · Totale" : ({memoria_ancestrale} == 4 ? "4 · Collettiva" : ({memoria_ancestrale} == 3 ? "3 · Simbolica" : ({memoria_ancestrale} == 2 ? "2 · Parziale" : ({memoria_ancestrale} == 1 ? "1 · Assente" : ("—")))))]`
> **Longevità Percettiva** `INPUT[slider(minValue(1), maxValue(5), addLabels):longevita_percettiva]` → `VIEW[{longevita_percettiva} == 5 ? "5 · Atemporale" : ({longevita_percettiva} == 4 ? "4 · Ciclica" : ({longevita_percettiva} == 3 ? "3 · Storica" : ({longevita_percettiva} == 2 ? "2 · Lineare breve" : ({longevita_percettiva} == 1 ? "1 · Presente" : ("—")))))]`

> [!note]- Socialità — Descrive il grado di coesione e la struttura sociale della specie. Esprime se tende all’isolamento individuale o alla formazione di comunità stabili, gerarchiche o simbiotiche.
> **1 · Solitaria** — La specie è tendenzialmente isolata. I suoi membri vivono, cacciano, si riproducono e viaggiano in solitaria. I legami sociali sono rari, fugaci o ritualizzati. Tipico di specie predatrici, eremite o planarie.
> **2 · Individualista** — I membri convivono in prossimità, ma conservano una forte autonomia. Le interazioni sono utilitaristiche o funzionali. I legami affettivi o rituali sono limitati a eventi specifici.
> **3 · Aggregativa** — La razza forma gruppi flessibili e adattabili (branchi, clan, famiglie estese). Le relazioni sono stabili ma variabili, e dipendono da necessità territoriali, culturali o biologiche.
> **4 · Comunitaria** — La coesione sociale è elevata. I membri vivono in comunità organizzate, con ruoli distinti e relazioni stabili. Esistono strutture rituali, familiari o etiche condivise. La cultura è fortemente interpersonale.
> **5 · Ipercollettiva** — L’individuo non esiste come entità autonoma. Tutto è subordinato al collettivo, alla colonia, all’intelligenza alveare o al legame spirituale. La razza agisce come un’unica coscienza distribuita.

> [!note]- Predisposizione Magica — Grado in cui la magia è presente come qualità innata nella razza. Esprime se il potere arcano, spirituale o primordiale è latente, eccezionale o immediatamente naturale per i suoi membri.
> **1 · Latente** — La magia è rara e difficile da manifestare. Serve talento, studio o contatti straordinari per risvegliarla. La maggioranza della razza vive senza magia attiva.
> **2 · Accessibile con fatica** — Alcuni membri riescono a usare la magia con addestramento o predisposizione. La razza può apprenderla, ma è un traguardo, non una condizione. Presente ma non diffusa.
> **3 · Intrinseca condizionata** — La razza ha una relazione naturale con la magia, ma essa si manifesta solo in certe condizioni: emozioni, riti, maturazione o ambienti particolari. La magia è dormiente e ciclica.
> **4 · Inerente parziale** — La magia è parte attiva della fisiologia o dell’anima. Quasi tutti i membri la possiedono in forma spontanea o passiva. Il loro corpo, parola o sangue è magico.
> **5 · Inerente totale** — La magia è costitutiva dell’essere. Ogni membro ne è un canale vivo. Ogni gesto ha potenziale arcano. La razza è fatta di mana, flusso, incanto o essenza primordiale.

> [!note]- Complessità Mentale — Livello di evoluzione cognitiva e coscienza interiore della razza. Esprime se il pensiero è istintivo e limitato o se include strutture metacognitive, collettive o archetipiche.
> **1 · Semplice** — La razza possiede una coscienza funzionale, diretta, legata al presente. A gisce per istinti, emozioni o necessità concrete. Non sviluppa pensiero astratto o memoria complessa.
> **2 · Cognitiva basilare** — La razza è capace di linguaggio, apprendimento, memoria culturale. Il pensiero è lineare, pragmatico. La riflessione astratta o simbolica è possibile, ma limitata.
> **3 · Coscienza strutturata** — La razza possiede pensiero simbolico, etico e creativo. Può riflettere su se stessa, costruire sistemi morali o filosofici. Vive in una cultura complessa e stratificata.
> **4 · Metacognitiva** — La razza è consapevole della propria mente, soggettività e limiti cognitivi. Può riflettere sul pensiero, sul tempo, sulla percezione. Spesso sviluppa teorie metafisiche o psicoarchetipiche.
> **5 · Iperevoluta** — La coscienza della razza è multidimensionale. Ogni mente è stratificata, collettiva o transindividuale. La razza può coesistere in stati simultanei, comprendere concetti iperoggettivi o comunicare con entità astratte.

> [!note]- Memoria Ancestrale — Grado di connessione della razza con la propria storia profonda, la linea ancestrale o l’origine cosmica. Esprime se la razza conserva coscientemente ricordi passati, archetipi antichi o conoscenze ereditarie.
> **1 · Assente** — La razza non possiede memoria storica o genetica. Ogni generazione vive isolata, senza trasmissione profonda del sapere. Le origini sono ignote o irrilevanti. Perfetta per razze giovani, instabili o artificiali.
> **2 · Parziale** — La razza conserva miti, leggende o cicatrici storiche, ma non ha accesso diretto alla memoria passata. I ricordi sono trasmessi oralmente o culturalmente, non vissuti come reali.
> **3 · Simbolica** — La razza vive attraverso archetipi, sogni ricorrenti, simboli e riti. La memoria si esprime in forma mitica, ma non sempre consapevole. È presente nel linguaggio, nella forma, nella spiritualità.
> **4 · Collettiva** — I membri condividono una memoria interiore comune. Ogni nuova vita riporta esperienze passate, anche se non sempre razionalizzate. Esiste un archivio animico, onirico o magico che connette le generazioni.
> **5 · Totale** — Ogni individuo ricorda pienamente tutte le vite passate, proprie o della stirpe. La razza è eterna nel pensiero, nella coscienza o nello spirito. La memoria è uno stato costante, parte dell’identità personale e collettiva.

> [!note]- Longevità Percettiva — Percezione del tempo, della durata e del senso storico della specie. Indica se la specie vive nel presente, si proietta nel futuro o percepisce il tempo come un ciclo eterno o un mito sacro.
> **1 · Presente** — La specie vive nell’attimo. Il passato è dimenticato o irrilevante, il futuro incerto. Le decisioni sono immediate, le tradizioni minime. Perfetto per specie istintive o giovani.
> **2 · Lineare breve** — La specie riconosce passato e futuro, ma in scala ridotta. Ha una storia recente, una memoria corta o una cultura instabile. Il tempo è vissuto come sequenza limitata di eventi significativi.
> **3 · Storica** — La specie costruisce miti, cronache e genealogie. Ha memoria lunga, mantiene archivi, insegna la storia. Le decisioni sono ponderate nel tempo. Il tempo è una linea da custodire.
> **4 · Ciclica** — Il tempo è visto come ripetizione cosmica. La specie vive secondo cicli (epoche, eoni, rinascite). Il passato ritorna sotto nuove forme. La cultura è rituale, profetica o archetipica.
> **5 · Atemporale** — La specie non percepisce il tempo come sequenza. Tutto è simultaneo, simbolico o mitico. Vive nel sogno, nella memoria eterna, nella coscienza collettiva. Il tempo lineare è illusione.

--- 🔗 Collegamenti

> [!example]- 🎭 Chi la gioca
> I personaggi del vault che hanno scelto questa nota (si popola creando un PG/PNG che la sceglie):
```dataview
list
from ""
where categoria = "personaggio" and lower(string(specie)) = lower(this.file.name)
sort tipo asc, file.name asc
```
> [!example] Relazioni
> **Regione d'origine**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):origine]`
> **Culture associate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

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
````
