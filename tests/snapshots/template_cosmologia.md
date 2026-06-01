<% await tp.user.crea_cosmologia(tp) %>
# `=this.nome`

> [!info] 🌌 Cosmologia
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(origine), option(struttura), option(forze), option(destino), option(mistero)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **origine** — Come e da cosa nasce la realtà: principi e atti primigeni.
> **struttura** — Come è ordinato il cosmo: piani, leggi, gerarchie dell'essere.
> **forze** — Le energie e i poteri che muovono e reggono il mondo.
> **destino** — Dove tende la realtà: cicli, fine, rinascita, scopo ultimo.
> **mistero** — Ciò che resta ignoto o inconoscibile: enigmi e verità nascoste.

````tabs
--- Lore


> [!note]- Natura cosmica
> Cos'è questo principio, dove sta nella struttura del mondo, come lo percepiscono i mortali.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Natura
> `INPUT[textArea:natura]`

> [!note] Principio
> `INPUT[textArea:principio]`

> [!note] Influenza
> `INPUT[textArea:influenza]`

> [!note] Manifestazioni
> `INPUT[textArea:manifestazioni]`

> [!note] Abitanti
> `INPUT[textArea:abitanti]`

> [!note] Accesso
> `INPUT[textArea:accesso]`

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

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Scatena
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
--- Carattere

> [!abstract] Carattere
> **Presenza Cosmica** `INPUT[slider(minValue(1), maxValue(5), addLabels):presenza]` → `VIEW[{presenza} == 5 ? "5 · Immanente" : ({presenza} == 4 ? "4 · Ancorata" : ({presenza} == 3 ? "3 · Focalizzata" : ({presenza} == 2 ? "2 · Diffusa" : ({presenza} == 1 ? "1 · Trascendente" : ("—")))))]`
> **Attività** `INPUT[slider(minValue(1), maxValue(5), addLabels):attivita]` → `VIEW[{attivita} == 5 ? "5 · Interventista" : ({attivita} == 4 ? "4 · Attiva" : ({attivita} == 3 ? "3 · Reattiva" : ({attivita} == 2 ? "2 · Risonante" : ({attivita} == 1 ? "1 · Silente" : ("—")))))]`
> **Ordine cosmico** `INPUT[slider(minValue(1), maxValue(5), addLabels):ordine]` → `VIEW[{ordine} == 5 ? "5 · Legale" : ({ordine} == 4 ? "4 · Tendente all'ordine" : ({ordine} == 3 ? "3 · Neutrale" : ({ordine} == 2 ? "2 · Tendente al caos" : ({ordine} == 1 ? "1 · Caotico" : ("—")))))]`
> **Stabilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):stabilita_cosmica]` → `VIEW[{stabilita_cosmica} == 5 ? "5 · Morente" : ({stabilita_cosmica} == 4 ? "4 · Instabile" : ({stabilita_cosmica} == 3 ? "3 · Ciclica" : ({stabilita_cosmica} == 2 ? "2 · Persistente" : ({stabilita_cosmica} == 1 ? "1 · Eterna" : ("—")))))]`
> **Percezione** `INPUT[slider(minValue(1), maxValue(5), addLabels):percezione]` → `VIEW[{percezione} == 5 ? "5 · Ignota" : ({percezione} == 4 ? "4 · Occulta" : ({percezione} == 3 ? "3 · Velata" : ({percezione} == 2 ? "2 · Nota" : ({percezione} == 1 ? "1 · Manifesta" : ("—")))))]`

> [!note]- Presenza Cosmica — Dove e come questo principio esiste nel cosmo.
> **1 · Trascendente** — Oltre il cosmo, non localizzabile né accessibile; puro principio.
> **2 · Diffusa** — Presente in molti piani ma debolmente; ovunque e in nessun luogo.
> **3 · Focalizzata** — Una sede principale, ma può agire altrove; dominio non esclusivo.
> **4 · Ancorata** — Legata a un luogo, piano o popolo; fuori è muta o assente.
> **5 · Immanente** — È il mondo stesso; ogni cosa è sua emanazione vivente.

> [!note]- Attività — Quanto questo principio agisce sul mondo o resta inerte.
> **1 · Silente** — Non esercita volontà; osserva senza agire. Puro fondamento.
> **2 · Risonante** — Presente ma non coercitiva; sincronicità, ispirazioni, segnali sottili.
> **3 · Reattiva** — Interviene su invocazioni, sacrifici o squilibri cosmici.
> **4 · Attiva** — Guida, premia, punisce; plasma la storia tramite segni ed eventi.
> **5 · Interventista** — Agisce di continuo; nulla accade senza la sua volontà diretta.

> [!note]- Ordine cosmico — Se il principio tende all'ordine o al disordine.
> **1 · Caotico** — Forza di disordine e trasgressione; rompe ogni schema.
> **2 · Tendente al caos** — Favorisce libertà, mutamento, individualismo.
> **3 · Neutrale** — Senza orientamento definito; oltre ordine e caos.
> **4 · Tendente all'ordine** — Favorisce armonia, regole, strutture.
> **5 · Legale** — Impone equilibrio e coerenza; rifiuta la deviazione.

> [!note]- Stabilità — Quanto il principio è immutabile o in mutamento.
> **1 · Eterna** — Immutabile da sempre; non cambia né può essere alterata.
> **2 · Persistente** — Stabile, ma manifesta variazioni lente nel tempo.
> **3 · Ciclica** — Si manifesta in fasi, epoche o intervalli ricorrenti.
> **4 · Instabile** — Vacilla; può indebolirsi, eclissarsi o essere aggirata.
> **5 · Morente** — In dissoluzione o già infranta; lascia il posto a un nuovo ordine.

> [!note]- Percezione — Quanto il principio è visibile o nascosto ai mortali.
> **1 · Manifesta** — Evidente a tutti; le sue tracce sono ovunque, innegabili.
> **2 · Nota** — Riconosciuta da culti e sapienti; documentata, studiata.
> **3 · Velata** — Si intuisce da segni e presagi; richiede interpretazione.
> **4 · Occulta** — Nota solo a iniziati; celata sotto miti o falsità.
> **5 · Ignota** — Nessuno la conosce; opera nell'ombra del mondo.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "cosmologia", null);
```

--- Collegamenti

> [!example] Relazioni
> **Domini**: `INPUT[inlineListSuggester(optionQuery("Mondi/Domini"), useLinks(partial), allowOther):domini]`
> **Leggi fondamentali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Leggi"), useLinks(partial), allowOther):leggi]`
> **Entità primordiali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):primordiali]`
> **Piani d'esistenza**: `INPUT[inlineListSuggester(optionQuery("Mondi/Piani"), useLinks(partial), allowOther):piani]`
> **Sistemi magici**: `INPUT[inlineListSuggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistemi_magici]`
> **Luoghi che la manifestano**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]`

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
