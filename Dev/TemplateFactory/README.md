# Template Factory

Prima infrastruttura per generare template Obsidian a partire da moduli YAML e renderer Jinja2.

## Obiettivo

Centralizzare definizioni ripetute: frontmatter, campi Meta Bind, router Templater, Dataview, Bases, Tasks, Calendarium, mappe, schede creatura, incontri e versioni Markdown leggibili senza plugin.

La generazione deve servire il profilo principale D&D 5.5/SRD senza legare il Codex del mondo al regolamento: i template regolamentari espongono campi utili a creature, incontri, oggetti e party; le entita di mondo restano giocabili anche quando non contengono statistiche.

## Architettura

| Cartella | Uso |
| --- | --- |
| `modules/` | Moduli YAML dichiarativi. Non contengono runtime utente. |
| `jinja/` | Scheletri Jinja2 per produrre Markdown statico pronto per Obsidian. |
| `examples/` | Output o casi di prova manuali. |

## Pipeline scheda meccanica PG

1. Modificare `modules/srd_character_build.yaml` (core + opzioni personaggio).
2. `npm run import:srd-data` → JSON in `z.automazioni/data/srd/`.
3. `z.automazioni/pg.js` legge i JSON e compone frontmatter (`caratteristiche`, `abilita`, `punti_ferita`, …).
4. Jinja usa `pg_mechanics_schema.yaml` come contesto di render e `jinja/macros/pg_mechanics.j2` + `jinja/partials/pg_scheda_meccanica.md.j2` per il tab **Scheda** nel blueprint `pg`.
5. `npm run render:templates` puo produrre anteprime locali ignorate da Git; `npm run generate:templates` materializza i template finali in `z.modelli`.

## Pipeline Prevista

1. Leggere `modules/*.yaml`.
2. Validare chiavi obbligatorie: `id`, `purpose`, `version`.
3. Comporre sezioni, callout, tab, input/pulsanti Meta Bind, blocchi Dataview e versioni Markdown leggibili.
4. Renderizzare template sorgente con Jinja2.
5. Scrivere in `z.modelli/`, `z.fileclass/` o `z.bases/` solo dopo review.
6. Eseguire `npm run check`.
7. Verificare in Obsidian con un collaudo visuale.

## Pipeline Evolutiva YAML -> Artefatti

Il modello da seguire e quello gia sperimentato in FantasyWorld: un modulo YAML leggibile resta la fonte, mentre Jinja, JSON e runtime JS consumano artefatti derivati. In GDR la regola e piu stretta perche la release deve restare stabile dentro Obsidian.

La direzione ammessa e:

1. `modules/*.yaml` dichiara contratti, opzioni, pulsanti, workflow o profili.
2. Uno script esplicito genera un artefatto piccolo e versionabile in `z.automazioni/data/`.
3. Jinja o JS leggono l'artefatto generato quando serve evitare duplicazione.
4. `npm run check` verifica che YAML e artefatto siano sincronizzati.
5. I JSON interni dei plugin Obsidian vengono generati solo per sottoinsiemi sicuri; altrimenti restano validati, non sovrascritti.

Primo caso attivo: `workflows.yaml` genera `z.automazioni/data/workflows/quick_actions.json` con `npm run generate:workflow-data`; `npm run check:workflow-data` fallisce se il JSON non e aggiornato.

Non introdurre generatori opachi: ogni JSON prodotto deve indicare `generated_by`, `source` e `purpose`, e deve essere ricostruibile da un singolo comando npm.

## Comandi

```bash
npm run check:templates
npm run check:workflow-data
npm run check:metadata
npm run render:templates
npm run render:metadata
npm run generate:workflow-data
npm run audit:templates
```

`render:templates` scrive solo anteprime locali ignorate in `Dev/TemplateFactory/examples/generated/`. Non modifica `z.modelli`, `z.fileclass` o `z.bases`.

`audit:templates` confronta anteprime locali e target dichiarati in `template_blueprints.yaml`; il report resta output locale ignorato.

`render:metadata` produce anteprime fileClass/Bases a partire da `frontmatter_profiles.yaml`. Non modifica `z.fileclass` o `z.bases`: rende leggibile il contratto YAML e permette review/diff prima di materializzare modifiche.

## Regola Runtime

Jinja2 non deve essere richiesto all'utente finale. E uno strumento di sviluppo per generare file Markdown/Templater statici. Nel vault distribuito il runtime resta Obsidian con plugin installati.

