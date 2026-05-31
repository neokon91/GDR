<% await tp.user.crea_cultura(tp) %>
# `=this.nome`

> [!info] Cultura
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`

> [!note]- Descrizione
> Scrivi qui il contenuto lore vero della nota.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

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


--- Carattere

> [!abstract] Carattere
> **Valori Dominanti** `INPUT[slider(minValue(1), maxValue(5), addLabels):valori_dominanti]`
> **Relazione con la Morte** `INPUT[slider(minValue(1), maxValue(5), addLabels):relazione_morte]`
> **Ciclo Rituale della Vita** `INPUT[slider(minValue(1), maxValue(5), addLabels):ritualizzazione_vita]`
> **Relazione con l'Altrove** `INPUT[slider(minValue(1), maxValue(5), addLabels):relazione_altrove]`
> **Costruzione dell'Identità** `INPUT[slider(minValue(1), maxValue(5), addLabels):costruzione_identitaria]`

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
> **Regioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regioni]`
> **Lingua**: `INPUT[suggester(optionQuery("Mondi/Lingue"), useLinks(partial), allowOther):lingua]`
> **Istituzioni**: `INPUT[inlineListSuggester(optionQuery("Mondi/Istituzioni"), useLinks(partial), allowOther):istituzioni]`

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
