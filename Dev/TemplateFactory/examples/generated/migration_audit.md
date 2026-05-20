# TemplateFactory Migration Audit

Generated: 2026-05-20T21:41:40.149400+00:00

Questo report confronta le preview generate da `Dev/TemplateFactory` con i template reali in `z.modelli`. Non modifica i template reali.

## Sintesi

| Blueprint | Target | Similarita | Preview/Target righe | Raccomandazione | Motivo |
| --- | --- | ---: | ---: | --- | --- |
| world_entity | `z.modelli/worldbuilding/Entita Worldbuilding.md` | 1.000 | 93/93 | candidato merge | Preview molto vicina al target e fallback presente. |
| session | `z.modelli/dm/Sessione.md` | 0.195 | 73/501 | non sostituire | Preview piu piccola: usarla come base, ma il target contiene sezioni operative da preservare. |
| map_asset | `z.modelli/mappe/Mappa Zoom.md` | 0.180 | 40/93 | non sostituire | Preview piu piccola: usarla come base, ma il target contiene sezioni operative da preservare. |
| map_asset | `z.modelli/mappe/Mappa Excalidraw Fronti.excalidraw.md` | 0.208 | 40/56 | migrare parziale | Serve confronto manuale di sezioni e marker plugin. |
| creature_encounter | `z.modelli/dm/Incontro.md` | 0.077 | 35/200 | non sostituire | Preview piu piccola: usarla come base, ma il target contiene sezioni operative da preservare. |
| creature_encounter | `z.modelli/Creatura.md` | 0.208 | 35/42 | migrare parziale | Serve confronto manuale di sezioni e marker plugin. |

## Dettaglio

### world_entity -> `z.modelli/worldbuilding/Entita Worldbuilding.md`

- Preview: `Dev/TemplateFactory/examples/generated/world_entity.preview.md`
- Target esiste: `True`
- Similarita: `1.0`
- Raccomandazione: **candidato merge**
- Motivo: Preview molto vicina al target e fallback presente.
- Marker presenti solo nel target: nessuno
- Marker nuovi nella preview: nessuno

| Marker | Preview | Target |
| --- | ---: | ---: |
| `templater` | 1 | 1 |
| `templater_multiline` | 0 | 0 |
| `meta_bind_input` | 16 | 16 |
| `meta_bind_button` | 0 | 0 |
| `dataview` | 1 | 1 |
| `dataviewjs` | 1 | 1 |
| `tabs` | 1 | 1 |
| `callout` | 12 | 12 |
| `statblock` | 0 | 0 |
| `encounter` | 0 | 0 |
| `dice` | 0 | 0 |
| `fallback` | 1 | 1 |
| `session_views` | 1 | 1 |
| `legacy_session_context` | 0 | 0 |

### session -> `z.modelli/dm/Sessione.md`

- Preview: `Dev/TemplateFactory/examples/generated/session.preview.md`
- Target esiste: `True`
- Similarita: `0.195`
- Raccomandazione: **non sostituire**
- Motivo: Preview piu piccola: usarla come base, ma il target contiene sezioni operative da preservare.
- Marker presenti solo nel target: dataview, dice
- Marker nuovi nella preview: fallback

| Marker | Preview | Target |
| --- | ---: | ---: |
| `templater` | 1 | 1 |
| `templater_multiline` | 0 | 0 |
| `meta_bind_input` | 15 | 74 |
| `meta_bind_button` | 1 | 6 |
| `dataview` | 0 | 9 |
| `dataviewjs` | 1 | 4 |
| `tabs` | 1 | 2 |
| `callout` | 8 | 34 |
| `statblock` | 0 | 0 |
| `encounter` | 0 | 0 |
| `dice` | 0 | 3 |
| `fallback` | 1 | 0 |
| `session_views` | 1 | 4 |
| `legacy_session_context` | 0 | 0 |

### map_asset -> `z.modelli/mappe/Mappa Zoom.md`

- Preview: `Dev/TemplateFactory/examples/generated/map_asset.preview.md`
- Target esiste: `True`
- Similarita: `0.18`
- Raccomandazione: **non sostituire**
- Motivo: Preview piu piccola: usarla come base, ma il target contiene sezioni operative da preservare.
- Marker presenti solo nel target: nessuno
- Marker nuovi nella preview: templater, tabs, fallback

