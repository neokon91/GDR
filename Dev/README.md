# Dev

Area di sviluppo del vault.

Questa cartella contiene roadmap, changelog, audit, confini release, smoke test, specifiche plugin e infrastruttura futura per generare template. Non fa parte del percorso primario del DM e non deve entrare nella ZIP utente.

## Contenuto

| Area | Uso |
| --- | --- |
| `Roadmap/` | Roadmap attiva e storiche. |
| `NEXT_PHASE_HANDOFF.md` | Sintesi operativa per riprendere sviluppo con poco contesto. |
| `TemplateFactory/` | Moduli YAML e schemi Jinja2 per generazione futura dei template. |
| `Plugin Technical Reference.md` | Riferimenti tecnici puntuali a funzioni, sintassi e configurazioni dei plugin. |
| `Sviluppo Vault.md` | Convenzioni tecniche del vault. |
| `Integrazioni Plugin.md` | Strategia di sfruttamento plugin. |
| `Confine Release Repository.md` | Cosa entra nella ZIP utente e cosa resta nel repository. |
| `Smoke 1.0 Professionale.md` | Smoke visuale pre-release. |

## Regole

- Ogni nuova funzione utente deve partire da una decisione in roadmap.
- I moduli YAML in `TemplateFactory/modules` devono descrivere dati e integrazioni, non contenere logica fragile.
- Jinja2 serve per generare template sorgente; Templater resta il runtime dentro Obsidian.
- Se un file in `Dev/` diventa necessario all'utente finale, va spostato fuori da `Dev/` e aggiunto ai controlli.