Ogni template generato deve avere una sola funzione Templater iniziale, ad esempio:

```md
<% await tp.user.crea_entita(tp) %>
```

Il resto del file è Markdown statico generato da Jinja: tab, callout, input Meta Bind, pulsanti Meta Bind, Dataview/DataviewJS, blocchi plugin specifici e una versione Markdown leggibile senza plugin.

## Regola Generator

Gli script in `z.automazioni/` devono restare sottili:

- JS raccoglie input, sceglie file esistenti, calcola valori e collega note.
- `runtime_profiles.yaml` dichiara prompt, opzioni e default.
- `frontmatter_profiles.yaml` dichiara ordine, campi, default e integrazioni plugin del frontmatter.
- `entity_depth.yaml` dichiara quali famiglie fantasy devono esporre profondita lore, giocabilita, continuita, tabs e superfici plugin.
- `taxonomy_depth.yaml` dichiara la copertura tassonomica minima per categorie D&D 5.5 e worldbuilding profondo.
- `dnd55_options.yaml` dichiara opzioni e valori D&D 5.5 localizzati in italiano.
- `link_targets.yaml` dichiara i campi per wikilink granulari a note, sezioni e block id.
- `tag_rules.yaml` dichiara i tag italiani ammessi.
- Un generatore Templater non deve restituire blocchi `---` inline: deve usare `helpers.renderFrontmatter("profilo", valori)`.
- Gli importer CLI possono usare un renderer locale equivalente solo quando non girano dentro Obsidian, ma il profilo resta dichiarato in `frontmatter_profiles.yaml`.

`npm run check:templates` blocca nuovi generatori inline non dichiarati e verifica i generatori critici post-M4 (`mappa`, `luogo`, `sessione`, `incontro`, `png`, `creatura`).

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

## Regola M11 D&D Nel Mondo

Creature, incontri, oggetti e ricompense non sono compendio isolato. Nel contratto TemplateFactory devono restare materiale narrativo collegato a luogo, fazione, missione, sessione e conseguenze.

La regola minima e:

- `incontro` dichiara luogo, missioni/fazioni/sessioni, creature, `encounter_creatures`, ricompense, uso al tavolo, prossima mossa, `entita_impattate` e `propaga_a`;
- `creatura` dichiara habitat o luoghi, fazioni/missioni/sessioni/connessioni, uso al tavolo, player-safe, prossima mossa e propagazione;
- `oggetto` dichiara luogo o proprietario, missioni/sessioni/connessioni, uso al tavolo, player-safe, prossima mossa e propagazione.

Le viste `renderDnd55MaterialPipeline` e `renderCombatReadiness` sono runtime di lettura: mostrano gap, non inventano schema. I campi devono arrivare prima da `frontmatter_profiles.yaml`, `runtime_profiles.yaml`, `sections.yaml`, `tabs.yaml`, `dataview_blocks.yaml`, `metabind_inputs.yaml` e `workflows.yaml`.

## Regola Taxonomy Depth

`taxonomy_depth.yaml` impedisce che SRD e worldbuilding restino materiale sparso. Le famiglie D&D 5.5 coprono opzioni giocatore, magia/regole e strumenti encounter; le famiglie worldbuilding coprono societa/economia, religione/cosmologia e storia/geografia/ecologia.

`npm run check:templates` blocca una categoria tassonomica se manca la cartella SRD sorgente dichiarata, se manca il profilo runtime/frontmatter, se un campo obbligatorio non e catalogato o se il profilo non lo espone.

`worldbuilding_depth_axes.yaml` raccoglie il primo porting selettivo degli assi tematici FantasyWorld. Gli assi sono opzionali, limitati a 3-5 per profilo e servono a generare domande o revisioni mirate; non sono campi obbligatori da aggiungere a ogni nota.

Il render finale valida anche i blocchi Tabs: ogni blocco ` ````tabs ` deve essere chiuso, contenere almeno una `tab:`, non avere testo prima della prima tab, non avere tab duplicate o vuote e non annidare altri blocchi Tabs a quattro backtick.

`demo_contract.yaml` definisce la demo finale come contratto di codice: generatori ammessi, sorgenti demo vietate, gate richiesti e scenario minimo. Il controllo dedicato e `npm run check:demo-contract`.

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
| `generated_artifacts.yaml` | Contratto dei file MD/JSON generati da YAML/Jinja e verificati dai check. |
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
