<% await tp.user.crea_entita_primordiale(tp) %>
# `=this.nome`

> [!infobox] 🌑 Entità primordiale
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Stato** | `VIEW[{stato_cosmico} ?? "—"]` |
> | **Allineamento** | `VIEW[{allineamento} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

````tabs
--- Lore

> [!abstract] Scheda
> Stato: `INPUT[stato_cosmico][:stato_cosmico]`
> Allineamento: `INPUT[allineamento][:allineamento]`

> [!note] Ruolo cosmico
> `INPUT[textArea:ruolo_cosmico]`

> [!note] Volontà
> `INPUT[textArea:volonta]`

> [!note] Stato
> `INPUT[textArea:stato]`

> [!note] Eredità
> `INPUT[textArea:eredita]`

> [!note] Manifestazioni
> `INPUT[textArea:manifestazioni]`

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
> **Coscienza** `INPUT[slider(minValue(1), maxValue(5), addLabels):coscienza]` → `VIEW[{coscienza} == 5 ? "5 · Sovrana" : ({coscienza} == 4 ? "4 · Volitiva" : ({coscienza} == 3 ? "3 · Senziente" : ({coscienza} == 2 ? "2 · Istintiva" : ({coscienza} == 1 ? "1 · Cieca" : ("—")))))]`
> **Risveglio** `INPUT[slider(minValue(1), maxValue(5), addLabels):risveglio]` → `VIEW[{risveglio} == 5 ? "5 · Scatenata" : ({risveglio} == 4 ? "4 · Desta" : ({risveglio} == 3 ? "3 · Stirante" : ({risveglio} == 2 ? "2 · Dormiente" : ({risveglio} == 1 ? "1 · Sigillata" : ("—")))))]`
> **Potenza** `INPUT[slider(minValue(1), maxValue(5), addLabels):potenza]` → `VIEW[{potenza} == 5 ? "5 · Illimitata" : ({potenza} == 4 ? "4 · Cosmica" : ({potenza} == 3 ? "3 · Maggiore" : ({potenza} == 2 ? "2 · Locale" : ({potenza} == 1 ? "1 · Diminuita" : ("—")))))]`
> **Disposizione** `INPUT[slider(minValue(1), maxValue(5), addLabels):disposizione]` → `VIEW[{disposizione} == 5 ? "5 · Divorante" : ({disposizione} == 4 ? "4 · Ostile" : ({disposizione} == 3 ? "3 · Indifferente" : ({disposizione} == 2 ? "2 · Benevola" : ({disposizione} == 1 ? "1 · Protettiva" : ("—")))))]`
> **Tangibilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):tangibilita]` → `VIEW[{tangibilita} == 5 ? "5 · Onnipresente" : ({tangibilita} == 4 ? "4 · Incarnata" : ({tangibilita} == 3 ? "3 · Aspetto" : ({tangibilita} == 2 ? "2 · Presenza" : ({tangibilita} == 1 ? "1 · Concetto" : ("—")))))]`

> [!note]- Coscienza — Quanto è mente cosciente o forza cieca.
> **1 · Cieca** — Forza senza mente né intento.
> **2 · Istintiva** — Reagisce, non ragiona.
> **3 · Senziente** — Consapevole, ma di logica aliena.
> **4 · Volitiva** — Ha scopi, piani, una volontà lucida.
> **5 · Sovrana** — Mente vasta che abbraccia ere e mondi.

> [!note]- Risveglio — Lo stato di attività dell'entità nel cosmo.
> **1 · Sigillata** — Imprigionata o spenta, inattiva.
> **2 · Dormiente** — Assopita; sogna e mormora.
> **3 · Stirante** — Si desta a tratti, smuove il mondo.
> **4 · Desta** — Attiva e presente, agisce nel cosmo.
> **5 · Scatenata** — Pienamente libera; ogni sua azione è evento cosmico.

> [!note]- Potenza — La scala del suo potere.
> **1 · Diminuita** — Un'eco del suo antico potere.
> **2 · Locale** — Potente in un luogo o ambito.
> **3 · Maggiore** — Forza di scala continentale o planare.
> **4 · Cosmica** — Rivaleggia con le leggi del mondo.
> **5 · Illimitata** — Il suo potere non ha confini noti.

> [!note]- Disposizione — Il suo atteggiamento verso il mondo e la vita.
> **1 · Protettiva** — Custodisce vita e ordine.
> **2 · Benevola** — Favorevole, ma per fini suoi.
> **3 · Indifferente** — Il mondo non la riguarda.
> **4 · Ostile** — Nemica della vita e delle sue forme.
> **5 · Divorante** — Esiste per disfare, consumare, annullare.

> [!note]- Tangibilità — Quanto è presenza concreta o puro principio.
> **1 · Concetto** — Puro principio, senza forma.
> **2 · Presenza** — Avvertibile, senza corpo.
> **3 · Aspetto** — Si mostra in forme transitorie.
> **4 · Incarnata** — Ha un corpo o una sede fisica.
> **5 · Onnipresente** — La sua sostanza pervade luoghi e stirpi.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "entita_primordiale", component);
```

--- Collegamenti

> [!example] Relazioni
> **Legge incarnata**: `INPUT[suggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):legge]`
> **Dominio**: `INPUT[suggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):dominio]`
> **Divinità discese**: `INPUT[inlineListSuggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Luoghi (prigioni, santuari)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`

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
