# Dev

Area di sviluppo del vault.

Questa cartella contiene roadmap, changelog, audit, confini release, smoke test e contratti YAML/JS. Non fa parte del percorso primario del DM e non deve entrare nella ZIP utente.

## Contenuto

| Area | Uso |
| --- | --- |
| `Roadmap/` | Roadmap attiva e storiche. |
| `TemplateFactory/` | Moduli YAML e schemi Jinja2 per generazione futura dei template. |
| `Sviluppo Vault.md` | Convenzioni tecniche del vault. |
| `Confine Release Repository.md` | Cosa entra nella ZIP utente e cosa resta nel repository. |
| `Smoke 1.0 Professionale.md` | Smoke visuale pre-release. |

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

Usa questa nota come porta d'ingresso. Non duplicare decisioni tecniche in file nuovi se possono stare nei documenti esistenti.

| Bisogno | Documento canonico |
| --- | --- |
| Direzione prodotto e milestone | [[Dev/Roadmap/1.0 Professionale]] |
| Convenzioni tecniche, campi e runtime | [[Dev/Sviluppo Vault]] |
| Layer Meta Bind, Templater, JS e fileClass | [[Dev/Sviluppo Vault]] |
| Sintassi e responsabilita plugin | `Dev/TemplateFactory/modules/plugin_bindings.yaml` |
| Contratti plugin e release | `Dev/TemplateFactory/modules/plugin_matrix.yaml` e `Dev/TemplateFactory/modules/plugin_contracts.yaml` |
| Confini della ZIP utente | [[Dev/Confine Release Repository]] |
| Verifica release | [[Dev/RELEASE]] e [[Dev/Smoke Demo Finale]] |
| Template, YAML e superfici generate | [[Dev/TemplateFactory/README]] |
| Scheda PG, SRD e output generati | [[Dev/Sviluppo Vault]] |

## Regole

- Ogni nuova funzione utente deve partire da una decisione in roadmap.
- I moduli YAML in `TemplateFactory/modules` devono descrivere dati e integrazioni, non contenere logica fragile.
- Jinja2 serve per generare template sorgente; Templater resta il runtime dentro Obsidian.
- Se un file in `Dev/` diventa necessario all'utente finale, va spostato fuori da `Dev/` e aggiunto ai controlli.
- La documentazione di sviluppo va consolidata aggiornando l'indice qui sopra, non creando una nuova nota scollegata.
