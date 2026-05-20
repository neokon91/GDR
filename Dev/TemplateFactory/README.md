# Template Factory

Prima infrastruttura per generare template Obsidian a partire da moduli YAML e renderer Jinja2.

## Obiettivo

Centralizzare definizioni ripetute: frontmatter, campi Meta Bind, router Templater, Dataview, Bases, Tasks, Calendarium, mappe, statblock, incontri e fallback Markdown.

## Architettura

| Cartella | Uso |
| --- | --- |
| `modules/` | Moduli YAML dichiarativi. |
| `jinja/` | Scheletri Jinja2 futuri per rendering template. |
| `examples/` | Output o casi di prova manuali. |

## Pipeline Prevista

1. Leggere `modules/*.yaml`.
2. Validare chiavi obbligatorie: `id`, `purpose`, `plugins`, `fields`, `outputs`.
3. Renderizzare template sorgente con Jinja2.
4. Scrivere in `z.modelli/` o `z.fileclass/` solo dopo review.
5. Eseguire `npm run check`.
6. Verificare in Obsidian con smoke visuale.

## Regola Runtime

Jinja2 non deve essere richiesto all'utente finale. E uno strumento di sviluppo per generare file Markdown/Templater. Nel vault distribuito il runtime resta Obsidian con plugin installati.
