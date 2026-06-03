<% await tp.user.crea_cultura(tp) %>
# `=this.nome`

> [!infobox] 🎏 Cultura
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Portata** | `VIEW[{portata} ?? "—"]` |
> | **Stile dei nomi** | `VIEW[{stile_nomi} ?? "—"]` |
> | **Simbolo** | `VIEW[{simbolo} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(ancestrale), option(sciamanica), option(iniziatica), option(dogmatica), option(fluida), option(sincretica), option(guerriera), option(nomadica)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **ancestrale** — Radicata nelle origini mitiche, nella trasmissione orale e nei cicli naturali.
> **sciamanica** — Integra visibile e invisibile: pratiche spirituali, viaggi dell'anima, dialogo con l'Altrove.
> **iniziatica** — Fondata sul passaggio, la prova e la trasformazione.
> **dogmatica** — Del sacro immutabile, del rito stabilito, della gerarchia indiscutibile.
> **fluida** — In perenne mutamento; abbraccia molteplicità e trasformazione.
> **sincretica** — Dell'intreccio: fonde tradizioni e significati.
> **guerriera** — Fondata sul conflitto, sulla prova e sulla conquista.
> **nomadica** — Del movimento, dell'adattamento e della non-fissazione.

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`
> Stile dei nomi: `INPUT[stile_nomi][:stile_nomi]`
> Simbolo: `INPUT[text:simbolo]`

> [!note] Valori
> `INPUT[textArea:valori]`

> [!note] Vita
> `INPUT[textArea:vita]`

> [!note] Riti
> `INPUT[textArea:riti]`

> [!note] Tabù
> `INPUT[textArea:tabu]`

> [!note] Estetica
> `INPUT[textArea:estetica]`

> [!note] Tensione
> `INPUT[textArea:tensione]`


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
> **Valori Dominanti** `INPUT[slider(minValue(1), maxValue(5), addLabels):valori_dominanti]` → `VIEW[{valori_dominanti} == 5 ? "5 · Potere" : ({valori_dominanti} == 4 ? "4 · Conoscenza" : ({valori_dominanti} == 3 ? "3 · Onore" : ({valori_dominanti} == 2 ? "2 · Armonia" : ({valori_dominanti} == 1 ? "1 · Sopravvivenza" : ("—")))))]`
> **Relazione con la Morte** `INPUT[slider(minValue(1), maxValue(5), addLabels):relazione_morte]` → `VIEW[{relazione_morte} == 5 ? "5 · Coabitazione" : ({relazione_morte} == 4 ? "4 · Trascendenza" : ({relazione_morte} == 3 ? "3 · Iniziazione" : ({relazione_morte} == 2 ? "2 · Sacralizzazione" : ({relazione_morte} == 1 ? "1 · Rimozione" : ("—")))))]`
> **Ciclo Rituale della Vita** `INPUT[slider(minValue(1), maxValue(5), addLabels):ritualizzazione_vita]` → `VIEW[{ritualizzazione_vita} == 5 ? "5 · Ciclico" : ({ritualizzazione_vita} == 4 ? "4 · Iniziatico" : ({ritualizzazione_vita} == 3 ? "3 · Simbolico" : ({ritualizzazione_vita} == 2 ? "2 · Tradizionale" : ({ritualizzazione_vita} == 1 ? "1 · Spontaneo" : ("—")))))]`
> **Relazione con l'Altrove** `INPUT[slider(minValue(1), maxValue(5), addLabels):relazione_altrove]` → `VIEW[{relazione_altrove} == 5 ? "5 · Bi-planare" : ({relazione_altrove} == 4 ? "4 · Integrato" : ({relazione_altrove} == 3 ? "3 · Rituale" : ({relazione_altrove} == 2 ? "2 · Visionario" : ({relazione_altrove} == 1 ? "1 · Tabù" : ("—")))))]`
> **Costruzione dell'Identità** `INPUT[slider(minValue(1), maxValue(5), addLabels):costruzione_identitaria]` → `VIEW[{costruzione_identitaria} == 5 ? "5 · Fluida" : ({costruzione_identitaria} == 4 ? "4 · Iniziatica" : ({costruzione_identitaria} == 3 ? "3 · Comunitaria" : ({costruzione_identitaria} == 2 ? "2 · Per ruoli" : ({costruzione_identitaria} == 1 ? "1 · Ereditaria" : ("—")))))]`
> **Tabù e Purificazioni** `INPUT[slider(minValue(1), maxValue(5), addLabels):sistema_tabu]` → `VIEW[{sistema_tabu} == 5 ? "5 · Sistema sacrale assoluto" : ({sistema_tabu} == 4 ? "4 · Sistema iniziatico" : ({sistema_tabu} == 3 ? "3 · Sistema codificato" : ({sistema_tabu} == 2 ? "2 · Tabù impliciti" : ({sistema_tabu} == 1 ? "1 · Nessuna codificazione" : ("—")))))]`
> **Sé e Natura** `INPUT[slider(minValue(1), maxValue(5), addLabels):posizione_se_natura]` → `VIEW[{posizione_se_natura} == 5 ? "5 · Identità naturale" : ({posizione_se_natura} == 4 ? "4 · Simbiosi rituale" : ({posizione_se_natura} == 3 ? "3 · Armonia funzionale" : ({posizione_se_natura} == 2 ? "2 · Separazione rispettosa" : ({posizione_se_natura} == 1 ? "1 · Antagonismo o dominio" : ("—")))))]`
> **Espressione Estetica e Artistica** `INPUT[slider(minValue(1), maxValue(5), addLabels):espressione_estetica]` → `VIEW[{espressione_estetica} == 5 ? "5 · Trascendente-sacrale" : ({espressione_estetica} == 4 ? "4 · Liberatoria-esperienziale" : ({espressione_estetica} == 3 ? "3 · Rappresentativa-narrativa" : ({espressione_estetica} == 2 ? "2 · Tradizionale-ripetitiva" : ({espressione_estetica} == 1 ? "1 · Primitiva-funzionale" : ("—")))))]`