| Marker | Preview | Target |
| --- | ---: | ---: |
| `templater` | 1 | 0 |
| `templater_multiline` | 0 | 0 |
| `meta_bind_input` | 5 | 11 |
| `meta_bind_button` | 0 | 0 |
| `dataview` | 1 | 1 |
| `dataviewjs` | 0 | 0 |
| `tabs` | 1 | 0 |
| `callout` | 3 | 3 |
| `statblock` | 0 | 0 |
| `encounter` | 0 | 0 |
| `dice` | 0 | 0 |
| `fallback` | 1 | 0 |
| `session_views` | 0 | 0 |
| `legacy_session_context` | 0 | 0 |

### map_asset -> `z.modelli/mappe/Mappa Excalidraw Fronti.excalidraw.md`

- Preview: `Dev/TemplateFactory/examples/generated/map_asset.preview.md`
- Target esiste: `True`
- Similarita: `0.208`
- Raccomandazione: **migrare parziale**
- Motivo: Serve confronto manuale di sezioni e marker plugin.
- Marker presenti solo nel target: nessuno
- Marker nuovi nella preview: templater, meta_bind_input, dataview, tabs, callout, fallback

| Marker | Preview | Target |
| --- | ---: | ---: |
| `templater` | 1 | 0 |
| `templater_multiline` | 0 | 0 |
| `meta_bind_input` | 5 | 0 |
| `meta_bind_button` | 0 | 0 |
| `dataview` | 1 | 0 |
| `dataviewjs` | 0 | 0 |
| `tabs` | 1 | 0 |
| `callout` | 3 | 0 |
| `statblock` | 0 | 0 |
| `encounter` | 0 | 0 |
| `dice` | 0 | 0 |
| `fallback` | 1 | 0 |
| `session_views` | 0 | 0 |
| `legacy_session_context` | 0 | 0 |

### creature_encounter -> `z.modelli/dm/Incontro.md`

- Preview: `Dev/TemplateFactory/examples/generated/creature_encounter.preview.md`
- Target esiste: `True`
- Similarita: `0.077`
- Raccomandazione: **non sostituire**
- Motivo: Preview piu piccola: usarla come base, ma il target contiene sezioni operative da preservare.
- Marker presenti solo nel target: meta_bind_button, dataview, dataviewjs
- Marker nuovi nella preview: fallback

| Marker | Preview | Target |
| --- | ---: | ---: |
| `templater` | 1 | 1 |
| `templater_multiline` | 0 | 0 |
| `meta_bind_input` | 3 | 13 |
| `meta_bind_button` | 0 | 3 |
| `dataview` | 0 | 5 |
| `dataviewjs` | 0 | 2 |
| `tabs` | 1 | 1 |
| `callout` | 2 | 11 |
| `statblock` | 1 | 1 |
| `encounter` | 1 | 1 |
| `dice` | 1 | 4 |
| `fallback` | 1 | 0 |
| `session_views` | 0 | 0 |
| `legacy_session_context` | 0 | 0 |

### creature_encounter -> `z.modelli/Creatura.md`

- Preview: `Dev/TemplateFactory/examples/generated/creature_encounter.preview.md`
- Target esiste: `True`
- Similarita: `0.208`
- Raccomandazione: **migrare parziale**
- Motivo: Serve confronto manuale di sezioni e marker plugin.
- Marker presenti solo nel target: dataviewjs
- Marker nuovi nella preview: tabs, statblock, encounter, dice, fallback

| Marker | Preview | Target |
| --- | ---: | ---: |
| `templater` | 1 | 1 |
| `templater_multiline` | 0 | 0 |
| `meta_bind_input` | 3 | 2 |
| `meta_bind_button` | 0 | 0 |
| `dataview` | 0 | 0 |
| `dataviewjs` | 0 | 1 |
| `tabs` | 1 | 0 |
| `callout` | 2 | 4 |
| `statblock` | 1 | 0 |
| `encounter` | 1 | 0 |
| `dice` | 1 | 0 |
| `fallback` | 1 | 0 |
| `session_views` | 0 | 0 |
| `legacy_session_context` | 0 | 0 |
