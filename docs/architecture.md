# Architettura

GDR è un **vault Obsidian generato**: le sorgenti in `Dev/Source/` sono l'unica
verità e vengono compilate in `dist/GDR-vault/` (il vault vivo che apri in
Obsidian). Il repo di sviluppo resta pulito; il vault è ricostruibile.

```
Dev/Source/                      Dev/Tools/                    dist/GDR-vault/
  YAML/ (modello)        ─┐
  Jinja/ (template)       ├─▶  render.py (orchestratore)  ─▶   z.modelli/ (template)
  JS/ (runtime Templater) │      ├─ common.py   (modello+IO)     z.automazioni/ (JS + *.json)
  SRD/ (JSON IT)          │      ├─ build_srd.py                 z.classi/ (fileClass)
  statblocks/ (FS)       ─┘      ├─ build_personaggio.py         SRD/ (sola lettura)
                                 └─ validate.py                  Home/LEGGIMI/Indici/
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

Esempio completo: il **PG** (`entities/personaggio.yaml` + `pg.md.j2` +
`crea_personaggio.js`), vedi [rules_layer.md](rules_layer.md).

## I moduli di `render.py`

`render.py` è un orchestratore sottile; la logica vive nei moduli (nessun ciclo:
tutti importano `common`).

| Modulo | Responsabilità |
|---|---|
| `common.py` | Percorsi, IO (`load_yaml`/`write_*`/`read_json`), e il **modello**: `deep_merge`, `load_core_parts`, `load_entities`, `apply_entities`, `entity_templates`, `load_core`, `load_templates`, `load_pages`, `template_folder`. |
| `build_srd.py` | Genera l'albero `SRD/` (sola lettura) dai JSON IT vendorizzati; i mostri diventano statblock Fantasy Statblocks. |
| `build_personaggio.py` | Converter del rules-engine PG: SRD + `pg_rules.yaml` → `personaggio.json`. |
| `validate.py` | `check()` + `validate_split`/`validate_entities`: confine core/system, dup-ID, snake_case, shape, template/Jinja. |
| `render.py` | `build()` (render template + config `.obsidian` non distruttiva), `clean()`, `seed_samples()`, CLI. Re-esporta i nomi pubblici dei moduli. |

## Pipeline di build (`render.py build()`)

1. `load_core()` (modello fuso) + `load_templates()` (templates.yaml + entità).
2. Scrive `z.automazioni/data/{core.json,personaggio.json}` (dati per i JS) e copia i JS 1:1.
3. Rende ogni template Jinja → `z.modelli/`, le azioni, Home/LEGGIMI, le pagine-indice.
4. Config `.obsidian` **non distruttiva** (merge): community-plugins, Templater,
   Dataview, Meta Bind (input+button), Metadata Menu (fileClass), Iconize,
   Callout Manager, Fantasy Statblocks (layout), Bookmarks. Vedi
   [plugin_contracts.md](plugin_contracts.md).
5. `build_srd(core)` → albero `SRD/`. Snippet CSS che nasconde le `z.*`.

## Regole operative

- **Verifica** sempre con `npm test` (pytest) o `npm run check` / render standalone
  a stdout. **MAI** build sul vault dell'utente senza ok esplicito; **MAI** `rm` su `dist`.
- Build/commit/push solo con ok esplicito per-azione.
- Il build è **non distruttivo**: non tocca note utente in `Mondi/` né i plugin
  installati in `.obsidian/plugins/`.
