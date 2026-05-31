# Rules-engine PG (5.5e)

Il PG **diventa un creatore con regole applicate**: scegli classe/specie/
background e il wizard applica competenze, PF, ASI e privilegi iniziali,
salvando un frontmatter strutturato con **ID stabili** (non label).

## Flusso

```
SRD JSON (Dev/Source/SRD/srd_5_2_1_{classes,species,backgrounds,feats}.json)
  +  pg_rules.yaml  +  system.yaml (caratteristiche, abilita)
        │  build_personaggio.py (converter)
        ▼
  z.automazioni/data/personaggio.json   (opzioni del rules-engine)
        │  crea_pg.js (wizard Templater, a runtime)
        ▼
  frontmatter della nota PG  ──▶  pg.md.j2 / macro scheda_pg_rules()  (presentazione)
```

## 1. Converter (`build_personaggio.py`)

Fonde lo **strutturato** dell'SRD con l'**overlay curato** e *parsa la prosa*
dove serve. Output `personaggio.json`:

- `caratteristiche` (6), `abilita` (18, da system.yaml), `generazione_caratteristiche`.
- `classi[id]`: `dado_vita` (`"D12"`→12), `tiri_salvezza` (nomi→id), `abilita`
  `{scelte, opzioni}` — **parsato** dalla prosa SRD (`"Due a scelta tra …"` →
  count + lista; senza lista → tutte le 18). Validato su 12/12 classi.
- `specie[id]`: taglia, velocità (numerica), tratti.
- `background[id]`: `punteggi_caratteristica` (ASI), `talento_origine`,
  `competenze_abilita` (id).

## 2. Wizard (`crea_pg.js`)

Script Templater **autonomo**, separato da `create_entity.js`. Legge
`personaggio.json` con `app.vault.adapter.read`. Passi: nome → classe → specie →
background → caratteristiche (array standard / point-buy / manuale) → ASI del
background (+2/+1 o +1/+1/+1) → scelte-abilità di classe. Applica:

- **PF** = `dado_vita + mod(COS)` · **CA** = `10 + mod(DES)` · **competenza** = 2.
- **Frontmatter** con ID stabili: `classe`/`specie`/`background` = id; caratteristiche
  *flat* (`forza: 15`, compat con `scheda_pg`); competenze come **flag 0/1**
  `ts_<car>` (tiri salvezza) e `prof_<abilita>` (abilità) — così la scheda li usa
  in matematica Meta Bind. `nome` quotato.

## 3. Presentazione (`scheda_pg_rules()` in `_macros.j2`)

`pg.md.j2` chiama la macro che rende:

- **Caratteristiche** (tabella): Valore (`INPUT[number]`), Mod (`compute_into mod_<car>`),
  **TS** = `mod + ts_<car> * competenza`, toggle competenza (`inlineSelect` 0/1).
- **18 Abilità** (tabella): **Bonus** = `mod(car) + prof_<id> * competenza`, toggle
  competenza/maestria (0/1/2 — `prof=2` ⇒ 2×competenza).

I derivati sono **presentazionali** (VIEW/compute_into); le scelte strutturali
(quali competenze) sono nel frontmatter (flag), interrogabili da Dataview.

## Estendere

- Nuova classe/specie/background SRD → ricade automaticamente nel converter.
- Nuovo metodo di generazione o costi point-buy → `pg_rules.yaml`.
- Se la prosa SRD di una classe non si parsa → fallback `{scelte: 2, opzioni: tutte}`;
  i nomi-abilità si mappano dalle label (normalizzate) di `system.abilita`.

## Test

`test_personaggio_options` (parser 12/12 classi) e `test_crea_personaggio_e2e`
(mock di Templater via node: esegue il wizard e valida YAML + regole applicate).
