---
cssclasses:
  - indice
categoria: risorsa
tipo: sviluppo
stato: pronto
---

# Plugin Technical Reference

Riferimento tecnico per lo sviluppo del vault. Questa nota documenta i plugin come contratti operativi: cosa possono fare davvero nel vault, quale sintassi usare, quali file di configurazione mantenere coerenti, dove sono gia usati, dove integrarli nei prossimi template e quale fallback Markdown deve restare leggibile se il plugin non renderizza.

## Architettura Target

| Area | Responsabilita |
| --- | --- |
| `Dev/TemplateFactory` | Sorgente dichiarativa, moduli YAML e template Jinja. Jinja genera Markdown statico, non codice runtime per l'utente. |
| `z.modelli` | Output/template Obsidian pronti. Ogni template generato deve iniziare con una sola chiamata Templater. |
| `z.automazioni` | Funzioni Templater e azioni runtime: creazione, spostamento, inizializzazione, manutenzione campi. |
| `z.engine` | Viste JavaScript/DataviewJS riusabili e feedback leggibile nelle dashboard. |
| `z.bases` | Viste Bases e contratti tabellari/mappe da tenere coerenti con YAML e fileclass. |
| `z.fileclass` | FileClass Metadata Menu per campi canonici, tipi, suggerimenti e qualita metadata. |

Pattern template target:

```md
<% await tp.user.crea_entita(tp) %>

# `=this.nome`

Corpo statico generato da Jinja: tabs, callout, Meta Bind input, Meta Bind button, Dataview/DataviewJS, blocchi plugin specifici e fallback Markdown.
```

Regola chiave: Templater inizializza la nota; Jinja produce il corpo template; Meta Bind modifica campi e lancia azioni; DataviewJS/JS Engine renderizzano viste e feedback.

## Core Obsidian

### Properties e Frontmatter

- Funzioni tecniche reali: fonte primaria per Dataview, Bases, Metadata Menu, Meta Bind, Tasks e controlli qualita.
- Sintassi precisa:

```yaml
---
nome: Esempio
categoria: mondo
tipo: luogo
stato: pronto
mondo: "[[Mondi/Mondo]]"
connessioni:
  - "[[Mondi/Fazioni/Fazioni]]"
canonico: true
pubblico: false
---
```

- Config file: `.obsidian/types.json`, piu preset Metadata Menu in `.obsidian/plugins/metadata-menu/data.json`.
- Dove e gia usato: tutte le note in `Mondi/`, `Risorse/`, `Hub/`, `SRD/Mostri`.
- Dove va integrato: `Dev/TemplateFactory/modules/fields_core.yaml`, `z.fileclass/*.md`, `z.bases/*.base`, template Jinja.
- Fallback Markdown: YAML leggibile come testo, tabelle manuali sotto il frontmatter.
- Rischi/limiti: campi omonimi con tipi diversi rompono Bases e Dataview; valori link/lista devono restare coerenti.
- Smoke test: aprire una nota generata, modificare `stato`, verificare che compaia in Dataview e in una `.base`.

### Bases

- Funzioni tecniche reali: viste tabellari editabili, formule leggere, filtri, sort, groupBy, viste mappe via Maps.
- Sintassi precisa:

```yaml
filters:
  and:
    - file.folder == "Mondi/Luoghi"
    - stato != "archiviata"
formulas:
  prontezza: 'if(mondo, if(uso_al_tavolo, "pronta", "manca uso"), "manca mondo")'
views:
  - type: table
    name: Operativa
    limit: 40
    order:
      - nome
      - stato
      - formula.prontezza
```

- Config file: file `.base` in `z.bases/`; plugin Maps in `.obsidian/plugins/maps/manifest.json`.
- Dove e gia usato: `z.bases/Worldbuilding.base`, `Luoghi.base`, `PNG.base`, `Atlante Mappe.base`, `Missioni.base`, `Incontri.base`, `Fazioni.base`, `Economia.base`.
- Dove va integrato: `Dev/TemplateFactory/modules/bases_views.yaml`; ogni campo in Bases deve esistere in `fields_core.yaml` o in un modulo dominio.
- Fallback Markdown: Dataview `TABLE` equivalente o tabella Markdown statica con le stesse colonne.
- Rischi/limiti: sintassi YAML sensibile a indentazione; formule non devono contenere logica business complessa.
- Smoke test: aprire `z.bases/Worldbuilding.base`, verificare che la vista `Codex vivo` raggruppi per `formula.prontezza`.

### Canvas