> [!note]- Valori Dominanti — I principi che la cultura considera sacri o fondamentali.
> **1 · Sopravvivenza** — Tutto è subordinato a sicurezza, difesa, continuità. Virtù: resilienza, sacrificio.
> **2 · Armonia** — Comunità, coesione, equilibrio prima dell'eccezione. Virtù: rispetto, adattamento.
> **3 · Onore** — Identità per prove, riti, codici; l'onore è cardine. Virtù: fierezza, lealtà.
> **4 · Conoscenza** — Ricerca, elevazione, verità; l'ignoranza è il male. Virtù: studio, intuizione.
> **5 · Potere** — Mutare, dominare, ascendere; il mondo è forze da riscrivere. Virtù: audacia, potenza.

> [!note]- Relazione con la Morte — Come la cultura concepisce e tratta morte, dolore e lutto.
> **1 · Rimozione** — La morte è evitata e temuta; il dolore è vergogna. Illusione di eternità.
> **2 · Sacralizzazione** — Passaggio sacro; riti funebri centrali, il dolore onora il legame.
> **3 · Iniziazione** — Soglia da attraversare; pratiche per comprendere e trasformare la fine.
> **4 · Trascendenza** — Superamento del piano fisico; il lutto è gioia, la fine è risveglio.
> **5 · Coabitazione** — La morte è compagna quotidiana; i morti abitano case e sogni.

> [!note]- Ciclo Rituale della Vita — Come la cultura scandisce le fasi della vita con riti e passaggi.
> **1 · Spontaneo** — Processo naturale senza riti imposti; la crescita non è codificata.
> **2 · Tradizionale** — Riti familiari (nascita, unione, morte) trasmessi per imitazione.
> **3 · Simbolico** — Ogni fase è un archetipo o ruolo; il passaggio richiede prove e maschere.
> **4 · Iniziatico** — Cammino sacro; ogni fase lega a segreti, ordini, vocazioni.
> **5 · Ciclico** — Eterno ritorno; si reincarnano antenati o archetipi. Età spiraliche.

> [!note]- Relazione con l'Altrove — Interazione con i mondi non ordinari (spirituali, onirici, dimensionali).
> **1 · Tabù** — L'Altrove è negato o proibito; le credenze si limitano al visibile.
> **2 · Visionario** — Esiste nei sogni e nei canti; lo visitano solo poeti, folli, sciamani.
> **3 · Rituale** — Riti per contattarlo (oracoli, sacrifici); dialogo regolato e ambivalente.
> **4 · Integrato** — Parte della vita quotidiana; spiriti membri della comunità, i morti parlano.
> **5 · Bi-planare** — Ognuno vive su più piani; ogni luogo ha un doppio sacro. Realtà intrecciata.

> [!note]- Costruzione dell'Identità — Come si definiscono i confini tra 'noi' e 'gli altri'.
> **1 · Ereditaria** — Identità fissa per nascita o sangue; chi nasce fuori non appartiene mai.
> **2 · Per ruoli** — Assegnata per funzione (età, lavoro, ruolo); si cambia solo con riti.
> **3 · Comunitaria** — Nasce dal rito e dalla memoria condivisa; si appartiene partecipando.
> **4 · Iniziatica** — Cammino personale; si appartiene se si è passati una soglia.
> **5 · Fluida** — Molteplice e mutevole; si appartiene a più gruppi, l'io è in evoluzione.

