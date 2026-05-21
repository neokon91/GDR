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
npm run render:templates
npm run audit:templates
```

`render:templates` scrive solo anteprime in `Dev/TemplateFactory/examples/generated/`. Non modifica `z.modelli`, `z.fileclass` o `z.bases`.

`audit:templates` confronta le anteprime con i target dichiarati in `template_blueprints.yaml` e scrive `Dev/TemplateFactory/examples/generated/migration_audit.md`.

## Regola Runtime

Jinja2 non deve essere richiesto all'utente finale. E uno strumento di sviluppo per generare file Markdown/Templater statici. Nel vault distribuito il runtime resta Obsidian con plugin installati.

Ogni template generato deve avere una sola funzione Templater iniziale, ad esempio:

```md
<% await tp.user.crea_entita(tp) %>
```

Il resto del file e Markdown statico generato da Jinja: tabs, callout, Meta Bind input, Meta Bind button, Dataview/DataviewJS, blocchi plugin specifici e fallback Markdown.

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