- Funzioni tecniche reali: rete visuale di note, gruppi, media e frecce per fronti, relazioni e flussi.
- Sintassi precisa: file JSON `.canvas` gestito da Obsidian; non generare manualmente salvo script dedicato.
- Config file: core plugin Canvas, eventuale potenziamento `advanced-canvas`.
- Dove e gia usato: risorse su canvas e mappe in `Risorse/Canvas Per GDR.md`, eventuali file `.canvas`.
- Dove va integrato: template mappa/fronti, dashboard visuali e documentazione `Risorse/Mappe/Mappe.md`.
- Fallback Markdown: lista di wikilink raggruppata per relazione.
- Rischi/limiti: diff rumorosi; fragile da generare a mano.
- Smoke test: aprire un canvas, verificare che link a note e gruppi si aprano.

## Templater

- Plugin id: `templater-obsidian`; versione installata: `2.20.4`.
- Funzioni tecniche reali:
  - chiamare funzioni utente con `tp.user.*`;
  - prompt guidati;
  - creare, rinominare e spostare note;
  - inizializzare frontmatter coerente;
  - delegare helper condivisi in `z.automazioni/helpers.js`;
  - eseguire azioni runtime lanciate da Meta Bind.
- Sintassi precisa:

```md
<% await tp.user.sessione(tp) %>
```

```md
<%*
const nome = await tp.system.prompt("Nome");
await tp.file.rename(nome);
%>
```

- Config file: `.obsidian/plugins/templater-obsidian/data.json`.
- Config attuale rilevante:
  - `templates_folder`: `z.modelli`;
  - `user_scripts_folder`: `z.automazioni/templater`;
  - `enable_system_commands`: `false`;
  - `trigger_on_file_creation`: `false`.
- Dove e gia usato: template in `z.modelli/**`, per esempio `z.modelli/dm/Sessione.md`; wrapper Templater in `z.automazioni/templater/*.js`; logica reale in `z.automazioni/*.js`.
- Dove va integrato:
  - ogni template generato da TemplateFactory deve avere una sola entry iniziale `<% await tp.user.nome(tp) %>`;
  - ogni file visto direttamente da Templater deve esportare una sola funzione;
  - gli script devono limitarsi a inizializzazione, move/rename e normalizzazione metadata;
  - azioni da pulsante in `z.modelli/azioni/*.md` devono chiamare funzioni piccole in `z.automazioni/meta_actions.js`.
- Fallback Markdown: se Templater non gira, il template deve restare leggibile e compilabile a mano; il primo rigo puo restare testo innocuo.
- Rischi/limiti:
  - Templater non e il posto per renderizzare viste continue;
  - prompt troppo lunghi rallentano creazione;
  - spostamenti/rename duplicati possono rompere link se lo script non controlla collisioni;
  - system commands disattivati, quindi non progettare flussi che richiedono shell da Obsidian.
- Smoke test:
  - creare una nota da `z.modelli/dm/Sessione.md`;
  - verificare che il titolo venga inizializzato, che il file finisca nella cartella prevista e che non restino piu chiamate Templater oltre la prima.

## Meta Bind

- Plugin id: `obsidian-meta-bind-plugin`; versione installata: `1.4.10`.
- Funzioni tecniche reali:
  - input inline e block per modificare frontmatter;
  - slider, toggle, select, list e suggester;
  - template input riusabili;
  - pulsanti globali per aprire note, creare note da template o lanciare Templater;
  - interazione operativa nelle note gia create.
- Sintassi precisa:

```md
Stato: `INPUT[stato][:stato]`
Mondo: `INPUT[mondo][:mondo]`
Canonico: `INPUT[canonico][:canonico]`
Pressione: `INPUT[pressione][:pressione]`
Connessioni: `INPUT[connessioni][:connessioni]`
```

```md
`BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`
```

```meta-bind
INPUT[list:conseguenze]
```

- Config file: `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`.
- Config attuale rilevante:
  - `enableJs: true`;
  - template input: `mondo`, `campagne`, `canonico`, `stato base`, `stato canonico`, `stato`, `pressione`, `prossima_mossa`, `connessioni`, `player_safe`, `entita_impattate`, `propaga_a`, `sessioni`, `luoghi`, `fazioni`, `missioni`, `tracciati`;
  - button template globali con azioni `open`, `templaterCreateNote`, `runTemplaterFile`.