> [!note]- Tabù e Purificazioni — Insieme di interdizioni simboliche, divieti sacri, comportamenti proibiti e pratiche di purificazione. Esprime quali atti, parole, oggetti o stati sono considerati impuri, pericolosi o proibiti, e come la cultura gestisce la trasgressione, l’espiazione e il ritorno all’ordine.
> **1 · Nessuna codificazione** — Non esistono tabù formalizzati. Ogni comportamento è valutato in base alla situazione. L’impurità non è concetto rilevante. La trasgressione è rara o irrilevante.
> **2 · Tabù impliciti** — Esistono interdizioni trasmesse per consuetudine o vergogna, ma mai dichiarate apertamente. L’impurità è temuta ma non definita. Le purificazioni sono occasionali, intuitive.
> **3 · Sistema codificato** — La cultura possiede regole chiare su ciò che è puro e impuro. Ogni tabù ha rito di espiazione. Alcune parole, gesti o contatti sono proibiti. L’ordine sociale dipende dalla conformità.
> **4 · Sistema iniziatico** — I tabù proteggono segreti mistici o verità pericolose. Trasgredire implica trasformazione. Le purificazioni sono prove rituali. La colpa è soglia di passaggio, non solo errore.
> **5 · Sistema sacrale assoluto** — Ogni gesto ha valore ontologico. La realtà è attraversata da linee invisibili di sacro e profano. Violare un tabù è squarciare l’ordine cosmico. Le purificazioni sono pratiche lunghe, dolorose, mitiche.

> [!note]- Sé e Natura — Visione del rapporto tra l’individuo (e la collettività) e il mondo naturale. Esprime se la natura è esterna, nemica, maestra o parte integrante del sé culturale. Determina anche il modo in cui la cultura interpreta animali, elementi, stagioni e territori.
> **1 · Antagonismo o dominio** — La natura è pericolosa, caotica, da conquistare o contenere. L’essere umano è separato e superiore. Gli animali e le foreste sono ostacoli o risorse.
> **2 · Separazione rispettosa** — La cultura riconosce la potenza della natura, ma mantiene la distanza. Esistono confini, santuari, regole di rispetto. L’ambiente è sacro ma “altro”.
> **3 · Armonia funzionale** — La natura è partner dell’esistenza. Si sviluppano pratiche agricole, mediche, architettoniche ispirate ai ritmi naturali. L’ecosistema è modello.
> **4 · Simbiosi rituale** — L’essere umano è parte della natura. Gli alberi sono antenati, gli animali alleati, i fiumi antenne cosmiche. Ogni gesto è coesistenza rituale.
> **5 · Identità naturale** — Non esiste distinzione tra natura e cultura. L’individuo è foresta, vento, animale, pietra. Il sé si dissolve nel cosmo vivente. La coscienza è ecologica, totale.

> [!note]- Espressione Estetica e Artistica — Modalità con cui la cultura concepisce, produce e interpreta l’estetica: arte, bellezza, forma e manifestazione simbolica. Esprime se l’arte è funzionale, rituale, liberatoria o trascendente, e quale ruolo giocano i segni visivi, i suoni e le forme corporee nell’identità collettiva.
> **1 · Primitiva-funzionale** — L’estetica è legata alla sopravvivenza o alla funzione pratica. Ogni oggetto ha valore solo in base alla sua utilità. La decorazione è rara, simbolica o inconscia.
> **2 · Tradizionale-ripetitiva** — L’arte segue modelli trasmessi, codici fissi, motivi ancestrali. La bellezza è ripetizione del sacro. Innovare è trasgressione.
> **3 · Rappresentativa-narrativa** — L’estetica racconta storie: affreschi, statue, melodie rituali. Ogni opera è memoria, ogni suono è mito. L’arte ha scopo pedagogico, simbolico o mnemonico.
> **4 · Liberatoria-esperienziale** — L’arte è mezzo di trasformazione personale. L’individuo si esprime attraverso colore, danza, suono, performance. L’estetica è sperimentazione e soglia di libertà.
> **5 · Trascendente-sacrale** — L’arte è portale verso altri piani. Ogni opera è un sigillo, un’entità vivente, una soglia ontica. Le forme sono mantram visivi, e la bellezza è rivelazione del divino.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "cultura", component);
```

--- Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- Collegamenti

> [!example] Relazioni
> **Regioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`
> **Lingua**: `INPUT[suggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):lingua]`
> **Istituzioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):istituzioni]`
> **Specie**: `INPUT[inlineListSuggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):specie]`

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
