# Modello dati

Tutte le sorgenti del modello sono in `Dev/Source/YAML/`. `render.load_core()`
le fonde in un unico dizionario `core`; `render.load_templates()` raccoglie i
template. Il confine fra i file è validato da `validate.py` (`check()`).

## Il merge

```
core = apply_entities( deep_merge(core.yaml, system.yaml), entities/*.yaml )
```

- `deep_merge` fonde i dict ricorsivamente per chiave (lo split è lossless: i
  file non condividono chiavi — lo garantisce il check dup-ID).
- `apply_entities` distribuisce ogni file-entità nelle sezioni globali di `core`:
  `folders[id]`, `categories[id]={folder,subtypes}`, `fields`, `scheda[id]`,
  `assi_tematici[id]`, `relazioni[id]`, `creation[id]`, `archetipi[id]`. Gli **assi**
  e gli **archetipi** sono scorporati in `YAML/assi/<id>.yaml` (rifusi qui).

## `core.yaml` — globali worldbuilding

| Sezione | Contenuto |
|---|---|
| `fields` | Registro centrale `{id: {label, widget}}`. `widget` = `text`/`number` → `INPUT[...]`; altrimenti nome di un template Meta Bind (vedi `plugins.yaml:metabind_inputs`). |
| `tavolo` | Superficie giocabile: lista `{field, callout, title, fold?}`. |
| `states` | Stati del flusso (`bozza`/`pronto`/…) → Select `stato`. |

## `system.yaml` — globali sistema 5.5e

| Sezione | Contenuto |
|---|---|
| `fields` | Campi 5.5e (rarità, livello, dado_vita, …). |
| `statblock` | `{layout}` per il blocco ` ```statblock ` (Fantasy Statblocks). |
| `caratteristiche` | Le 6 abilità di base `{id, sigla}`. |
| `abilita` | Le 18 abilità 5e `{id: {label, caratteristica}}` (scheda PG + converter). |
| `xp` | Difficoltà incontri: `cr_xp` (GS→PE) + `budget_2024` (Bassa/Moderata/Alta per personaggio). Usato da `views.renderEncounter`. |

## `entities/<id>.yaml` — schema per-entità

```yaml
id: fazione                 # = chiave categoria
folder: Mondi/Fazioni       # cartella di destinazione
order: 5                    # ordine dei bottoni Home (preserva la sequenza curata)
templates:                  # uno o più template di creazione (category = id)
  - { id, title, default_type, target, jinja, primary? }
subtypes: [gilda, ordine, …]
famiglie:                   # (opzionale) classificazione a 2 livelli (tema curato)
  - { nome, descrizione, assi? }   # 'assi':{asseId:1-5} = preset assi in creazione
fields:                     # (opzionale) campi esclusivi dell'entità
  motto: { label: Motto, widget: text }
scheda: [portata, motto, …] # campi mostrati dalla macro scheda()
relazioni:                  # link tipizzati (macro relazioni())
  - { field, label, category, multi?, reciprocal? }
    # reciprocal: nome del campo INVERSO sul target, scritto da Collega
    # (meta_actions.inverseRelation). Serve quando l'auto-derivazione è ambigua:
    # simmetrico (luogo.confina_con↔confina_con, rotta_con↔rotta_con) o
    # direzionale (evento.causato_da↔conseguenze). Senza, l'inverso è auto-derivato
    # se la coppia è univoca, altrimenti generico (connessioni).
creation:                   # wizard (letto da create_entity.js / generato)
  fields: [ { field, prompt, from?, category?, link?, required?, optional?, multi? } ]
  body:   [ { field, prompt, heading? | callout?+title?+fold? } ]
```

`from`: `subtypes` (suggester sui subtypes) · `notes`+`category`+`link` (suggester
sulle note di quella categoria → link `[[..]]`) · `list`+`options` · default = testo libero.

**Assi & archetipi** vivono in `YAML/assi/<id>.yaml` (scorporati, rifusi da `load_entities`):
`assi:` formato ricco `{id, nome, descrizione, valori:{1..5:{etichetta, descrizione}}}`
(macro `carattere()` + radar); `archetipi:` `{id, nome, quando:{asse: comparatore}, tag}`
(tag-da-assi + preset in creazione, vedi [play_layer](play_layer.md)).

## Overlay e altri file

| File | Ruolo |
|---|---|
| `pg_rules.yaml` | Overlay curato del rules-engine PG: `generazione_caratteristiche` (array/point-buy), `aumento_background`, `armature` (CA), `lingue`. (Le abilità stanno in `system.yaml`.) |
| `templates.yaml` | Solo `actions` (bottoni su nota esistente); i template di creazione sono nei file-entità. |
| `pages.yaml` | Pagine-indice (hub per dominio) → `index.md.j2`. |
| `plugins.yaml` | `plugins`, `metabind_inputs`, `buttons` (`action` o `command`), `folder_icons`, `callouts`. |
| `astrologia.yaml` | Catalogo tema natale (segni/arcani/elementi) → `core.json` (`views.renderTemaNatale`). |
| `generatori.yaml` | Generatore homebrew di nomi (stili/affissi/forme) → `core.json` (`genera.js`). |
| `fcg_it.yaml` | Liste italiane per i generatori configurabili di Fantasy Content Generator (iniettate nel suo `data.json`). |

## Confine validato (`validate.py`)

- **core-only**: `tavolo`, `assi_tematici`, `states` (mai in system.yaml).
- **system-only**: `scheda`, `statblock`, `caratteristiche`, `abilita` (mai in core.yaml).
- **dup-ID**: `folders`/`fields`/`categories`/`creation`/`relazioni` disgiunti fra i file.
- **snake_case**: tutti gli id (campi, categorie, folder, abilità, assi, relazioni).
  Eccezione `INTEROP_FIELDS` = `fc-date`/`fc-end`/`fc-calendar`/`fc-category` (col trattino:
  chiavi-evento richieste da Calendarium; Meta Bind 1.4.x le binda).
- **shape**: ogni campo ha label+widget; categoria folder risolvibile+subtypes;
  scheda→fields; relazioni field/label/category; **reciprocal** (se dichiarato) nomina
  una relazione esistente del target (`validate_reciprocals`); abilità con caratteristica valida;
  **archetipi** con id/nome/tag e `quando` che riferisce assi reali; **famiglie** con `assi`
  preset che riferiscono assi reali (1-5); **anti-drift**: opzioni del select `stile_nomi`
  (metabind) == stili di `generatori.yaml`.
- **entità**: nessuna collisione id-categoria/campo con core/system; template con id/title/jinja/target.
