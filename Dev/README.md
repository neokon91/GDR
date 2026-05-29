# Dev

Area di sviluppo del vault.

Questa cartella contiene solo documentazione essenziale, contratti YAML/JS e tooling. Non fa parte del percorso primario del DM e non deve entrare nella ZIP utente.

## Contenuto

| Area | Uso |
| --- | --- |
| `CHANGELOG.md` | Storia minima delle release e marker verificati. |
| `RELEASE.md` | Procedura per costruire e validare la ZIP utente. |
| `Smoke 1.0 Professionale.md` | Smoke visuale pre-release. |
| `Sviluppo Vault.md` | Convenzioni tecniche e comandi di manutenzione. |
| `Source/YAML/` | Source of truth dichiarativo, separato per dominio, JSON, render, qualita e pipeline. |
| `Source/Jinja/` | Template Jinja2 usati dai renderer. |
| `Source/Assets/` | Asset sorgente consumati dalla pipeline. |
| `Tools/python/` | Tooling di sviluppo primario. |
| `Tools/node-legacy/` | Check, importer e release script JS esistenti, isolati dal runtime Obsidian. |
| `Examples/` | Input tecnici per importer e casi locali non utente. |
| `Tests/fixtures/` | Fixture tecniche usate dai check runtime. |

## Contratto Architetturale

Questo repository resta un sistema operativo narrativo dentro Obsidian. Il source of truth non esce dal vault.

| Layer | Responsabilita |
| --- | --- |
| Markdown | Markdown = contenuto umano. |
| YAML | YAML = stato persistente e regole dichiarative. |
| Dataview | Dataview = query layer. |
| Meta Bind | Meta Bind = interfaccia. |
| Templater | Templater = generazione. |
| Runtime interno | z.engine + z.automazioni = runtime/logica/esecuzione. |

Non introdurre web app, backend esterni, database esterni o sistemi fuori da Obsidian. Se una scelta dei giocatori cambia il mondo, il cambiamento deve finire in frontmatter YAML e diventare visibile attraverso Dataview, dashboard, Meta Bind e controlli.

## Indice Operativo Di Sviluppo

Usa questa nota come porta d'ingresso. Non creare nuova documentazione stabile se la regola puo vivere in YAML, in un check o in uno dei documenti essenziali.

| Bisogno | Documento canonico |
| --- | --- |
| Architettura e confini del sorgente | `source_pipeline.yaml`, `release_boundary.yaml`, `repo_quality_contract.yaml` |
| Convenzioni tecniche, campi e runtime | [[Dev/Sviluppo Vault]] |
| Layer Meta Bind, Templater, JS e fileClass | [[Dev/Sviluppo Vault]] |
| Sintassi e responsabilita plugin | `Dev/Source/YAML/canonical/plugin_bindings.yaml` |
| Contratti plugin e release | `Dev/Source/YAML/json/plugin_matrix.yaml` e `Dev/Source/YAML/canonical/plugin_contracts.yaml` |
| Verifica release | [[Dev/RELEASE]] e [[Dev/Smoke 1.0 Professionale]] |
| Template, YAML e superfici generate | [[Dev/Source/README]] |
| Scheda PG, SRD e output generati | [[Dev/Sviluppo Vault]] |

## Regole

- Ogni nuova funzione utente deve partire da un contratto YAML o da un check aggiornato.
- I moduli YAML in `Dev/Source/YAML` devono descrivere dati e integrazioni, non contenere logica fragile.
- Jinja2 serve per generare template sorgente; Templater resta il runtime dentro Obsidian.
- Il nuovo tooling di sviluppo va scritto in Python dentro `Dev/Tools/python/`.
- Il JS usato in Obsidian resta in `z.automazioni/` e `z.engine/`; `Dev/Tools/node-legacy/` esiste solo per il tooling JS storico ancora non portato.
- Se un file in `Dev/` diventa necessario all'utente finale, va spostato fuori da `Dev/` e aggiunto ai controlli.
- La documentazione di sviluppo va consolidata qui, in [[Dev/Sviluppo Vault]], in [[Dev/RELEASE]] o nei contratti YAML.
