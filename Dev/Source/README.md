# Source

Sorgente dichiarativo del vault: YAML come source of truth, Jinja2 come layer di composizione, asset revisionabili e output ricostruibili via pipeline.

## Obiettivo

Centralizzare definizioni ripetute: frontmatter, campi Meta Bind, router Templater, Dataview, Bases, Tasks, Calendarium, mappe, schede creatura, incontri e versioni Markdown leggibili senza plugin.

La generazione deve servire il profilo D&D 5.5-compatible con SRD separato senza legare il Codex del mondo al regolamento: i template meccanici espongono campi utili a creature, incontri, oggetti e party; le entita di mondo restano giocabili anche quando non contengono statistiche.

## Architettura

| Cartella | Uso |
| --- | --- |
| `YAML/canonical/` | Contratti di dominio, campi, tassonomie, profili e regole persistenti. |
| `YAML/json/` | YAML che genera JSON runtime, configurazioni plugin e dati consumati da JS. |
| `YAML/render/` | YAML che genera Markdown, template, hub, guide e superfici Obsidian. |
| `YAML/quality/` | Contratti di release, check, naming, accettazione manuale e igiene repo. |
| `YAML/pipeline/` | Definizione unica della pipeline di render/check. |
| `Jinja/` | Scheletri Jinja2 per produrre Markdown statico pronto per Obsidian. |
| `Assets/` | Asset sorgente lunghi o opachi consumati dai renderer. |

## Contratto Source Of Truth

Il formato sorgente deve restare leggibile da una persona e abbastanza strutturato da generare artefatti diversi senza duplicazione. Quando una nuova feature riguarda entita, scelte guidate, cockpit, plugin o qualita, la fonte deve essere un modulo YAML e non una stringa dispersa in JS, Markdown o Jinja.

Il flusso architetturale da rispettare e:

1. `YAML/canonical/` dichiara entita, campi, tassonomie, profili, scelte e regole di validazione.
2. `YAML/json/` dichiara matrici runtime, cockpit, workflow e configurazioni plugin che diventano JSON piccoli in `z.automazioni/data/`.
3. `YAML/render/` dichiara superfici Markdown, template, hub, indici, fileClass e Bases da comporre con Jinja.
4. Jinja e le sue macro assemblano Markdown Obsidian: callout, tabs, Dataview, Meta Bind, fallback leggibile e wrapper Templater.
5. JS in `z.automazioni/` e `z.engine/` consuma frontmatter e JSON generati per eseguire scelte complesse dentro Obsidian, ad esempio creazione entita, preparazione sessione, cockpit e viste runtime.
6. I check Python verificano che YAML, JSON, Markdown generato, plugin e runtime restino allineati.

Un modulo YAML ben fatto deve quindi poter alimentare piu superfici: schema frontmatter, wizard di creazione, opzioni Meta Bind, pulsanti, viste Dataview, JSON runtime, template Jinja e gate di qualita. Se una feature richiede un nuovo campo, la modifica corretta e aggiungere il campo al contratto YAML e poi farlo emergere negli output derivati.

I plugin installati sono parte dell'architettura. Callout, Dataview, Meta Bind, Templater, Bases, Tasks, Calendar/Calendarium, Canvas, Excalidraw, Style Settings e gli altri plugin dichiarati vanno considerati disponibili finche un contratto non li classifica come opzionali o manutentivi. Ogni uso plugin deve essere dichiarato in YAML e verificabile: niente dipendenze implicite nascoste in template o script.

## Pipeline scheda meccanica PG

1. Modificare `YAML/canonical/srd_character_build.yaml` (core + opzioni personaggio).
2. `npm run sync:sources` → JSON locale ignorato in `z.automazioni/data/srd/`.
3. `z.automazioni/pg.js` legge i JSON e compone frontmatter (`caratteristiche`, `abilita`, `punti_ferita`, …).
4. Jinja usa `YAML/canonical/pg_mechanics_schema.yaml` come contesto di render e `Jinja/macros/pg_mechanics.j2` + `Jinja/partials/pg_scheda_meccanica.md.j2` per il tab **Scheda** nel blueprint `pg`.
5. `npm run render:templates` puo produrre anteprime locali ignorate da Git; `npm run generate:templates` materializza i template finali in `z.modelli` solo come output locale o release.

