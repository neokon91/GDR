# Tools

Tooling di sviluppo della repo.

| Cartella | Uso |
| --- | --- |
| `python/` | Sviluppo primario: renderer, pipeline, check dichiarativi e generatori da YAML/Jinja. |
| `node-legacy/` | Tooling JS storico ancora necessario per check, importer, release e compatibilita runtime. |

Nuovo codice di sviluppo: partire da `python/`.

JS nuovo: solo quando deve girare dentro Obsidian (`z.automazioni/`, `z.engine/`) o quando modifica in modo incrementale uno script legacy gia esistente.

I cockpit runtime sono renderizzati da `python/render_cockpit_contract.py`; non aggiungere nuovi wrapper `render_*_cockpit.js`.

I renderer di profili runtime e blocchi workflow stanno in Python: `python/render_runtime_plugin_profile.py` e `python/render_workflow_quick_actions.py`.

I check YAML dichiarativi nuovi o migrati stanno in Python, inclusi `python/check_user_path.py`, `python/check_naming_contract.py` e `python/check_validation_contract.py`.