- Dove e gia usato: `Inizia Qui.md`, `Hub/**`, `Mondi/**`, `Risorse/**`, `z.modelli/**`; molti pulsanti globali e input in `z.modelli/dm/Sessione.md`.
- Dove va integrato:
  - `Dev/TemplateFactory/modules/metabind_inputs.yaml` per input riusabili;
  - `Dev/TemplateFactory/modules/metabind_buttons.yaml` per pulsanti;
  - `plugin_bindings.yaml` deve citare ogni sintassi generata.
- Fallback Markdown: campo e valore in testo o tabella:

```md
| Campo | Valore |
| --- | --- |
| Stato | pronto |
| Mondo | [[Mondi/Mondo]] |
```

- Rischi/limiti:
  - id pulsanti lunghi e generati automaticamente sono fragili;
  - input template e campi YAML devono avere lo stesso nome;
  - `optionQuery` dipende da percorsi esistenti;
  - input interattivi non sostituiscono validazione batch.
- Smoke test:
  - aprire una sessione;
  - cambiare `stato` con `INPUT[stato]`;
  - premere un `BUTTON[...]` di navigazione;
  - verificare che il frontmatter cambi e che non compaiano errori Meta Bind.

## Dataview e DataviewJS

- Plugin id: `dataview`; versione installata: `0.5.68`.
- Funzioni tecniche reali:
  - query `TABLE`, `LIST`, `TASK`;
  - viste dashboard con `dataviewjs`;
  - controlli qualita e conteggi;
  - rendering di tabelle operative;
  - import/eval controllato di helper locali quando serve.
- Sintassi precisa:

```dataview
TABLE stato, mondo, pressione, prossima_mossa
FROM "Mondi/Missioni"
WHERE stato != "archiviata"
SORT pressione DESC
```

```dataviewjs
const rows = dv.pages('"Mondi"')
  .where(p => p.stato !== "archiviata")
  .sort(p => p.file.name, "asc")
  .map(p => [p.file.link, p.categoria ?? "", p.stato ?? ""]);
dv.table(["Nota", "Categoria", "Stato"], rows);
```

- Config file: `.obsidian/plugins/dataview/data.json`.
- Config attuale rilevante:
  - `enableDataviewJs: true`;
  - `enableInlineDataviewJs: true`;
  - `allowHtml: true`;
  - `refreshInterval: 2500`;
  - `warnOnEmptyResult: true`.
- Dove e gia usato: dashboard `Hub/**`, indici `Mondi/**`, guide `Risorse/**`, controlli in `Risorse/Controllo Vault.md`, `Risorse/Quality Report.md`, `Inizia Qui.md`, mostri SRD indirettamente tramite frontmatter.
- Dove va integrato:
  - `Dev/TemplateFactory/modules/dataview_blocks.yaml`;
  - viste riusabili spostate in `z.engine/gdr_views.js` o `z.engine/session_views.js`;
  - template generati devono usare Dataview semplice per indici e DataviewJS solo per feedback non banale.
- Fallback Markdown: titolo sezione + tabella vuota con colonne previste.
- Rischi/limiti:
  - DataviewJS e codice runtime nel lettore: evitare side effect;
  - `allowHtml` abilita rendering piu potente ma richiede prudenza nei dati non fidati;
  - query troppo ampie su tutto il vault possono rallentare.
- Smoke test:
  - aprire `Risorse/Controllo Vault.md`;
  - verificare che i blocchi `dataviewjs` renderizzino tabelle o messaggi vuoti leggibili;
  - aprire un indice `Mondi/*` e controllare ordinamento e filtri.

## JS Engine

- Plugin id: `js-engine`; versione installata: `0.3.5`.
- Funzioni tecniche reali:
  - eseguire JavaScript in note;
  - centralizzare componenti quando DataviewJS inline diventa troppo lungo;
  - creare viste riusabili con API plugin, app e Markdown.
- Sintassi precisa da usare nei template solo quando serve:

````md
```js-engine
return "Vista JS Engine attiva";
```
````

Pattern preferito nel vault: moduli riusabili in `z.engine` consumati da DataviewJS o JS Engine, senza duplicare logica in ogni nota.

- Config file: manifest e stato plugin in `.obsidian/plugins/js-engine/`; codice locale in `z.engine/gdr_views.js`.
- Dove e gia usato: `z.engine/gdr_views.js` contiene `GDRView` con `renderStatGrid`, `renderPressureList`, `renderLinkedOperationalTable`, `renderSessionOutput`.
- Dove va integrato:
  - `Dev/TemplateFactory/modules/dataview_blocks.yaml` deve poter puntare a funzioni `z.engine`;
  - dashboard complesse dovrebbero chiamare helper invece di copiare blocchi DataviewJS.
