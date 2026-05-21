# Template Factory

Prima infrastruttura per generare template Obsidian a partire da moduli YAML e renderer Jinja2.

## Obiettivo

Centralizzare definizioni ripetute: frontmatter, campi Meta Bind, router Templater, Dataview, Bases, Tasks, Calendarium, mappe, statblock, incontri e fallback Markdown.

## Architettura

| Cartella | Uso |
| --- | --- |
| `modules/` | Moduli YAML dichiarativi. Non contengono runtime utente. |
| `jinja/` | Scheletri Jinja2 per produrre Markdown statico pronto per Obsidian. |
| `examples/` | Output o casi di prova manuali. |

## Pipeline Prevista

1. Leggere `modules/*.yaml`.
2. Validare chiavi obbligatorie: `id`, `purpose`, `version`.
3. Comporre sezioni, callout, tabs, Meta Bind input/button, Dataview block e fallback.
4. Renderizzare template sorgente con Jinja2.
5. Scrivere in `z.modelli/`, `z.fileclass/` o `z.bases/` solo dopo review.
6. Eseguire `npm run check`.
7. Verificare in Obsidian con smoke visuale.

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

Il resto del file e Markdown statico generato da Jinja: tabs, callout, Meta Bind input, Meta Bind button, Dataview/DataviewJS, blocchi plugin specifici e fallback Markdown.

## Regola Generator

Gli script in `z.automazioni/` devono restare sottili:

- JS raccoglie input, sceglie file esistenti, calcola valori e collega note.
- `runtime_profiles.yaml` dichiara prompt, opzioni e default.
- `frontmatter_profiles.yaml` dichiara ordine, campi, default e integrazioni plugin del frontmatter.
- Un generatore Templater non deve restituire blocchi `---` inline: deve usare `helpers.renderFrontmatter("profilo", valori)`.
- Gli importer CLI possono usare un renderer locale equivalente solo quando non girano dentro Obsidian, ma il profilo resta dichiarato in `frontmatter_profiles.yaml`.

`npm run check:templates` blocca nuovi generatori inline non dichiarati e verifica i generatori critici post-M4 (`mappa`, `luogo`, `sessione`, `incontro`, `png`, `creatura`).

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

`frontmatter_profiles.yaml` distingue campi core, campi di dominio e campi legati a plugin come Calendarium o Maps. `check:templates` renderizza un campione per ogni profilo e verifica che il frontmatter risultante sia YAML valido.

Le sezioni `integrations` di `frontmatter_profiles.yaml` sono il contratto leggibile per fileClass e Bases: dichiarano target, campi minimi e superfici da mantenere. `check:metadata` verifica che le anteprime generate da quel contratto siano aggiornate.
