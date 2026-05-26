# z.automazioni

Script usati da Templater, dashboard e manutenzione del vault.

## Script CLI

| File | Uso |
| --- | --- |
| `check_vault.js` | Smoke test locale della struttura del vault, del plugin layer interno e degli script JS. |
| `check_template_factory.py` | Valida moduli YAML, blueprint e rendering Jinja in memoria. |
| `check_smoke.js` | Valida il gate statico della demo finale e del player-safe prima dello smoke visuale. |
| `check_release.js` | Valida versione, changelog e verifica automatica della release pulita. |
| `check_obsidian_user_acceptance.js` | Harness live: apre una release stabile in Obsidian con profilo persistente, verifica pagine first-run, workflow Nuovo Mondo, ciclo sessione/post-sessione e persistenza. `check:obsidian-first-run` e l'unico comando che resetta profilo e accetta prompt. |
| `run_source_pipeline.py` | Esegue la pipeline unica dichiarata in `source_pipeline.yaml`. |
| `render_template_factory.py` | Renderizza anteprime locali ignorate o materializza template finali in `z.modelli` dentro output locali/release. |
| `render_obsidian_config.py` | Genera i JSON di configurazione Obsidian da `obsidian_config.yaml`. |
| `render_plugin_matrix.py` | Genera `Dev/plugin_matrix.json` da `plugin_matrix.yaml`. |
| `render_templater_wrappers.py` | Genera i wrapper `z.automazioni/templater/*.js` da `templater_wrappers.yaml`. |
| `generate_workflow_data.js` | Genera JSON workflow da `workflows.yaml` e verifica che resti sincronizzato. |
| `check_workflow_quick_actions.js` | Verifica che le pagine operative espongano i pulsanti rapidi dichiarati in YAML. |
| `render_workflow_quick_actions.js` | Renderizza nelle pagine operative blocchi Markdown statici derivati dalle azioni rapide YAML. |
| `audit_template_migration.py` | Confronta preview locali TemplateFactory e template reali, generando un report locale ignorato. |
| `check_js.js` | Controllo sintattico ricorsivo degli script in `z.automazioni/` e `z.engine/`. |
| `repo_hygiene.js` | Controllo repository: artefatti locali, note di prova residue e script npm essenziali. |
| `import_srd.js` | Rigenera il riferimento SRD in `SRD/`. |
| `import_azgaar_geojson.js` | Importa mappe Azgaar come bozze operative. |
| `import_watabou_city.js` | Importa JSON Watabou City come luogo + mappa bozza. |
| `import_watabou_dungeon.js` | Importa JSON Watabou One Page Dungeon come luogo dungeon bozza. |
| `release_clean.js` | Crea una copia consegnabile del vault. |

## Helper Condivisi

| File | Uso |
| --- | --- |
| `helpers.js` | Funzioni comuni per template Templater. |
| `session_context.js` | Compatibilita legacy per viste dashboard gia referenziate dai template esistenti. Le nuove viste devono passare da `z.engine/session_views.js`. |
| `meta_actions.js` | Libreria azioni Meta Bind: canone, rumor, archiviazione, conseguenze, clock, sessione attiva, propagazione e recap pubblico. |
| `wizard_layer.js` | Wizard centralizzati: nuova entita viva, appunto live, conseguenza, fine sessione e sessione da output precedente. |
| `template_router.js` | Router Templater sottili: sostituisce blocchi `<%* ... %>` nei router con una sola entry `tp.user.template_router`. |

## Runtime Di Vista

| File | Uso |
| --- | --- |
| `z.engine/session_views.js` | Entry point per DataviewJS in template, hub e dashboard. |
| `z.engine/gdr_views.js` | Componenti di vista piccoli e riusabili. |

## Script Di Creazione

Gli altri file `.js` corrispondono ai template generati in `z.modelli/`. I wrapper in `z.automazioni/templater/` sono generati da YAML e non vanno editati a mano.

Esempio: `z.modelli/dm/Sessione.md` usa `tp.user.sessione`, quindi lo script deve restare `sessione.js`.

## Manutenzione Del Layer Interno

- Se aggiungi un pulsante operativo, modifica `Dev/TemplateFactory/modules/metabind_config.yaml`, genera `.obsidian/plugins/obsidian-meta-bind-plugin/data.json` con `npm run render:metabind-config` e aggiungi l'id a `REQUIRED_META_BIND_BUTTONS` solo se diventa obbligatorio per il layer.
- Se aggiungi un input template globale, aggiorna `REQUIRED_META_BIND_INPUT_TEMPLATES`.
- Se aggiungi un preset Metadata Menu, aggiorna `REQUIRED_METADATA_MENU_PRESETS`.
- Se aggiungi un file essenziale al layer, aggiorna `REQUIRED_LAYER_FILES`.
- Mantieni le azioni distruttive o di propagazione in `meta_actions.js`, non nei singoli template.
- Mantieni rendering e feedback DataviewJS in `z.engine/`; `z.automazioni/session_context.js` resta ponte legacy fino alla migrazione completa.
- I router in `z.modelli/*Router.md` devono avere una sola chiamata Templater iniziale.

## Controllo

Dal root della repo:

```bash
npm run check
npm run check:templates
npm run check:workflow-data
npm run check:workflow-actions
npm run check:workflow-render
npm run check:obsidian-user
npm run check:obsidian-first-run
npm run generate:workflow-data
npm run render:workflow-actions
npm run render:templates
npm run audit:templates
npm run check:repo
npm run clean:repo
```