- Fallback Markdown: DataviewJS locale equivalente o tabella Markdown statica.
- Rischi/limiti:
  - doppione potenziale con DataviewJS;
  - API e permessi sono meno diffusi tra utenti;
  - codice runtime deve essere puro e senza modifica file salvo azioni esplicite.
- Smoke test:
  - aprire una dashboard che usa helper condivisi;
  - richiamare `GDRView.renderPressureList(dv)`;
  - verificare output e messaggio vuoto.

## Metadata Menu

- Plugin id: `metadata-menu`; versione installata: `0.8.12`.
- Funzioni tecniche reali:
  - preset field con tipi coerenti;
  - FileClass per famiglie di note;
  - suggerimenti e menu campo;
  - controllo qualita metadata.
- Sintassi precisa:

```yaml
---
fileClass: sessione
stato: preparazione
mondo: "[[Mondi/Mondo]]"
---
```

FileClass in `z.fileclass/*.md` con definizione campi gestita dal plugin.

- Config file: `.obsidian/plugins/metadata-menu/data.json`.
- Config attuale rilevante:
  - `classFilesPath: z.fileclass/`;
  - preset `mondo`, `stato`, `stato_canonico`, `canonico`, `pressione`, `prossima_mossa`, `connessioni`, `player_safe`, `entita_impattate`, `propaga_a`, `sessioni`, `luoghi`, `fazioni`, `missioni`, `tracciati`;
  - esclusi da indicizzazione: `SRD`, `z.automazioni`, `z.bacheche`, `z.fileclass`, `z.modelli`.
- Dove e gia usato: `z.fileclass/compendium.md`, `fazione.md`, `incontro.md`, `luogo.md`, `mappa.md`, `media.md`, `mercato.md`, `missione.md`, `png.md`, `relazione.md`, `ricorrenza.md`, `risorsa.md`, `rotta.md`, `sessione.md`, `tracciato.md`.
- Dove va integrato:
  - `fields_core.yaml` deve essere la fonte dichiarativa dei campi condivisi;
  - ogni nuovo blueprint con campi stabili deve avere FileClass o aggiornare una esistente.
- Fallback Markdown: frontmatter standard e tabella "Campi richiesti".
- Rischi/limiti:
  - FileClass non copre cartelle escluse;
  - divergenza tra FileClass, Meta Bind e Bases crea bug silenziosi;
  - campi multivalue devono restare array YAML.
- Smoke test:
  - aprire una nota con `fileClass`;
  - verificare pannello Metadata Menu e suggerimenti campo;
  - controllare che `stato` accetti solo valori previsti.

## Tasks

- Plugin id: `obsidian-tasks-plugin`; versione installata: `8.0.0`.
- Funzioni tecniche reali:
  - query task operative;
  - scadenze, priorita, ricorrenze, done dates;
  - filtri per path, tag, status e date;
  - dashboard DM/manutenzione.
- Sintassi precisa:

```md
- [ ] Preparare recap #task 📅 2026-05-20 🔺
```

````md
```tasks
not done
path includes Risorse
sort by due
limit 20
```
````

- Config file: `.obsidian/plugins/obsidian-tasks-plugin/data.json`.
- Dove e gia usato: `Risorse/Task DM.md`, `Dev/Audit Plugin Bases Tasks.md`, guide operative.
- Dove va integrato:
  - template sessione, missione e manutenzione devono produrre task con `#task`;
  - `Dev/TemplateFactory/modules/sections.yaml` puo includere sezioni "Prossime azioni".
- Fallback Markdown: checklist standard `- [ ]` senza query.
- Rischi/limiti:
  - senza `#task` le query globali possono ignorare task se si usa filtro;
  - emoji date/priorita devono essere stabili;
  - troppi task generati automaticamente creano rumore.
- Smoke test:
  - aprire `Risorse/Task DM.md`;
  - creare una riga `- [ ] Smoke #task 📅 2026-05-20`;
  - verificare che appaia nella query.

## Excalidraw

- Plugin id: `obsidian-excalidraw-plugin`; versione installata: `2.23.3`.
- Funzioni tecniche reali:
  - disegni Markdown `.excalidraw.md`;
  - mappe, fronti, schemi relazioni;
  - link a note e aree testuali;
  - embed in note operative.
- Sintassi precisa:

```md
![[Risorse/Mappe/Schema Relazioni GDR.excalidraw.md]]
```

File disegno: `*.excalidraw.md`, non Markdown narrativo ordinario.

