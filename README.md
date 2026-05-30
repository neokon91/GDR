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

- `render.py` legge il modello YAML, rende i template **Jinja → Markdown** e copia
  i **JS** runtime; scrive il tutto nel vault e fa un **merge non distruttivo** della
  config `.obsidian` (non tocca `Mondi/` né i plugin installati dall'utente).
- I JS sono **autonomi** (niente bundling): leggono i dati a runtime da
  `z.automazioni/data/core.json` via `app.vault.adapter.read`.
- Il **frontmatter** lo scrive il wizard JS (`create_entity.js`); il **corpo** lo
  rende Jinja. Meta Bind fornisce gli `INPUT`/`VIEW`; Dataview le viste.

## Comandi

| Comando | Effetto |
|---|---|
| `npm run check` | Valida YAML/Jinja e `node --check` sui JS. **Non scrive.** |
| `npm run build` | Genera il vault in `dist/GDR-vault/` (non distruttivo). |
| `npm run clean` | Rimuove solo gli artefatti generati (mai `.obsidian`/contenuti). |
| `npm run seed`  | Copia i contenuti di esempio (copy-if-absent). |

Verifica sempre con `npm run check` o un render standalone a stdout; il `build`
scrive sul vault Obsidian reale.

## Struttura

```
Dev/Source/YAML/     core.yaml · plugins.yaml · templates.yaml · pages.yaml
Dev/Source/Jinja/    _macros.j2 + template per categoria (entity/character/...)
Dev/Source/JS/       create_entity.js · meta_actions.js · views.js
Dev/Source/Samples/  contenuti d'esempio (seed)
Dev/Tools/render.py  generatore
Dev/Reference/       cheat-sheet sintassi dei plugin installati
```

## Il modello (YAML)

**`core.yaml`** — ontologia e campi:
- `folders` / `categories` (con `subtypes`) / `states` — tassonomia.
- `fields` — registro dei campi editabili (label + widget → macro `field()`).
- `tavolo` — superficie giocabile universale (single source della macro `tavolo()`).
- `assi_tematici` — spettri 0-10 per categoria → tab *Carattere* (macro `carattere()`).
- `relazioni` — link tipizzati per categoria → macro `relazioni()` (suggester scoped).
- `caratteristiche` — abilità 5e per la scheda PG (macro `scheda_pg()`).
- `creation` — wizard per categoria (campi → frontmatter; body → sezioni nel corpo).

**`plugins.yaml`** — plugin richiesti + `metabind_inputs` (template `INPUT[...]`) + bottoni-azione.
**`templates.yaml`** — i modelli generati (`z.modelli/*.md`): id, categoria, jinja, target.
**`pages.yaml`** — pagine-indice per dominio (hub con dashboard) → `index.md.j2`.

## Jinja

`_macros.j2` raccoglie i **componenti condivisi (DRY)**, riusati da tutti i template:
`identita_card`, `tavolo`, `carattere`, `relazioni`, `collegamenti`, `vista`,
`scheda_pg`, e gli helper Meta Bind `field`/`view`/`view_md`/`computed`/`compute_into`.
I template (`entity`, `character`, `creature`, `encounter`, `event`, `session`)
orchestrano le macro; le pagine `home`/`index`/`leggimi` sono generate a parte.

## Aggiungere roba

- **Campo editabile**: voce in `core.fields` → usalo con `field('id')`; se il widget
  non è `text`/`number`, dichiaralo in `plugins.yaml:metabind_inputs`.
- **Categoria**: voce in `categories` + cartella in `folders` + (opz.) `creation`,
  `assi_tematici`, `relazioni`; aggiungi il template in `templates.yaml`.
- **Pagina-indice**: voce in `pages.yaml` (file/title/category/columns/sort).

`check()` valida i riferimenti (`field('id')`, `tavolo`, `relazioni`, categorie delle
pagine), quindi un refuso si ferma prima del build.

## Requisiti

- **Python 3** + `pip install -r requirements-dev.txt` (Jinja2, PyYAML).
- **Node** (per `node --check` dentro `npm run check`).
