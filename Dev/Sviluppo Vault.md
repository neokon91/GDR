# Sviluppo Vault

Questa nota e l'indice tecnico di manutenzione. Non deve duplicare i contratti YAML: quando una regola diventa stabile, vive in `Dev/Source/YAML/` e viene verificata dai check.

Se c'e conflitto, prevalgono YAML, renderer e check. La documentazione storica non e sorgente operativo.

## Confine

- `README.md`: guida utente, non manuale tecnico.
- [[Dev/README]]: indice della documentazione di sviluppo.
- [[Dev/RELEASE]]: procedura release.
- [[Dev/Smoke 1.0 Professionale]]: checklist manuale minima.
- [[Risorse/Guida DM]]: flusso operativo per il DM, generato e non tecnico.
- Questa nota: regole minime per non rompere pipeline, runtime, plugin layer e release.

## Linea Architetturale

La source of truth umana e dichiarativa:

- YAML dichiara contratti, profili, workflow, plugin, campi, tassonomie e release.
- `Dev/Source/YAML/canonical/` contiene il dominio sorgente stabile.
- `Dev/Source/YAML/json/` contiene YAML che genera JSON runtime o configurazioni plugin.
- `Dev/Source/YAML/render/` contiene YAML che genera Markdown, template e superfici Obsidian.
- `Dev/Source/YAML/quality/` contiene contratti di check, release e igiene repo.
- `Dev/Source/Jinja/` genera Markdown statico richiesto dal vault.
- Python in `Dev/Tools/python/` e il tooling di sviluppo primario.
- JS in `z.automazioni/` e `z.engine/` contiene runtime Obsidian e automazioni reali.
- JS in `Dev/Tools/node-legacy/` e tooling storico isolato, da non usare come modello per nuovo sviluppo salvo necessita.
- Markdown finale, JSON runtime, fileClass, Bases, template e bacheche sono output generati quando dichiarati in `source_pipeline.yaml`.

Non aggiungere logica lunga dentro note utente, template Markdown o blocchi DataviewJS. Se una vista cresce, spostarla in `z.engine/` e lasciare nella superficie solo il richiamo operativo.

## Contratti Da Modificare

| Ambito | Fonte |
| --- | --- |
| Campi canonici | `Dev/Source/YAML/canonical/fields_core.yaml` |
| Modello categorie | `Dev/Source/YAML/canonical/entity_model.yaml` |
| Campi minimi e giocabilita | `Dev/Source/YAML/canonical/validation_contract.yaml` |
| Profili frontmatter e fileClass | `Dev/Source/YAML/canonical/frontmatter_profiles.yaml` |
| Tassonomie profonde SRD/D&D e mondo | `Dev/Source/YAML/canonical/taxonomy_depth.yaml` |
| Template Markdown | `Dev/Source/YAML/render/template_blueprints.yaml` e `Dev/Source/Jinja/` |
| Workflow e azioni rapide | `Dev/Source/YAML/json/workflows.yaml` |
| Plugin e binding | `Dev/Source/YAML/json/plugin_matrix.yaml`, `Dev/Source/YAML/canonical/plugin_contracts.yaml`, `Dev/Source/YAML/canonical/plugin_bindings.yaml` |
| Config Obsidian | `Dev/Source/YAML/json/obsidian_config.yaml`, `Dev/Source/YAML/json/metabind_config.yaml`, `Dev/Source/YAML/json/metabind_inputs.yaml`, `Dev/Source/YAML/json/metabind_buttons.yaml` |
| Release e confini ZIP | `Dev/Source/YAML/quality/release_boundary.yaml`, `Dev/Source/YAML/quality/release_quality_contract.yaml` |
| Pipeline generazione/check | `Dev/Source/YAML/pipeline/source_pipeline.yaml` |

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

I router devono presentare scelte comprensibili al DM, non nomi di file. La logica runtime caricata da Templater sta in `z.automazioni/*.js`; il nuovo tooling di sviluppo sta in `Dev/Tools/python/`. I wrapper Templater sono generati e i template finali stanno fuori dal sorgente tracciato.

Regole operative:

- chiedere `mondo` prima delle altre connessioni quando possibile;
- scrivere connessioni nel frontmatter al momento della creazione;
- chiedere collegamenti minimi coerenti con `validation_contract.yaml`;
- mantenere brevi i campi lore opzionali;
- non modificare automaticamente note esistenti per creare backlink reciproci, salvo richiesta esplicita dell'utente.

Le note di porting private non sono documentazione stabile del repository: ogni promozione passa da YAML, renderer e check.

## Plugin Layer Interno

Il vault usa un layer interno sopra Meta Bind, Templater, JS Engine e Metadata Menu. Non e un plugin Obsidian separato: e un contratto di file e configurazioni verificato da `npm run check`.