## Pipeline Prevista

1. Leggere ricorsivamente `YAML/**/*.yaml`.
2. Validare chiavi obbligatorie: `id`, `purpose`, `version`.
3. Comporre sezioni, callout, tab, input/pulsanti Meta Bind, blocchi Dataview e versioni Markdown leggibili.
4. Renderizzare template sorgente con Jinja2.
5. Verificare `z.fileclass/` e `z.bases/` dai moduli YAML; vengono materializzati solo in release, come `z.modelli`.
6. Eseguire `npm run check`.
7. Verificare in Obsidian con un collaudo visuale.

## Pipeline Evolutiva YAML -> Artefatti

Il modello da seguire e dichiarativo: un modulo YAML leggibile resta la fonte, mentre Jinja, JSON e runtime JS consumano artefatti derivati. In GDR la regola e stretta perche la release deve restare stabile dentro Obsidian.

La direzione ammessa e:

1. `YAML/**/*.yaml` dichiara contratti, opzioni, pulsanti, workflow o profili.
2. Uno script esplicito genera un artefatto piccolo e ricostruibile in `z.automazioni/data/`.
3. Jinja o JS leggono l'artefatto generato quando serve evitare duplicazione.
4. `npm run check` verifica che YAML e artefatto siano sincronizzati.
5. I JSON interni dei plugin Obsidian vengono generati solo per sottoinsiemi sicuri; altrimenti restano validati, non sovrascritti.

I casi attivi includono `YAML/json/workflows.yaml` → `z.automazioni/data/workflows/quick_actions.json`, `YAML/canonical/srd_character_build.yaml` → `z.automazioni/data/srd/*.json`, `YAML/render/bacheche.yaml` → `z.bacheche/*.md`, `YAML/render/resource_hub.yaml` → `Risorse/Risorse.md`, `YAML/render/resource_indexes.yaml` → indici semplici in `Risorse/*/*.md`, `YAML/render/resource_support_pages.yaml` → guide supporto in `Risorse/*.md` e i cockpit YAML in `YAML/json/` → `z.automazioni/data/runtime/*.json`. Sono output locali ignorati da Git.

`YAML/json/runtime_exports.yaml`, `YAML/json/runtime_render_contract.yaml` e `YAML/json/runtime_dataview_contract.yaml` sono contratti runtime, non generatori Markdown: dichiarano registry moduli, export pubblici `z.engine`, sorgenti Dataview simulate e scenari minimi di render verificati da `check:runtime-load` con fixture esterna. Il JSON `z.automazioni/data/runtime/runtime_exports.json` e generato da `check_runtime_load.js --render-runtime-data` durante `sync:sources`.

Non introdurre generatori opachi: ogni JSON prodotto deve indicare `generated_by`, `source` e `purpose`, e deve essere ricostruibile da un singolo comando npm.

## Comandi

```bash
npm run sync:sources
npm run check:source-pipeline
npm run check:templates
npm run check:workflow-data
npm run check:bacheche
npm run check:resource-hub
npm run check:resource-indexes
npm run check:metadata
npm run render:templates
npm run render:metadata
npm run generate:workflow-data
npm run render:bacheche
npm run render:resource-hub
npm run render:resource-indexes
npm run audit:templates
```

`sync:sources` e `check:source-pipeline` leggono `YAML/pipeline/source_pipeline.yaml`: e il punto unico per capire quali YAML/Jinja/codice utile generano gli output richiesti dal vault.

`render:bacheche` genera `z.bacheche/*.md` da `YAML/render/bacheche.yaml` e Jinja. Le bacheche sono superficie vault finale, non sorgente tracciato.

`render:resource-hub` genera `Risorse/Risorse.md`, catalogo centrale delle guide e dei materiali utente.

`render:resource-support` genera le guide supporto dichiarate in `YAML/render/resource_support_pages.yaml`, così il sorgente resta YAML/Jinja e le note finali non sono tracciate. Corpi lunghi o opachi, come dati Excalidraw compressi, devono stare in `Dev/Source/Assets/...` e essere collegati con `body_file`.

`render:resource-indexes` genera gli indici ripetitivi di risorse come Audio, Video, Immagini e Dispense. Le note di contenuto dentro quelle cartelle restano dell'utente o della release, non sorgente della repo.

