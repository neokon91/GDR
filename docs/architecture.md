# Architettura

GDR è un **vault Obsidian generato**: le sorgenti in `Dev/Source/` sono l'unica
verità e vengono compilate in `dist/GDR-vault/` (il vault vivo che apri in
Obsidian). Il repo di sviluppo resta pulito; il vault è ricostruibile.

```
Dev/Source/                      Dev/Tools/                    dist/GDR-vault/
  YAML/ (modello)        ─┐
  Jinja/ (template)       ├─▶  render.py (orchestratore)  ─▶   z.modelli/ (template)
  JS/ (Templater+JSEngine)│      ├─ common.py   (modello+IO)     z.automazioni/ (JS + *.json)
  SRD/ (JSON IT)          │      ├─ build_srd.py                 z.classi/ (fileClass)
  statblocks/ (FS)        │      ├─ build_personaggio.py         SRD/ (sola lettura)
  SiteJinja/ (HTML)      ─┘      ├─ validate.py                  Home/LEGGIMI/Indici/
                                 └─ build_site.py ─▶ dist/GDR-site/ (sito giocatori)
```

## I due piani + il per-entità

Il vault separa nettamente due piani, poi specializza per entità:

- **A) Worldbuilding** (`core.yaml`): superficie giocabile (`tavolo`), stati,
  campi trasversali. È il differenziatore: ogni nota lore espone `uso_al_tavolo`/
  `gancio`/`pressione`/`prossima_mossa`.
- **B) Sistema 5.5e** (`system.yaml`): `statblock`, `caratteristiche`, `abilita`,
  campi di sistema.
- **Per-entità** (`entities/*.yaml`): un file per categoria con tutto ciò che è
  specifico (tassonomia, scheda, assi, relazioni, wizard, wiring del template).

`render.py` **fonde** core.yaml + system.yaml + entities/\*.yaml in un unico
dizionario `core` (vedi [data_model.md](data_model.md)); template, JS (`core.json`)
e test consumano il modello unificato senza sapere dello split.

## La "trinità" per-entità

Ogni entità tende a essere descritta da tre file:

1. **YAML** (`entities/<id>.yaml`) — lo *schema* (campi, scheda, relazioni, wizard).
2. **Jinja** (`Jinja/<id>.md.j2`) — il *corpo* della nota, costruito con le macro
   condivise (`_macros.j2`) estendendo lo scheletro `_entity_base.j2`.
3. **JS** (`JS/crea_<id>.js`) — il *wizard* di creazione (Templater): prompt/
   suggester, applica le regole e stampa il frontmatter. Il template Jinja in
   alto chiama solo `tp.user.crea_<id>(tp)`.

Il wizard delle entità "uniformi" è **generato**: `render.py` produce un
`crea_<id>.js` minimale che delega al motore condiviso `create_entity.js` (legge
lo schema da `core.json`). Le entità bespoke hanno invece un `crea_<id>.js`
**hand-authored** in `Dev/Source/JS/` che fa da override.

I file `_*.js` (`_comparators.js`, `_homebrew_bridge.js`, `_relations.js`) sono **sorgenti
canoniche condivise**: NON copiate nel vault, ma gli script autonomi (niente require a runtime)
ne tengono una COPIA fra marker (`>>>matchesCond`/`<<<`, `>>>homebrew-bridge`/`<<<`,
`>>>relations`/`<<<`). `check()` impone che le copie siano **byte-identiche** alla canonica: la
deriva diventa un errore di build, non un bug latente. Casi: `matchesCond` (views.js/
meta_actions.js), ponte homebrew (crea_pg.js/sali_pg.js — creazione vs level-up), derivazione
degli **inversi** `reciprocalField`/`inverseRelation` (meta_actions.js *Collega* vs
create_entity.js *inversi nel wizard* — il link reciproco scritto a creazione e quello scritto
da Collega non possono divergere).

Esempio completo (bespoke): il **PG** (`entities/personaggio.yaml` + `pg.md.j2` +
`crea_pg.js`, + `sali_pg.js` per il level-up), vedi [rules_layer.md](rules_layer.md).
Le meccaniche al tavolo (clock/conseguenze, archetipi/profilo, difficoltà incontri)
sono in [play_layer.md](play_layer.md).

## I moduli di `render.py`

`render.py` è un orchestratore sottile; la logica vive nei moduli (nessun ciclo:
tutti importano `common`).

