<% await tp.user.crea_fazione(tp) %>
# `=this.nome`

> [!infobox] ⚔️ Fazione
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Portata** | `VIEW[{portata} ?? "—"]` |
> | **Motto** | `VIEW[{motto} ?? "—"]` |
> | **Forma di governo** | `VIEW[{forma_governo} ?? "—"]` |
> | **Epoca di fondazione** | `VIEW[{fondazione} ?? "—"]` |
> | **Simbolo** | `VIEW[{simbolo} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(militare), option(religiosa), option(arcana), option(rivoluzionaria), option(egemonica), option(mercantile), option(profetica)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **militare** — Strutturata attorno al dominio delle arti belliche: eserciti, ordini armati, caste guerriere.
> **religiosa** — Devota a un'entità, principio o pantheon; si fonda su dogmi, rituali e rivelazioni.
> **arcana** — Dedicata allo studio, controllo o protezione della magia: ordini, gilde, circoli occulti.
> **rivoluzionaria** — Mira a sovvertire l'ordine costituito: moti insurrezionali, cellule clandestine.
> **egemonica** — Integrata nel potere vigente: caste, organi ufficiali, bracci di controllo istituzionale.
> **mercantile** — Orientata a risorse, potere economico o controllo logistico: corporazioni, reti commerciali.
> **profetica** — Fondata su visioni, cicli cosmici o profezie; agisce in funzione di un evento atteso.

````tabs
--- Lore

> [!abstract] Scheda
> Portata: `INPUT[portata][:portata]`
> Motto: `INPUT[text:motto]`
> Forma di governo: `INPUT[text:forma_governo]`
> Epoca di fondazione: `INPUT[text:fondazione]`
> Simbolo: `INPUT[text:simbolo]`

> [!tip]- Genera nome/spunto
> **Locale** (italiano, a tema): `BUTTON[genera-locale]` — scegli **cosa generare** — nomi (persona/luogo/fazione), PNG, taverne, ganci, dicerie, tesori, insediamenti, oggetti… — dallo *stile* della cultura/specie collegata. Inserisce al cursore.
> **FCG** (rapido, EN): in modifica `@` + categoria (es. `@HumanFemale`, `@Settlement`) → popup · oppure il generatore completo `BUTTON[genera-contenuto]` (→ appunti).
> [!note]- Identità
> Cosa rappresenta la fazione, simboli, reputazione e percezione pubblica.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Obiettivo
> `INPUT[textArea:obiettivo]`

> [!note] Metodi
> `INPUT[textArea:metodo]`

> [!note] Gerarchia
> `INPUT[textArea:gerarchia]`

> [!note] Influenza
> `INPUT[textArea:influenza]`

> [!note] Nel presente
> `INPUT[textArea:presente]`

> [!note] Tensione
> `INPUT[textArea:tensione]`

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
> **Struttura** `INPUT[slider(minValue(1), maxValue(5), addLabels):struttura]` → `VIEW[{struttura} == 5 ? "5 · Piramidale" : ({struttura} == 4 ? "4 · Gerarchica" : ({struttura} == 3 ? "3 · Semi-gerarchica" : ({struttura} == 2 ? "2 · Consiliare" : ({struttura} == 1 ? "1 · Orizzontale" : ("—")))))]`
> **Scopo Primario** `INPUT[slider(minValue(1), maxValue(5), addLabels):scopo]` → `VIEW[{scopo} == 5 ? "5 · Pragmatico" : ({scopo} == 4 ? "4 · Opportunista" : ({scopo} == 3 ? "3 · Equilibrato" : ({scopo} == 2 ? "2 · Visionario" : ({scopo} == 1 ? "1 · Ideale puro" : ("—")))))]`
> **Metodo Operativo** `INPUT[slider(minValue(1), maxValue(5), addLabels):metodo_operativo]` → `VIEW[{metodo_operativo} == 5 ? "5 · Palese" : ({metodo_operativo} == 4 ? "4 · Controllato" : ({metodo_operativo} == 3 ? "3 · Ambivalente" : ({metodo_operativo} == 2 ? "2 · Discreto" : ({metodo_operativo} == 1 ? "1 · Occulto" : ("—")))))]`
> **Legalità** `INPUT[slider(minValue(1), maxValue(5), addLabels):legalita]` → `VIEW[{legalita} == 5 ? "5 · Ufficiale" : ({legalita} == 4 ? "4 · Legale" : ({legalita} == 3 ? "3 · Semi-legale" : ({legalita} == 2 ? "2 · Tollerata" : ({legalita} == 1 ? "1 · Illegale" : ("—")))))]`
> **Etica del Conflitto** `INPUT[slider(minValue(1), maxValue(5), addLabels):etica_conflitto]` → `VIEW[{etica_conflitto} == 5 ? "5 · Espansionista" : ({etica_conflitto} == 4 ? "4 · Dominante" : ({etica_conflitto} == 3 ? "3 · Equilibrata" : ({etica_conflitto} == 2 ? "2 · Reattiva" : ({etica_conflitto} == 1 ? "1 · Difensiva" : ("—")))))]`
> **Relazione col Potere** `INPUT[slider(minValue(1), maxValue(5), addLabels):relazione_potere]` → `VIEW[{relazione_potere} == 5 ? "5 · Strumentale" : ({relazione_potere} == 4 ? "4 · Collaborativa tattica" : ({relazione_potere} == 3 ? "3 · Ambigua" : ({relazione_potere} == 2 ? "2 · Ostile selettiva" : ({relazione_potere} == 1 ? "1 · Indipendente assoluta" : ("—")))))]`
> **Coesione** `INPUT[slider(minValue(1), maxValue(5), addLabels):coesione]` → `VIEW[{coesione} == 5 ? "5 · Organico" : ({coesione} == 4 ? "4 · Coordinata centralmente" : ({coesione} == 3 ? "3 · Modulata" : ({coesione} == 2 ? "2 · Decentrata" : ({coesione} == 1 ? "1 · Cellulare" : ("—")))))]`
> **Reazione al Fallimento** `INPUT[slider(minValue(1), maxValue(5), addLabels):reazione_fallimento]` → `VIEW[{reazione_fallimento} == 5 ? "5 · Metamorfosi" : ({reazione_fallimento} == 4 ? "4 · Rinnovamento" : ({reazione_fallimento} == 3 ? "3 · Elaborazione" : ({reazione_fallimento} == 2 ? "2 · Rigidità" : ({reazione_fallimento} == 1 ? "1 · Negazione" : ("—")))))]`
> **Integrità** `INPUT[slider(minValue(1), maxValue(5), addLabels):integrita]` → `VIEW[{integrita} == 5 ? "5 · Esemplare" : ({integrita} == 4 ? "4 · Retta" : ({integrita} == 3 ? "3 · Pragmatica" : ({integrita} == 2 ? "2 · Compromessa" : ({integrita} == 1 ? "1 · Corrotta" : ("—")))))]`

> [!note]- Struttura — Grado di organizzazione interna e rigidità della catena di comando.
> **1 · Orizzontale** — Nessuna struttura fissa; decisioni collettive. Cellule, bande, reti informali.
> **2 · Consiliare** — Potere distribuito tra circoli; decisioni per consultazione. Alleanze, logge.
> **3 · Semi-gerarchica** — Capi e ruoli riconosciuti, ma con margini di autonomia. Gerarchia fluida.
> **4 · Gerarchica** — Catena di comando definita; gradi e responsabilità chiari, decisioni dall'alto.
> **5 · Piramidale** — Vertice assoluto; ogni ruolo per statuto o lignaggio. Ordini militari, regimi.

> [!note]- Scopo Primario — Natura dell'obiettivo perseguito, da ideale astratto a interesse concreto.
> **1 · Ideale puro** — Fine astratto o trascendente (giustizia, verità); sacrifica i risultati alla visione.
> **2 · Visionario** — Idealistico ma con piani concreti. Riformisti, ordini morali, rivoluzionari.
> **3 · Equilibrato** — Fine sia simbolico che pratico; l'ideale guida ma non è la sola motivazione.
> **4 · Opportunista** — Mira a vantaggi materiali con una facciata ideologica per legittimarsi.
> **5 · Pragmatico** — Solo sopravvivenza, espansione, guadagno. Gilde mercenarie, cartelli.

> [!note]- Metodo Operativo — Grado di visibilità e trasparenza con cui la fazione agisce.
> **1 · Occulto** — Esistenza segreta o negata; spionaggio, cospirazioni, riti nascosti.
> **2 · Discreto** — Nota a pochi; agisce via emissari o organizzazioni di copertura.
> **3 · Ambivalente** — Doppia faccia: identità pubblica rispettabile, fini alternativi celati.
> **4 · Controllato** — Nota e riconosciuta, ma cauta; l'agenda completa non è pubblica.
> **5 · Palese** — Agisce apertamente, dichiara i suoi scopi. Governi, ordini, movimenti.

> [!note]- Legalità — Status rispetto all'ordinamento politico e giuridico dominante.
> **1 · Illegale** — Fuorilegge, perseguitata; i membri rischiano arresto o morte. Ribelli, congiure.
> **2 · Tollerata** — Senza riconoscimento, ma tollerata per convenienza o paura. Ai margini.
> **3 · Semi-legale** — Riconoscimento limitato o ambiguo; opera con vincoli o stigma.
> **4 · Legale** — Pienamente legale; sedi, insegne, potere negoziale. Non dominante.
> **5 · Ufficiale** — Organo del potere; coincide col governo o l'autorità religiosa/statale.

> [!note]- Etica del Conflitto — Approccio della fazione alla guerra, al dominio e all'autodifesa.
> **1 · Difensiva** — Conflitto solo per autodifesa; privilegia diplomazia e resistenza.
> **2 · Reattiva** — Accetta la guerra per proteggere alleati o ideali, in modo proporzionato.
> **3 · Equilibrata** — La guerra è un'opzione sempre disponibile, valutata caso per caso.
> **4 · Dominante** — Previene le minacce con la forza; conquista e deterrenza nella dottrina.
> **5 · Espansionista** — Il conflitto è sacro o glorioso; ogni ostacolo è nemico. Imperi, crociate.

> [!note]- Relazione col Potere — Atteggiamento della fazione nei confronti dei poteri costituiti (regni, imperi, caste, chiese, corporazioni). Indica se agisce in autonomia, li sfida, li serve o li strumentalizza per propri fini.
> **1 · Indipendente assoluta** — La fazione si tiene lontana da ogni forma di potere centralizzato. È autonoma, autarchica, spesso isolazionista. Rifiuta compromessi con autorità, leggi o sistemi dominanti.
> **2 · Ostile selettiva** — La fazione è in conflitto con alcune autorità specifiche (un impero, una chiesa, una corporazione), ma non con il concetto di potere in sé. Può sostenere poteri alternativi o ribelli.
> **3 · Ambigua** — La fazione collabora con certi poteri e si oppone ad altri. Mantiene una posizione fluida, a seconda dei contesti. Può essere alleata, nemica o neutrale. Spesso agisce come terza forza.
> **4 · Collaborativa tattica** — La fazione si appoggia ai poteri dominanti per sopravvivere, influenzare o infiltrare. Cerca protezione, accesso a risorse o legittimazione. Spesso manipola le autorità dall’interno.
> **5 · Strumentale** — La fazione è completamente subordinata o parte integrante di un potere superiore. È braccio armato, organo magico, casta servente o culto di stato. Agisce per conto di chi comanda.

> [!note]- Coesione — Struttura interna della fazione in termini di interconnessione tra i suoi membri e cellule operative. Indica se agisce come una rete frammentata o come un corpo unitario interdipendente.
> **1 · Cellulare** — La fazione è composta da cellule autonome, spesso ignare le une delle altre. Ogni nucleo opera in modo indipendente. Perfetto per movimenti clandestini, reti segrete, insurrezioni diffuse.
> **2 · Decentrata** — Esistono più centri decisionali o nuclei regionali semi-autonomi. Le comunicazioni sono lente o filtrate. Le strategie possono divergere, ma condividono visione generale.
> **3 · Modulata** — Le parti della fazione sono coordinate, ma mantengono una certa autonomia logistica o dottrinale. La coesione è funzionale ma non assoluta. Le divisioni tematiche o operative sono ben strutturate.
> **4 · Coordinata centralmente** — Esiste un comando centrale che regola tutte le sezioni. La disciplina è forte, l’unità ideologica mantenuta. Le singole parti eseguono ordini ma possono offrire feedback strutturati.
> **5 · Organico** — La fazione agisce come un singolo organismo. Ogni parte è perfettamente integrata. La volontà centrale è percepita e seguita in modo istintivo o mistico. Tipico di intelligenze collettive, fazioni guidate da mente-alveare o spiriti egemoni.

> [!note]- Reazione al Fallimento — Modalità con cui la fazione affronta la sconfitta, la perdita di potere o le crisi interne. Indica se nega, resiste, rimuove il trauma oppure se lo integra, trasforma e ne rinasce.
> **1 · Negazione** — Il fallimento è rimosso dalla memoria o negato. La fazione insiste nella stessa via, ignorando gli esiti. Spesso riscrive la storia o si rifugia nel dogma per non cambiare.
> **2 · Rigidità** — La fazione riconosce la crisi ma non cambia. Tende a irrigidirsi, incolpare esterni o rafforzare i propri principi, sperando in una rivalsa futura. Il trauma è visto come prova da superare senza mutare.
> **3 · Elaborazione** — La fazione analizza la sconfitta, ne discute le cause, e cerca un equilibrio tra ciò che deve essere conservato e ciò che può essere riformato. L’identità si adatta senza perdersi.
> **4 · Rinnovamento** — La crisi è accolta come occasione. Il culto rifonda sé stesso, cambia dottrina, simboli o leadership. Il passato resta, ma è rifuso in un nuovo inizio. Spesso si genera un “secondo culto”.
> **5 · Metamorfosi** — La sconfitta è parte della fede stessa. La fazione muta forma, scopo e persino nome. Ogni crisi è una mutazione sacra. Nessuna identità è fissa. Ideale per fazioni legate al Vuoto, alla Rinascita o all’Inganno.

> [!note]- Integrità — Quanto è fedele alla propria missione o ne è corrotta. Dimensione recuperata da `istituzione` nel merge SYS-2: vale per ogni fazione, non solo per le istituzioni formali.
> **1 · Corrotta** — Serve interessi privati; la missione dichiarata è una facciata.
> **2 · Compromessa** — Clientele e favori ne piegano l'operato.
> **3 · Pragmatica** — Scende a patti quando serve, ma tiene la barra.
> **4 · Retta** — Fedele alla missione; gli abusi sono rari e puniti.
> **5 · Esemplare** — Incorruttibile; incarna il proprio ideale.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "fazione", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderProfilo");
```

> [!tip] Profilo
> Assegna i tag coerenti derivati dagli assi: `BUTTON[applica-profilo]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCoerenza");
```

--- Cronologia

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTappe");
```
--- Collegamenti

> [!example] Relazioni
> **Sede**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):sede]`
> **Fondatori**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):fondatori]`
> **Figure chiave**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):figure]`
> **Alleate**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):alleati]`
> **Rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):rivali]`
> **Controlla le risorse**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):controlla_risorse]`
> **Regno / Stato**: `INPUT[suggester(optionQuery("Mondi/Regni"), useLinks(partial), allowOther):regno]`

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