`render:templates` scrive solo anteprime locali ignorate in `Dev/Build/template-previews/`. Non modifica `z.modelli`, `z.fileclass` o `z.bases`.

`render:obsidian-config` genera i JSON di configurazione Obsidian dichiarati in `YAML/json/obsidian_config.yaml`; i manifest dei plugin restano JSON nativi del plugin.

`check:obsidian-config` valida anche che bookmark e workspace puntino a file esistenti o output dichiarati in `source_pipeline.yaml`.

`check:plugin-bundles` valida che i plugin Obsidian siano dichiarati da YAML senza bundle terzi tracciati: niente `main.js`, `styles.css`, temi vendorizzati o stato locale in Git. I bundle locali ignorati restano ammessi per generare una ZIP dove l'utente deve solo accettare i plugin all'apertura.

`check:naming` blocca il ritorno di nomi di milestone nel codice attivo: gli alias storici restano solo in changelog/roadmap, mentre runtime e check devono usare nomi di dominio.

`render:metabind-config` assembla `.obsidian/plugins/obsidian-meta-bind-plugin/data.json` da tre YAML leggibili: impostazioni base, input e pulsanti.

`render:runtime-plugin-profile` genera il JSON runtime letto da `session_views.js` per troubleshooting plugin, fallback workflow e readiness. I dati derivano da `plugin_matrix.yaml`, `plugin_contracts.yaml`, `workflows.yaml` e dagli override minimi in `runtime_plugin_profile.yaml`.

`release:clean` materializza `SRD`, `z.modelli`, `z.bacheche`, `z.bases` e `z.fileclass` direttamente dentro `dist/vault-gdr-clean`: il repo sorgente non deve tracciare superfici Obsidian generate.

`prepare:manual-release-test` crea una release locale in `dist/vault-gdr-manual-test` e una checklist di feedback senza avviare Obsidian. I vecchi check live sono stati ridotti a questo percorso manuale.

`audit:templates` confronta anteprime locali e target dichiarati in `template_blueprints.yaml`; il report resta output locale ignorato.

`render:metadata` produce anteprime fileClass/Bases a partire da `frontmatter_profiles.yaml` e `bases_views.yaml`. `npm run sync:sources` usa il check in memoria; la materializzazione reale avviene in release.

## Regola Runtime

Jinja2 non deve essere richiesto all'utente finale. E uno strumento di sviluppo per generare file Markdown/Templater statici. Nel vault distribuito il runtime resta Obsidian con plugin installati.

Ogni template generato deve avere una sola funzione Templater iniziale, ad esempio:

```md
<% await tp.user.crea_entita(tp) %>
```

Il resto del file è Markdown statico generato da Jinja: tab, callout, input Meta Bind, pulsanti Meta Bind, Dataview/DataviewJS, blocchi plugin specifici e una versione Markdown leggibile senza plugin.

## Regola Generator

Gli script runtime in `z.automazioni/` devono restare sottili. Check, renderer, importer CLI e release script stanno in `Dev/Tools/`; i fixture dati stanno in YAML (`YAML/quality/importer_fixtures.yaml` o `Dev/Tests/fixtures/`):

- JS raccoglie input, sceglie file esistenti, calcola valori e collega note.
- `YAML/canonical/runtime_profiles.yaml` dichiara prompt, opzioni e default.
- `YAML/canonical/frontmatter_profiles.yaml` dichiara ordine, campi, default e integrazioni plugin del frontmatter.
- `YAML/canonical/entity_depth.yaml` dichiara quali famiglie fantasy devono esporre profondita lore, giocabilita, continuita, tabs e superfici plugin.
- `YAML/canonical/taxonomy_depth.yaml` dichiara la copertura tassonomica minima per categorie D&D 5.5 e worldbuilding profondo.
- `YAML/canonical/dnd55_options.yaml` dichiara opzioni e valori D&D 5.5 localizzati in italiano.
- `YAML/canonical/link_targets.yaml` dichiara i campi per wikilink granulari a note, sezioni e block id.
- `YAML/canonical/tag_rules.yaml` dichiara i tag italiani ammessi.
- Un generatore Templater non deve restituire blocchi `---` inline: deve usare `helpers.renderFrontmatter("profilo", valori)`.
- Gli importer CLI possono usare un renderer locale equivalente solo quando non girano dentro Obsidian, ma il profilo resta dichiarato in `frontmatter_profiles.yaml`.