- Config file: `.obsidian/plugins/obsidian-excalidraw-plugin/data.json`.
- Dove e gia usato: `Risorse/Mappe/Schema Relazioni GDR.excalidraw.md`, `z.modelli/mappe/Mappa Excalidraw Fronti.excalidraw.md`, `Risorse/Excalidraw Per GDR.md`, `Risorse/Mappe/Mappe.md`.
- Dove va integrato:
  - blueprint `mappa_fronti`;
  - output in `Risorse/Mappe`;
  - campi metadata coerenti con `z.fileclass/mappa.md` e `z.bases/Atlante Mappe.base`.
- Fallback Markdown: elenco gerarchico di fronti, luoghi e collegamenti.
- Rischi/limiti:
  - file grandi e diff rumorosi;
  - non usare Excalidraw come unica fonte dati;
  - link visuali devono avere equivalente testuale.
- Smoke test:
  - creare da `z.modelli/mappe/Mappa Excalidraw Fronti.excalidraw.md`;
  - aprire il disegno;
  - verificare embed e link in `Risorse/Mappe/Mappe.md`.

## Maps Per Bases

- Plugin id: `maps`; versione installata: `0.1.6`.
- Funzioni tecniche reali: aggiunge vista mappa ai file `.base`, usando coordinate/proprieta delle note.
- Sintassi precisa:

```yaml
views:
  - type: map
    name: Atlante
    order:
      - nome
      - coordinates
      - tipo
```

Campi consigliati:

```yaml
coordinates: [45.4642, 9.19]
icon: castle
color: "#6f8f72"
```

- Config file: plugin in `.obsidian/plugins/maps/`; viste in `z.bases/*.base`.
- Dove e gia usato: `z.bases/Atlante Mappe.base`, documentazione `Risorse/Mappe Bases.md`.
- Dove va integrato:
  - `Dev/TemplateFactory/modules/bases_views.yaml`;
  - template luogo/mappa con campo `coordinates`;
  - fileclass `mappa` e `luogo`.
- Fallback Markdown: tabella con nome, coordinate e link.
- Rischi/limiti:
  - coordinate mancanti producono viste vuote;
  - formato coordinate va standardizzato;
  - Maps e Bases sono funzionalita moderne: testare dopo aggiornamenti Obsidian.
- Smoke test:
  - aprire `z.bases/Atlante Mappe.base`;
  - verificare che la vista mappa mostri almeno una nota con coordinate;
  - cambiare un campo coordinate e controllare aggiornamento marker.

## Fantasy Statblocks

- Plugin id: `obsidian-5e-statblocks`; versione installata: `4.10.3`.
- Funzioni tecniche reali:
  - rendering schede creatura;
  - lettura frontmatter/statblock;
  - blocchi `statblock` per SRD e creature homebrew.
- Sintassi precisa:

````md
```statblock
monster: Goblin
```
````

Oppure nelle note creatura:

```yaml
---
statblock: true
name: Goblin
armor_class: 15
hit_points: 7
hit_dice: "2d6"
---
```

- Config file: `.obsidian/plugins/obsidian-5e-statblocks/data.json`.
- Dove e gia usato: massicciamente in `SRD/Mostri/*.md`; esempio tecnico in `Dev/Sviluppo Vault.md`; template `z.modelli/Creatura.md`.
- Dove va integrato:
  - template creatura e incontro;
  - `Dev/TemplateFactory/modules/plugin_bindings.yaml`;
  - eventuale modulo `statblocks.yaml` per campi SRD.
- Fallback Markdown: tabella statistiche creatura e sezioni Azioni/Reazioni/Tratti.
- Rischi/limiti:
  - nomi campo devono rispettare parser plugin;
  - localizzazione italiana puo non coincidere con chiavi tecniche inglesi;
  - statblock non deve sostituire frontmatter canonico del vault.
- Smoke test:
  - aprire un mostro in `SRD/Mostri`;
  - verificare render del blocco `statblock`;
  - aprire `Mondi/Creature/Creature.md` e controllare indice creature.

## Initiative Tracker

- Plugin id: `initiative-tracker`; versione installata: `13.0.21`.
- Funzioni tecniche reali:
  - incontri, iniziativa, PF, CA, condizioni e turni;
  - blocchi encounter;
  - collegamento con creature/statblock.
- Sintassi precisa:

````md
```encounter
players:
  - name: PG 1
creatures:
  - name: Goblin
    count: 3
```
````

- Config file: `.obsidian/plugins/initiative-tracker/data.json`.
- Dove e gia usato: esempio in `Dev/Sviluppo Vault.md`, documentazione `Risorse/Iniziativa e Combattimenti.md`, template `z.modelli/dm/Incontro.md`.
- Dove va integrato:
  - template incontro;
  - dashboard Durante il Gioco;
  - azioni sessione che collegano creature e mappe.
