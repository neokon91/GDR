# Sviluppo Vault

Questa nota e l'indice tecnico di manutenzione. Non deve duplicare i contratti YAML: quando una regola diventa stabile, vive in `Dev/TemplateFactory/modules/` e viene verificata dai check.

La direzione prodotto e UX operativa attiva sta in [[Dev/Roadmap/1.0 Professionale]]. Se c'e conflitto, prevalgono roadmap attiva, YAML e check.

## Confine

- `README.md`: guida utente, non manuale tecnico.
- [[Dev/Repository]]: mappa repo, cartelle e comandi.
- [[Dev/README]]: indice della documentazione di sviluppo.
- [[Dev/Indice Connettore GPT]]: indice sintetico per code search, con `is_code_search_indexed: true`.
- [[Risorse/Guida DM]]: flusso operativo per il DM, generato e non tecnico.
- Questa nota: regole minime per non rompere pipeline, runtime, plugin layer e release.

## Linea Architetturale

La source of truth umana e dichiarativa:

- YAML dichiara contratti, profili, workflow, plugin, campi, tassonomie e release.
- Jinja/TemplateFactory genera Markdown statico richiesto dal vault.
- JS contiene runtime, check, import, release e automazioni reali.
- Markdown finale, JSON runtime, fileClass, Bases, template e bacheche sono output generati quando dichiarati in `source_pipeline.yaml`.

Non aggiungere logica lunga dentro note utente, template Markdown o blocchi DataviewJS. Se una vista cresce, spostarla in `z.engine/` e lasciare nella superficie solo il richiamo operativo.

## Contratti Da Modificare

| Ambito | Fonte |
| --- | --- |
| Campi canonici | `fields_core.yaml` |
| Modello categorie | `entity_model.yaml` |
| Campi minimi e giocabilita | `validation_contract.yaml` |
| Profili frontmatter e fileClass | `frontmatter_profiles.yaml` |
| Tassonomie profonde SRD/D&D e mondo | `taxonomy_depth.yaml` |
| Template Markdown | `template_blueprints.yaml` e `Dev/TemplateFactory/jinja/` |
| Workflow e azioni rapide | `workflows.yaml` |
| Plugin e binding | `plugin_matrix.yaml`, `plugin_contracts.yaml`, `plugin_bindings.yaml` |
| Config Obsidian | `obsidian_config.yaml`, `metabind_config.yaml`, `metabind_inputs.yaml`, `metabind_buttons.yaml` |
| Release e confini ZIP | `release_boundary.yaml`, `release_quality_contract.yaml` |
| Pipeline generazione/check | `source_pipeline.yaml` |

Regola: se modifichi uno di questi contratti, esegui `npm run sync:sources` prima di `npm run check`.

## Campi E Stati

Non mantenere liste manuali in questa nota. I campi validi, stati ammessi, tipi per categoria, campi obbligatori e gate di giocabilita sono in `fields_core.yaml`, `entity_model.yaml` e `validation_contract.yaml`.

I concetti da preservare sono pochi:

- `categoria`, `tipo`, `stato`, `mondo` sono il nucleo di indicizzazione.
- `uso_al_tavolo`, `gancio`, `scelta`, `posta`, `pressione`, `prossima_mossa`, `conseguenze`, `connessioni` decidono se una nota e giocabile.
- `player_safe`, `segreti`, `segreto`, `verita_nascosta` separano superficie giocatori e materiale DM.
- `entita_impattate`, `propaga_a`, `applicata_a`, `propagato_da`, `aggiornamenti_richiesti`, `propagazione_stato`, `ultima_propagazione` sono il contratto di continuita.
- `fonti`, `riferimenti_srd`, `riferimenti_regola`, `sezioni_collegate`, `blocchi_collegati`, `tabelle_collegate` gestiscono riferimenti precisi.

Tag e link granulari sono governati da `tag_rules.yaml` e `link_targets.yaml`; non usare tag per sostituire frontmatter e wikilink strutturati.

## Creazione Guidata

I router devono presentare scelte comprensibili al DM, non nomi di file. La logica sta in `z.automazioni/*.js`, i wrapper Templater sono generati e i template finali stanno fuori dal sorgente tracciato.

Regole operative:

- chiedere `mondo` prima delle altre connessioni quando possibile;
- scrivere connessioni nel frontmatter al momento della creazione;
- chiedere collegamenti minimi coerenti con `validation_contract.yaml`;
- mantenere brevi i campi lore opzionali;
- non modificare automaticamente note esistenti per creare backlink reciproci, salvo richiesta esplicita dell'utente.

Le note di porting private non sono documentazione stabile del repository: ogni promozione passa da YAML, renderer e check.

## Plugin Layer Interno

Il vault usa un layer interno sopra Meta Bind, Templater, JS Engine e Metadata Menu. Non e un plugin Obsidian separato: e un contratto di file e configurazioni verificato da `npm run check`.

- Meta Bind: input e pulsanti da YAML, configurazione JSON generata.
- Templater: wrapper funzione generati in `z.automazioni/templater`.
- JS Engine: viste riusabili in `z.engine/`.
- Metadata Menu: preset e fileClass generati dai profili frontmatter.
- `z.bacheche`: bacheche Kanban per preparazione e creature, generate da `Dev/TemplateFactory/modules/bacheche.yaml`.

Non modificare a mano JSON generati, fileClass, Bases, template o bacheche. Cambia il contratto YAML o il renderer, poi rigenera.

## Runtime

`z.engine/session_views.js` resta il bridge pubblico per le chiamate DataviewJS esistenti. Le famiglie gia estratte vivono in moduli dedicati (`session_maps.js`, `session_dnd.js`, `session_player.js`, cockpit e runtime sessione).

Regole di migrazione:

- mantenere export e bridge compatibili;
- aggiungere check runtime quando nasce una funzione pubblica;
- non spostare path usati da Meta Bind, Templater, TemplateFactory o release senza `npm run check`;
- non far crescere `session_views.js` se una nuova famiglia puo stare in un modulo dedicato.

## SRD E D&D

Il profilo regolamentare principale e D&D 5.5/SRD, ma il Codex del mondo resta separato dal regolamento.

`SRD/` non e sorgente tracciato. La release pulita lo materializza tramite `z.automazioni/import_srd.js`; per una copia locale usare `npm run import:srd`, lasciando l'output ignorato da Git.

La scheda meccanica PG segue questa catena:

`srd_character_build.yaml` -> `npm run sync:sources` -> `z.automazioni/data/srd/*.json` -> `z.automazioni/pg.js` -> frontmatter strutturato -> Jinja della scheda PG.

Non hardcodare nuove opzioni PG nello script: aggiungerle al modulo YAML e verificare con `npm run check:srd-character-data`.

## Check E Release

Comandi principali:

```bash
npm run sync:sources
npm run check
npm run release:clean
npm run release:demo
```

`npm run sync:sources` materializza output ignorati necessari ai check locali e alla CI. `npm run check` valida pipeline, plugin, runtime, workflow, release, demo, import, repo hygiene e sintassi JS. `npm run release:clean` crea la copia consegnabile; `npm run release:demo` aggiunge la demo generata.

Dopo un check locale, gli output generati possono essere rimossi con `npm run clean:repo` o con una pulizia degli ignored, senza tracciarli.