- I bundle plugin/temi Obsidian non sono sorgente tracciato; `obsidian_plugin_bundle_contract.yaml` e `check:plugin-bundles` bloccano `main.js`, `styles.css`, temi vendorizzati e configurazioni plugin tracciate per errore. I bundle locali ignorati possono essere copiati nella release finale, così l'utente li accetta all'apertura.
- Meta Bind: input e pulsanti da YAML, configurazione JSON generata.
- Templater: wrapper funzione generati in `z.automazioni/templater`.
- JS Engine: viste riusabili in `z.engine/`.
- Metadata Menu: preset e fileClass generati dai profili frontmatter.
- `z.bacheche`: bacheche Kanban per preparazione e creature, generate da `Dev/Source/YAML/render/bacheche.yaml`.
- Tooling repo: check, render, import, release e fixture tecniche vivono in `Dev/Tools/`, non nel runtime Obsidian.

Non modificare a mano JSON generati, fileClass, Bases, template o bacheche. Cambia il contratto YAML o il renderer, poi rigenera.

Per le pagine di supporto, non inserire blob opachi direttamente in `resource_support_pages.yaml`: usa `body_file` verso `Dev/Source/Assets/...` quando il contenuto e lungo, compresso o non revisionabile come YAML.

## Runtime

`z.engine/session_views.js` resta il bridge pubblico per le chiamate DataviewJS esistenti. Le famiglie gia estratte vivono in moduli dedicati (`session_maps.js`, `session_dnd.js`, `session_player.js`, cockpit e runtime sessione).

Gli export pubblici e la registry dei moduli runtime sono dichiarati in `Dev/Source/YAML/json/runtime_exports.yaml`; il bridge legge il JSON generato `z.automazioni/data/runtime/runtime_exports.json`. Gli scenari minimi di render sono in `Dev/Source/YAML/json/runtime_render_contract.yaml`; le sorgenti Dataview simulate sono in `Dev/Source/YAML/json/runtime_dataview_contract.yaml`. `session_views.js` pubblica automaticamente gli export `render*`; `check:runtime-load` usa manifest e fixture `Dev/Tests/fixtures/runtime_fixture_pages.json` per impedire drift.

Il troubleshooting plugin runtime passa da `Dev/Source/YAML/json/runtime_plugin_profile.yaml` e dal JSON generato `z.automazioni/data/runtime/plugin_profile.json`: non aggiungere dizionari statici di plugin, sintomi o fallback dentro `session_views.js`.

La continuita narrativa passa da `z.automazioni/continuity_event_model.js`: gli script operativi devono creare eventi con sorgente, causa, conseguenza, bersagli, stato e visibilita, poi applicarli tramite il reducer/adattatore di `continuity_state.js`. I nomi runtime/check devono restare nomi di dominio; `check:naming` blocca il ritorno di alias di milestone nel codice attivo.

Regole di migrazione:

- mantenere export e bridge compatibili;
- aggiungere check runtime quando nasce una funzione pubblica;
- non spostare path usati da Meta Bind, Templater, renderer o release senza `npm run check`;
- non far crescere `session_views.js` se una nuova famiglia puo stare in un modulo dedicato.
- le azioni Meta Bind che mutano frontmatter devono avere copertura in `npm run check:meta-actions` quando toccano continuita, propagazione o player safety.
- le modifiche al modello eventi di continuita devono passare da `npm run check:continuity-events` e non solo da fixture end-to-end.

## SRD E D&D

Il profilo meccanico principale e D&D 5.5-compatible con SRD separato, ma il Codex del mondo resta separato dal regolamento.

`SRD/` non e sorgente tracciato. La release pulita lo materializza tramite `Dev/Tools/node-legacy/import_srd.js`; per una copia locale usare `npm run import:srd`, lasciando l'output ignorato da Git.

La scheda meccanica PG segue questa catena:

`Dev/Source/YAML/canonical/srd_character_build.yaml` -> `npm run sync:sources` -> `z.automazioni/data/srd/*.json` -> `z.automazioni/pg_mechanics.js` -> `z.automazioni/pg.js` -> frontmatter strutturato -> Jinja della scheda PG.

Non hardcodare nuove opzioni PG nello script: aggiungerle al modulo YAML e verificare con `npm run check:srd-character-data` e `npm run check:pg-mechanics`.

## Check E Release

Comandi principali:

```bash
npm ci
python -m pip install -r requirements-dev.txt
npm run sync:sources
npm run check
npm run release:clean
```

`npm ci` e `requirements-dev.txt` mantengono la toolchain di sviluppo riproducibile. `npm run sync:sources` materializza output ignorati necessari ai check locali e alla CI. `npm run check` valida pipeline, plugin, runtime, workflow, azioni Meta Bind, regole PG, release, import, repo hygiene e sintassi JS. `npm run release:clean` crea la copia consegnabile.

`obsidian_config.yaml` non puo puntare a bookmark, workspace o file statici mancanti: `render_obsidian_config.py --check` accetta solo path esistenti o output dichiarati in `source_pipeline.yaml`.

L'import SRD deve restare pinnato a un commit sorgente, non a un branch remoto mobile. `check:importers` blocca regressioni verso `main` o `master`.

Il confine release non va verificato solo con presenza/assenza di file puntuali: `npm run check:release-boundary` genera una release temporanea e controlla copy policy, esclusioni dev, marker vietati, bridge runtime e dipendenze JS locali.

Dopo un check locale, gli output generati possono essere rimossi con `npm run clean:repo` o con una pulizia degli ignored, senza tracciarli.