| Modulo | Responsabilità |
|---|---|
| `common.py` | Percorsi, IO (`load_yaml`/`write_*`/`read_json`), e il **modello**: `deep_merge`, `load_core_parts`, `load_entities`, `apply_entities`, `entity_templates`, `load_core`, `load_templates`, `load_pages`, `template_folder`. |
| `build_srd.py` | Genera l'albero `SRD/` (sola lettura) dai JSON IT vendorizzati. `srd_note` rende **tutto** il contenuto della voce: infobox per categoria, descrizione/sezioni (tabelle di progressione, blocchi-effetto, liste incantesimi), potenziamento, **creature evocate inline** (callout statblock), e footer **Vedi anche** coi link risolti (`srd_id_index`), de-duplicando le prose ripetute. I mostri diventano statblock Fantasy Statblocks. |
| `build_personaggio.py` | Converter del rules-engine PG: SRD + `pg_rules.yaml` → `personaggio.json`. |
| `build_site.py` | Esporta il **sito dei giocatori** statico (`build_site`, CLI `--site`): dal vault → HTML spoiler-free in `dist/GDR-site/`. Markdown→HTML minimale; esclude callout `segreto`, campi del DM, blocchi dinamici/Meta Bind/`dice:` e le note `visibilita: dm`/`pubblico: false`. Template in `Dev/Source/SiteJinja/`. |
| `validate.py` | `check()` + `validate_split`/`validate_entities`/`validate_entity_schema`/`validate_reciprocals`/`validate_aux_yaml`: confine core/system, dup-ID, snake_case, shape, schema wizard (`from` ammessi, `options`/`category`), inversi reciproci, YAML ausiliari (astrologia/pg_rules), template/Jinja, e l'uguaglianza byte delle sorgenti `_*.js`. |
| `render.py` | `build()` orchestratore snello (~25 righe) che delega a helper nominati (`write_engine_data`/`render_notes`/`write_obsidian_config`/…), `clean()`, CLI. Re-esporta i nomi pubblici dei moduli. |

## Pipeline di build (`render.py build()`)

`build()` è un orchestratore di **funzioni nominate** (una per fase, niente
monolite): carica il modello e delega.

1. `load_core()` (modello fuso) + `load_templates()` (templates.yaml + entità) + `load_pages()`.
2. `write_engine_data()` — scrive `z.automazioni/data/{core.json,personaggio.json}`
   (dati per i JS; `core.json` include anche `astrologia`/`generatori`), copia i JS 1:1
   (`views.js`, `boot.mjs`, `meta_actions.js`, `create_entity.js`, `sali_pg.js`, `genera.js`),
   genera i wrapper `crea_<id>.js` mancanti. *(I JS cache-ano `core.json` per-modulo.)*
3. `render_notes(jinja_env(), …)` — rende ogni template Jinja → `z.modelli/`, le azioni,
   Home/LEGGIMI, le pagine-indice e le dashboard auto **Ponte Mondo↔Sistema**, **Fronti**,
   **Rete del mondo**, **Economia** e **Geografia** (`Indici/`). Ritorna `{target: testo}`.
   Poi `write_bases()` (viste `.base`).
4. `build_srd(core)` → albero `SRD/` (prima della config: i bookmark referenziano `SRD/Indice`).
5. `write_obsidian_config()` — config `.obsidian` **non distruttiva** (merge), un writer
   per plugin: community-plugins, Templater, Dataview, Meta Bind (input+button),
   `write_metadata_menu` (fileClass), `write_iconize`, `write_callout_manager`,
   `write_statblock_layouts` (layout + dice), `write_folder_notes`, `write_calendarium`
   (parsing + ponte `fc-*`), `write_bookmarks`, chrome esploratore, default core, homepage.
   Vedi [plugin_contracts.md](plugin_contracts.md).
6. `scaffold_folders()` — crea le cartelle contenuti mancanti (idempotente).
7. `write_example_world()` — genera il mondo-esempio (`Dev/Source/esempio/*.yaml`) in
   `Mondi/_Esempio — <Mondo>/` (namespace riservato, riscritto a ogni build, cancellabile).

Il **sito dei giocatori** è un passo separato e opt-in: `render.py --site` (`npm run site`)
legge il vault e scrive `dist/GDR-site/` (vedi `build_site.py`).

## Regole operative

- **Verifica** sempre con `npm test` (pytest) o `npm run check` / render standalone
  a stdout. **MAI** build sul vault dell'utente senza ok esplicito; **MAI** `rm` su `dist`.
- Build/commit/push solo con ok esplicito per-azione.
- Il build è **non distruttivo**: non tocca note utente in `Mondi/` né i plugin
  installati in `.obsidian/plugins/`.