- Fallback Markdown: tabella incontro con iniziativa, CA, PF, condizioni.
- Rischi/limiti:
  - schema `encounter` deve restare valido YAML;
  - dipende dai nomi creatura disponibili;
  - i dati live di combattimento non vanno confusi con il canone permanente.
- Smoke test:
  - creare un incontro;
  - renderizzare blocco `encounter`;
  - aggiungere una creatura e verificare turno/PF.

## Dice Roller

- Plugin id: `obsidian-dice-roller`; versione installata: `11.4.2`.
- Funzioni tecniche reali:
  - tiri inline;
  - tabelle casuali via block id;
  - generatori rapidi per DM.
- Sintassi precisa:

```md
`dice: 1d20`
`dice: [[Risorse/Tabelle/Tabelle#^umore-png]]`
`dice: 1d4[[Risorse/Tabelle/Tabelle#^complicazioni]]`
```

Tabella:

```md
| dice: 1d6 | Risultato |
| --- | --- |
| 1 | Indizio falso |
| 2 | Alleato inatteso |
^tabella-id
```

- Config file: `.obsidian/plugins/obsidian-dice-roller/data.json`.
- Dove e gia usato: `Risorse/Tabelle/Tabelle.md`, `Risorse/Tabelle/Worldbuilding Generatori.md`, `Dev/Sviluppo Vault.md`, `Risorse/Setup Guidato.md`.
- Dove va integrato:
  - callout generatori in template sessione/luogo/PNG;
  - modulo `sections.yaml` o `callouts.yaml` per "Tiri rapidi";
  - mantenere block id stabili nelle tabelle.
- Fallback Markdown: mostrare la formula e la tabella; il DM puo tirare fisicamente.
- Rischi/limiti:
  - block id rinominati rompono i richiami;
  - tabelle con range non validi non vengono interpretate bene;
  - non usare risultati casuali per scrivere canone senza conferma.
- Smoke test:
  - aprire `Risorse/Tabelle/Tabelle.md`;
  - cliccare `dice: 1d20`;
  - tirare una tabella con block id e verificare risultato.

## Tabs

- Plugin id: `tabs`.
- Funzioni tecniche reali: organizzare note lunghe in pannelli senza perdere fallback leggibile.
- Sintassi precisa:

````md
````tabs
tab: Prepara
Contenuto.

tab: Live
Contenuto.
````
````

- Config file: `.obsidian/plugins/tabs/manifest.json`; stile in `.obsidian/plugins/tabs/styles.css`.
- Dove e gia usato: `z.modelli/dm/Sessione.md`, `Risorse/Mappe/Mappe.md`, molti `SRD/Mostri/*.md`.
- Dove va integrato: `Dev/TemplateFactory/modules/tabs.yaml`; template sessione, mostro, mappa e dashboard lunghe.
- Fallback Markdown: i marker `tab:` restano titoli testuali dentro codeblock; aggiungere heading subito prima se il contenuto e critico.
- Rischi/limiti:
  - code fence annidati richiedono quattro backtick esterni;
  - tab troppo lunghi nascondono informazioni.
- Smoke test: aprire una sessione e verificare tab `Prepara`, `Ancore`, `Live`, `Dopo`.

## Callout Manager e Callout Obsidian

- Plugin id: `callout-manager`.
- Funzioni tecniche reali: mantenere tipi callout riconoscibili per scene, segreti, timer, indizi, handout, regia.
- Sintassi precisa:

```md
> [!scena] Titolo
> Testo.
>
> > [!segreto]- Dettaglio DM
> > Testo annidato.
```

- Config file: `.obsidian/plugins/callout-manager/data.json`; CSS in `.obsidian/snippets/gdr-vault.css`.
- Dove e gia usato: `z.modelli/**`, `Risorse/Callout GDR.md`, guide e dashboard.
- Dove va integrato: `Dev/TemplateFactory/modules/callouts.yaml`.
- Fallback Markdown: blockquote standard leggibile.
- Rischi/limiti: callout annidati possono diventare difficili da editare; evitare contenuti essenziali solo collassati.
- Smoke test: aprire un template con callout annidato e verificare collasso/espansione.

## Calendarium

- Plugin id: `calendarium`.
- Funzioni tecniche reali: calendari diegetici, eventi e date mondo.
- Sintassi precisa:

```yaml
fc-calendar: Calendario Del Mondo
fc-date: "1-1-1"
fc-category: sessione
fc-display-name: Sessione 03
fc-end: "1-1-2"
```

- Config file: `.obsidian/plugins/calendarium/data.json`.
- Dove e gia usato: `Mondi/Calendario.md`, `Mondi/Calendario Diegetico/Calendario Diegetico.md`, `z.fileclass/ricorrenza.md`, `Risorse/Preset Calendario.md`.
- Dove va integrato: template sessione, evento storico, ricorrenza, missione con scadenza.
- Fallback Markdown: campo `data_mondo` testuale e tabella eventi.
- Rischi/limiti: `fc-calendar` deve corrispondere a un calendario configurato; formati data non validati dal solo YAML.
- Smoke test: creare ricorrenza, verificare che compaia in `Mondi/Calendario.md` e che `Risorse/Controllo Vault.md` non segnali calendario mancante.

## Kanban

- Plugin id: `obsidian-kanban`.
- Funzioni tecniche reali: bacheche operative Markdown per preparazione, post-sessione e manutenzione.
- Sintassi precisa:

```yaml
---
kanban-plugin: board
---
```

- Config file: plugin in `.obsidian/plugins/obsidian-kanban/`; board in `z.bacheche/*.md`.
- Dove e gia usato: `z.bacheche/Post Sessione.md`, `Preparazione Sessioni.md`, `Manutenzione Vault.md`.
- Dove va integrato: pulsanti Meta Bind che aprono board, non template generati per entita.
- Fallback Markdown: liste Markdown per colonna.
- Rischi/limiti: non duplicare task gia tracciati da Tasks; board serve a stato operativo visuale.
- Smoke test: aprire una bacheca, spostare una card, verificare che il Markdown resti leggibile.

## Media Extended

- Plugin id: `media-extended`.
- Funzioni tecniche reali: media con timestamp e riferimenti a scene.
- Sintassi precisa:

```yaml
media: "Risorse/Video/sessione.mp4"
timestamp: "00:12:33"
scena: "Ingresso nel tempio"
```

- Config file: `.obsidian/plugins/media-extended/data.json`.
- Dove e gia usato: `Risorse/Media Scene.md`, `Risorse/Audio/Audio.md`, `Risorse/Video/Video.md`, `Risorse/Immagini/Immagini.md`, `z.fileclass/media.md`.
- Dove va integrato: template media/dispensa/sessione quando si collegano materiali al tavolo.
- Fallback Markdown: link file + timestamp testuale.
- Rischi/limiti: percorsi media esterni possono rompersi; evitare media pesanti come dipendenza unica.
- Smoke test: aprire una nota media e verificare link, timestamp e indice Dataview.

## TTRPG Tools: Maps e Hex Cartographer

- Plugin id: `zoom-map` e `hex-cartographer`.
- Funzioni tecniche reali:
  - mappe zoomabili, marker, layer e misure;
  - hexcrawl e regioni a esagoni.
- Sintassi precisa: usare template dedicati e file/plugin UI; per il vault il contratto minimo e frontmatter mappa:

```yaml
categoria: risorsa
tipo: mappa
map_type: zoom
luoghi:
  - "[[Mondi/Luoghi/Luoghi]]"
```

- Config file: `.obsidian/plugins/zoom-map/manifest.json`, `.obsidian/plugins/hex-cartographer/manifest.json`.
- Dove e gia usato: `z.modelli/mappe/Mappa Zoom.md`, `Risorse/Importare Mappe.md`, `Risorse/Mappe/Mappe.md`.
- Dove va integrato: template mappa e Atlante, non note narrative generiche.
- Fallback Markdown: immagine/link della mappa + elenco marker.
- Rischi/limiti: plugin specializzati, maggiore rischio compatibilita; tenere sempre dati testuali.
- Smoke test: creare mappa zoom, aprirla, verificare marker e collegamenti.

## Plugin Di Supporto

| Plugin | Uso reale | Config | Fallback | Smoke test |
| --- | --- | --- | --- | --- |
| Folder Notes | Indici cartella per navigazione non tecnica. | `.obsidian/plugins/folder-notes/data.json` | Note indice normali. | Aprire una cartella con nota omonima. |
| Homepage | Apertura su pagina iniziale. | `.obsidian/plugins/homepage/data.json` | Bookmark manuale a `Inizia Qui.md`. | Riavviare vault e verificare home. |
| Iconize | Icone su file/cartelle/link. | `.obsidian/plugins/obsidian-icon-folder/data.json` | Nomi e prefissi testuali. | Verificare icone in file explorer. |
| Style Settings | Opzioni visuali tema/snippet. | `.obsidian/plugins/obsidian-style-settings/data.json` | CSS snippet statico. | Cambiare un setting e controllare UI. |
| Linter | Pulizia manuale Markdown/YAML. | `.obsidian/plugins/obsidian-linter/data.json` | Formattazione manuale. | Lint manuale su nota di test. |
| Advanced Tables | Editing tabelle Markdown. | `.obsidian/plugins/table-editor-obsidian/data.json` | Tabelle Markdown standard. | Allineare tabella in `Risorse/Tabelle/Tabelle.md`. |
| BRAT | Manutenzione plugin beta/non ufficiali. | `.obsidian/plugins/obsidian42-brat/*` | Installazione manuale plugin. | Verificare lista plugin beta. |
| Fantasy Content Generator | Generazione bozze fantasy. | `.obsidian/plugins/fantasy-content-generator/data.json` | Template Templater e tabelle Dice. | Generare bozza in Inbox e smistarla. |

## Binding Da TemplateFactory

| Modulo YAML | Responsabilita attesa |
| --- | --- |
| `Dev/TemplateFactory/modules/fields_core.yaml` | Campi canonici condivisi da template, fileClass, Bases, Dataview e controlli. |
| `Dev/TemplateFactory/modules/plugin_bindings.yaml` | Sintassi plugin usabile nei template generati. Deve citare ogni plugin runtime. |
| `Dev/TemplateFactory/modules/template_blueprints.yaml` | Blueprint delle famiglie di template e destinazioni output. |
| `Dev/TemplateFactory/modules/sections.yaml` | Sezioni Markdown/Jinja riusabili per corpo template. |
| `Dev/TemplateFactory/modules/callouts.yaml` | Callout standard, inclusi callout annidati. |
| `Dev/TemplateFactory/modules/tabs.yaml` | Layout tabs con fallback leggibile. |
| `Dev/TemplateFactory/modules/dataview_blocks.yaml` | Blocchi Dataview/DataviewJS generabili. |
| `Dev/TemplateFactory/modules/metabind_inputs.yaml` | Input Meta Bind canonici e field target. |
| `Dev/TemplateFactory/modules/metabind_buttons.yaml` | Button Meta Bind e azioni collegate. |
| `Dev/TemplateFactory/modules/bases_views.yaml` | Viste `.base` derivate dai campi canonici. |
| `Dev/TemplateFactory/modules/workflows.yaml` | Flussi di creazione/manutenzione e plugin richiesti. |

## Regole Di Integrazione

- Ogni plugin installato deve apparire in almeno una pagina operativa, una guida o una smoke checklist.
- Se una funzione plugin non ha fallback Markdown, non e pronta per la 1.0.
- Se una sintassi plugin entra in un template, deve essere citata in `plugin_bindings.yaml`.
- Se un campo entra in tre o piu template, deve passare da `fields_core.yaml`, Meta Bind input template, Metadata Menu/FileClass e controlli.
- Le funzioni di manutenzione restano in `Dev/` o script CLI; il DM vede solo pulsanti, viste e note leggibili.
- I template generati non devono contenere piu blocchi Templater sparsi: una sola funzione iniziale, poi corpo statico.
- Jinja non e runtime utente: produce Markdown, YAML e blocchi plugin gia pronti.
- DataviewJS/JS Engine non devono modificare file; le modifiche passano da Meta Bind o Templater.

## Smoke Checklist Globale

1. Creare una sessione da `z.modelli/dm/Sessione.md`.
2. Verificare che la nota abbia una sola chiamata Templater iniziale nel template sorgente.
3. Cambiare `stato`, `mondo`, `pressione`, `connessioni` con Meta Bind.
4. Aprire `Mondi/Sessioni/Sessioni.md` e verificare comparsa nella query Dataview.
5. Aprire una vista `.base` collegata e verificare campo/formula.
6. Aprire `Risorse/Controllo Vault.md` e controllare che DataviewJS non generi errori.
7. Aprire `Risorse/Task DM.md` e verificare una query Tasks.
8. Aprire `Risorse/Tabelle/Tabelle.md` e tirare un `dice:`.
9. Aprire un mostro SRD e verificare `statblock`.
10. Aprire `Risorse/Iniziativa e Combattimenti.md` o un incontro e verificare `encounter`.
11. Aprire `Risorse/Mappe/Mappe.md`, una mappa Excalidraw e `z.bases/Atlante Mappe.base`.
12. Se un plugin fallisce, confermare che la nota resti leggibile in Markdown puro.
