# GDR — vault Obsidian generato

Repo di **sviluppo** del vault GDR: worldbuilding profondo *connesso* al tavolo
D&D 5.5e. Il differenziatore: ogni nota lore espone una **superficie giocabile**
(`uso_al_tavolo`, `gancio`, `pressione`, `prossima_mossa`).

Le **sorgenti** in `Dev/` sono l'unica verità; il vault Obsidian è un **artefatto
ricostruibile** generato in `dist/GDR-vault/` (gitignorato).

## Come funziona

```
Dev/Source/{YAML,Jinja,JS}  ──►  Dev/Tools/render.py  ──►  dist/GDR-vault/
   modello   template  runtime          generatore            vault vivo
```

- `render.py` è un **orchestratore sottile** (modello+IO in `common.py`, SRD in
  `build_srd.py`, rules-engine PG in `build_personaggio.py`, validazione in
  `validate.py`). Fonde `core.yaml` + `system.yaml` + `entities/*.yaml` in un unico
  modello, rende i template **Jinja → Markdown**, copia i **JS** runtime e fa un
  **merge non distruttivo** della config `.obsidian` (non tocca `Mondi/` né i plugin).
- I JS sono **autonomi** (niente bundling): leggono i dati a runtime da
  `z.automazioni/data/*.json` via `app.vault.adapter.read`.
- Ogni entità tende alla **trinità**: YAML (schema) + Jinja (corpo via macro) + JS
  (`crea_<id>.js`, il wizard che applica le regole e stampa il **frontmatter**). Il
  template chiama solo `tp.user.crea_<id>` in alto; il corpo lo rende Jinja con Meta
  Bind (`INPUT`/`VIEW`) e Dataview.

## Comandi

| Comando | Effetto |
|---|---|
| `npm run check` | Valida YAML/Jinja e `node --check` sui JS. **Non scrive.** |
| `npm run build` | Genera il vault in `dist/GDR-vault/` (non distruttivo). |
| `npm run clean` | Rimuove solo gli artefatti generati (mai `.obsidian`/contenuti). |
| `npm run seed`  | Copia i contenuti di esempio (copy-if-absent). |

Verifica sempre con `npm run check` o un render standalone a stdout; il `build`
scrive sul vault Obsidian reale.

## Documentazione

Approfondimenti in [`docs/`](docs/): [architecture](docs/architecture.md) ·
[data_model](docs/data_model.md) · [plugin_contracts](docs/plugin_contracts.md) ·
[rules_layer](docs/rules_layer.md).

## Struttura

```
Dev/Source/YAML/      core.yaml · system.yaml · entities/*.yaml · pg_rules.yaml
                      plugins.yaml · templates.yaml · pages.yaml
Dev/Source/Jinja/     _macros.j2 · _entity_base.j2 + un template per entità
Dev/Source/JS/        create_entity.js · crea_personaggio.js · meta_actions.js · views.js
Dev/Source/SRD/       JSON SRD 5.2.1 IT · statblocks/ layout Fantasy Statblocks
Dev/Tools/            common.py · build_srd.py · build_personaggio.py · validate.py · render.py
Dev/Reference/        cheat-sheet sintassi dei plugin installati
docs/                 architecture · data_model · plugin_contracts · rules_layer
```

## Il modello (YAML)

`render.load_core()` fonde tre file in un unico modello (vedi
[data_model](docs/data_model.md)):

- **`core.yaml`** — globali worldbuilding: `fields` (registro centrale), `tavolo`
  (superficie giocabile), `states`.
- **`system.yaml`** — globali 5.5e: `fields` di sistema, `statblock`,
  `caratteristiche` (6), `abilita` (18).
- **`entities/<id>.yaml`** — schema **per-entità**: `folder`, `order`, `templates`,
  `subtypes`, `fields`, `scheda`, `assi`, `relazioni`, `creation` (wizard).

**`pg_rules.yaml`** — overlay del rules-engine PG (generazione caratteristiche).
**`plugins.yaml`** — plugin + `metabind_inputs` + bottoni-azione.
**`templates.yaml`** — solo le `actions` (i template di creazione sono nei file-entità).
**`pages.yaml`** — pagine-indice per dominio → `index.md.j2`.

## Jinja

`_macros.j2` raccoglie i **componenti condivisi (DRY)**: `identita_card`, `tavolo`,
`carattere`, `relazioni`, `collegamenti`, `vista`, `scheda`, `scheda_pg`/
`scheda_pg_rules`, e gli helper Meta Bind `field`/`view`/`computed`/`compute_into`.
`_entity_base.j2` è lo **scheletro** (header + tab) che ogni template per-entità
estende (`{% block lore %}`/`{% block extra_tabs %}`); le pagine `home`/`index`/
`leggimi` sono generate a parte.

## Aggiungere roba

- **Campo editabile**: voce in `core.fields` (o `entities/<id>.fields`) → usalo con
  `field('id')`; se il widget non è `text`/`number`, dichiaralo in `plugins.yaml:metabind_inputs`.
- **Entità**: un file `entities/<id>.yaml` (`folder`/`order`/`templates`/`subtypes` +
  opz. `fields`/`scheda`/`assi`/`relazioni`/`creation`) + il template `Jinja/<id>.md.j2`.
- **Pagina-indice**: voce in `pages.yaml` (file/title/category/columns/sort).

`check()` (`npm run check`) valida confine core/system, dup-ID, snake_case, shape,
schema dei file-entità e i riferimenti Jinja: un refuso si ferma prima del build.

## Requisiti

- **Python 3** + `pip install -r requirements-dev.txt` (Jinja2, PyYAML).
- **Node** (per `node --check` dentro `npm run check`).
