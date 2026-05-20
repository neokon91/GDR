# z.automazioni

Script usati da Templater, dashboard e manutenzione del vault.

## Script CLI

| File | Uso |
| --- | --- |
| `check_vault.js` | Smoke test locale della struttura del vault, del plugin layer interno e degli script JS. |
| `check_js.js` | Controllo sintattico ricorsivo degli script in `z.automazioni/` e `z.engine/`. |
| `repo_hygiene.js` | Controllo repository: artefatti locali, note di prova residue e script npm essenziali. |
| `import_srd.js` | Rigenera il riferimento SRD in `SRD/`. |
| `import_azgaar_geojson.js` | Importa mappe Azgaar come bozze operative. |
| `release_clean.js` | Crea una copia consegnabile del vault. |

## Helper Condivisi

| File | Uso |
| --- | --- |
| `helpers.js` | Funzioni comuni per template Templater. |
| `session_context.js` | Funzioni condivise per dashboard e DataviewJS. |
| `meta_actions.js` | Libreria azioni Meta Bind: canone, rumor, archiviazione, conseguenze, clock, sessione attiva, propagazione e recap pubblico. |
| `wizard_layer.js` | Wizard centralizzati: nuova entita viva, appunto live, conseguenza, fine sessione e sessione da output precedente. |

## Script Di Creazione

Gli altri file `.js` corrispondono ai template in `z.modelli/`. Il nome dello script deve restare coerente con le chiamate `tp.user.*` nei template.

Esempio: `z.modelli/dm/Sessione.md` usa `tp.user.sessione`, quindi lo script deve restare `sessione.js`.

## Manutenzione Del Layer Interno

- Se aggiungi un pulsante operativo, registra il template in `.obsidian/plugins/obsidian-meta-bind-plugin/data.json` e aggiungi l'id a `REQUIRED_META_BIND_BUTTONS` in `check_vault.js`.
- Se aggiungi un input template globale, aggiorna `REQUIRED_META_BIND_INPUT_TEMPLATES`.
- Se aggiungi un preset Metadata Menu, aggiorna `REQUIRED_METADATA_MENU_PRESETS`.
- Se aggiungi un file essenziale al layer, aggiorna `REQUIRED_LAYER_FILES`.
- Mantieni le azioni distruttive o di propagazione in `meta_actions.js`, non nei singoli template.

## Controllo

Dal root della repo:

```bash
npm run check
npm run check:repo
npm run clean:repo
```