`npm run check:templates` blocca nuovi generatori inline non dichiarati e verifica i generatori critici (`mappa`, `luogo`, `sessione`, `incontro`, `png`, `creatura`).

## Regola Plugin Surface

La logica di scheda deve vivere nei moduli YAML. I file Jinja possono comporre Markdown statico, ma non devono inventare nuovi controlli o superfici plugin senza contratto dichiarativo.

`npm run check:templates` blocca:

- `INPUT[...]` Meta Bind su campi non presenti in `fields_core.yaml`, `frontmatter_profiles.yaml` o nei campi plugin dichiarati;
- `INPUT[...]` Meta Bind con funzioni lasciati in forma inline invece che in un blocco `meta-bind`;
- `BUTTON[...]` non dichiarati in `metabind_buttons.yaml`;
- callout non dichiarati in `callouts.yaml`;
- chiamate `gdr.render...` non dichiarate in `dataview_blocks.yaml`;
- link a `z.bases/*.base` non dichiarati in `bases_views.yaml`.

La conseguenza pratica: YAML decide cosa esiste; Jinja assembla; JS esegue funzioni atomiche e viste riusabili. Se un DM/lore builder vuole cambiare comportamento, prima deve poter leggere il contratto in YAML.

## Regola Entity Depth

`entity_depth.yaml` e il contratto di profondita per famiglie fantasy. Per `luogo`, `fazione`, `missione`, `tracciato`, `incontro`, `creatura` e `oggetto` dichiara campi frontmatter, prompt runtime, sezioni, layout tabs e superfici plugin obbligatorie.

Il blocco `contracts.playability_gate` definisce la soglia minima per non creare schede enciclopediche morte: ogni famiglia deve esporre almeno tre gruppi tra tavolo, movimento, conseguenza e collegamento.

`npm run check:templates` blocca una famiglia se un campo non e catalogato, se il profilo frontmatter non lo espone, se manca un prompt runtime, se tabs/sezioni non esistono, se una superficie plugin richiesta non e dichiarata in `plugin_bindings.yaml` o se la famiglia non supera il gate di giocabilita.

## Regola Continuita D&D Nel Mondo

Creature, incontri, oggetti e ricompense non sono compendio isolato. Nel contratto dei template devono restare materiale narrativo collegato a luogo, fazione, missione, sessione e conseguenze.

La regola minima e:

- `incontro` dichiara luogo, missioni/fazioni/sessioni, creature, `encounter_creatures`, ricompense, uso al tavolo, prossima mossa, `entita_impattate` e `propaga_a`;
- `creatura` dichiara habitat o luoghi, fazioni/missioni/sessioni/connessioni, uso al tavolo, player-safe, prossima mossa e propagazione;
- `oggetto` dichiara luogo o proprietario, missioni/sessioni/connessioni, uso al tavolo, player-safe, prossima mossa e propagazione.

Le viste `renderDnd55MaterialPipeline` e `renderCombatReadiness` sono runtime di lettura: mostrano gap, non inventano schema. I campi devono arrivare prima da `frontmatter_profiles.yaml`, `runtime_profiles.yaml`, `sections.yaml`, `tabs.yaml`, `dataview_blocks.yaml`, `metabind_inputs.yaml` e `workflows.yaml`.

## Regola Taxonomy Depth

`taxonomy_depth.yaml` impedisce che SRD e worldbuilding restino materiale sparso. Le famiglie D&D 5.5 coprono opzioni giocatore, magia/regole e strumenti encounter; le famiglie worldbuilding coprono societa/economia, religione/cosmologia e storia/geografia/ecologia.

`npm run check:templates` blocca una categoria tassonomica se manca la cartella SRD sorgente dichiarata, se manca il profilo runtime/frontmatter, se un campo obbligatorio non e catalogato o se il profilo non lo espone.

`worldbuilding_depth_axes.yaml` raccoglie assi opzionali di profondita worldbuilding. Gli assi sono limitati a 3-5 per profilo e servono a generare domande o revisioni mirate; non sono campi obbligatori da aggiungere a ogni nota.

