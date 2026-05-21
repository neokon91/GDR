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

## Pipeline Prevista

1. Leggere `modules/*.yaml`.
2. Validare chiavi obbligatorie: `id`, `purpose`, `version`.
3. Comporre sezioni, callout, tab, input/pulsanti Meta Bind, blocchi Dataview e versioni Markdown leggibili.
4. Renderizzare template sorgente con Jinja2.
5. Scrivere in `z.modelli/`, `z.fileclass/` o `z.bases/` solo dopo review.
6. Eseguire `npm run check`.
7. Verificare in Obsidian con un collaudo visuale.

## Comandi

```bash
npm run check:templates
npm run check:metadata
npm run render:templates
npm run render:metadata
npm run audit:templates
```

`render:templates` scrive solo anteprime in `Dev/TemplateFactory/examples/generated/`. Non modifica `z.modelli`, `z.fileclass` o `z.bases`.

`audit:templates` confronta le anteprime con i target dichiarati in `template_blueprints.yaml` e scrive `Dev/TemplateFactory/examples/generated/migration_audit.md`.

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

`entity_depth.yaml` e il contratto di profondita per famiglie fantasy. Per `luogo`, `fazione`, `missione` e `tracciato` dichiara campi frontmatter, prompt runtime, sezioni, layout tabs e superfici plugin obbligatorie.

`npm run check:templates` blocca una famiglia se un campo non e catalogato, se il profilo frontmatter non lo espone, se manca un prompt runtime, se tabs/sezioni non esistono o se una superficie plugin richiesta non e dichiarata in `plugin_bindings.yaml`.

## Regola Taxonomy Depth

`taxonomy_depth.yaml` impedisce che SRD e worldbuilding restino materiale sparso. Le famiglie D&D 5.5 coprono opzioni giocatore, magia/regole e strumenti encounter; le famiglie worldbuilding coprono societa/economia, religione/cosmologia e storia/geografia/ecologia.

`npm run check:templates` blocca una categoria tassonomica se manca la cartella SRD sorgente dichiarata, se manca il profilo runtime/frontmatter, se un campo obbligatorio non e catalogato o se il profilo non lo espone.

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