Il render finale valida anche i blocchi Tabs: ogni blocco ` ````tabs ` deve essere chiuso, contenere almeno una `tab:`, non avere testo prima della prima tab, non avere tab duplicate o vuote e non annidare altri blocchi Tabs a quattro backtick.

Lo smoke finale non ha piu un contratto di scenario sorgente: usa `runtime_render_contract.yaml`, `manual_acceptance.yaml`, `release_quality_contract.yaml` e `check:smoke` per verificare render, accettazione manuale e sicurezza giocatori senza mantenere contenuti dimostrativi in Git.

`release_boundary.yaml` dichiara cosa deve entrare o restare fuori dalla release utente: file richiesti, radici vietate, marker riservati/dev-only, plugin obbligatori e moduli runtime caricati dal bridge.

## Regola Italiano D&D 5.5

`dnd55_options.yaml` e la fonte per valori selezionabili e label visibili al DM. I valori utente devono essere in italiano; le chiavi tecniche possono restare compatibili con plugin e renderer quando necessario.

`npm run check:templates` blocca il vault se mancano gruppi obbligatori come scuole di magia, livelli incantesimo, taglie, tipi creatura, rarita, azioni, condizioni, CD, danni, classi, specie e background, oppure se i profili runtime puntano a gruppi inesistenti.

## Regola Link E Tag

`link_targets.yaml` definisce dove usare wikilink precisi nel frontmatter: `fonti`, `riferimenti_srd`, `riferimenti_regola`, `sezioni_collegate`, `blocchi_collegati` e `tabelle_collegate`.

`tag_rules.yaml` limita i tag a un vocabolario italiano e semplice. La tassonomia primaria resta `categoria`, `tipo` e `stato`; i tag sono marcatori trasversali opzionali.

`npm run check:templates` valida i contratti YAML, mentre `npm run check` blocca tag non ammessi e link granulari malformati nelle note reali.

## Moduli

| Modulo | Responsabilita |
| --- | --- |
| `fields_core.yaml` | Campi condivisi e contratti YAML. |
| `plugin_bindings.yaml` | Responsabilita plugin e confini runtime. |
| `template_blueprints.yaml` | Blueprint template e output attesi. |
| `sections.yaml` | Sezioni riusabili del corpo template. |
| `callouts.yaml` | Vocabolario callout GDR. |
| `tabs.yaml` | Layout tabs con fallback. |
| `dataview_blocks.yaml` | Blocchi Dataview/DataviewJS riusabili. |
| `metabind_inputs.yaml` | Input Meta Bind canonici. |
| `metabind_buttons.yaml` | Pulsanti Meta Bind canonici. |
| `metabind_config.yaml` | Configurazione completa Meta Bind da cui viene generato `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`. |
| `source_pipeline.yaml` | Pipeline unica e contratto dei file MD/JSON generati da YAML/Jinja e verificati dai check. |
| `bases_views.yaml` | Contratti per viste `.base`. |
| `frontmatter_profiles.yaml` | Ordine, default e chiavi del frontmatter generato dagli script. |
| `runtime_profiles.yaml` | Prompt, opzioni e default usati dagli script Templater sottili. |
| `entity_depth.yaml` | Contratti di profondita per famiglie fantasy governate da YAML. |
| `taxonomy_depth.yaml` | Copertura minima verificata per categorie D&D 5.5 e worldbuilding. |
| `dnd55_options.yaml` | Valori D&D 5.5 localizzati in italiano per creazione homebrew. |
| `link_targets.yaml` | Campi per wikilink granulari a note, sezioni e block id. |
| `tag_rules.yaml` | Tag italiani ammessi e regole d'uso. |

`frontmatter_profiles.yaml` distingue campi core, campi di dominio e campi legati a plugin come Calendarium o Maps. `check:templates` renderizza un campione per ogni profilo e verifica che il frontmatter risultante sia YAML valido.

Le sezioni `integrations` di `frontmatter_profiles.yaml` sono il contratto leggibile per fileClass e Bases: dichiarano target, campi minimi e superfici da mantenere. `check:metadata` verifica che le anteprime generate da quel contratto siano aggiornate.
