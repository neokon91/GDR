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

- `caratteristiche` (6), `abilita` (18, da system.yaml), `generazione_caratteristiche`,
  `aumento_background`, `armature` (tabella CA: ca_base/dex_max), `lingue` (Comune + N).
- `classi[id]`: `dado_vita`, `tiri_salvezza`, `caratteristica_primaria`, `abilita`
  `{scelte, opzioni}` (**parsato** dalla prosa; 12/12 classi), `competenze_armi/armature`
  (+ `_cat` per la CA) `/strumenti`, `equipaggiamento` (A/B), `privilegi_l1`, `incantatore`,
  `trucchetti_noti`, `incantesimi_preparati`, `slot_l1`, `incantesimi_pool` (per livello
  `"0"`-`"9"`), **`progressione`** (1-20: competenza/privilegi/trucchetti/preparati/slot),
  `sottoclasse`, `livello_sottoclasse`, `livelli_asi`.
- `specie[id]`: taglia, velocità (numerica), tratti, `scurovisione`.
- `background[id]`: `punteggi_caratteristica` (ASI), `talento_origine`,
  `competenze_abilita` (id), `strumenti`.

## 2. Wizard (`crea_pg.js`)

Script Templater **autonomo**, separato da `create_entity.js`. Legge
`personaggio.json`. Passi: nome → classe → specie → background → caratteristiche
(array/point-buy/manuale) → ASI background → scelte-abilità di classe → equipaggiamento
A/B → armatura+scudo → lingue → incantesimi (caster). Applica (PG **di 1º livello
SRD-completo**):

- **PF** = `dado_vita + mod(COS)` · **CA** = dall'**armatura** indossata
  (`ca_base + min(mod DES, dex_max) + scudo`) · **competenza** = 2.
- **Specie**: `scurovisione` + `tratti_specie`. **Competenze**: `competenze_armi/armature/
  strumenti` + `lingue` (Comune + N). **Equipaggiamento** SRD (A/B) → `inventario`.
  **Privilegi** di classe L1. **Incantatore**: `trucchetti`/`incantesimi` (preparati) dal
  pool + `slot_1`. **Talento** d'origine dal background.
- **Frontmatter** con ID stabili: `classe`/`specie`/`background` = id; caratteristiche
  *flat*; competenze come **flag 0/1** `ts_<car>`/`prof_<abilita>` (matematica Meta Bind);
  `nome` quotato.
- **Preset archetipo** (categorie con `archetipi`): pre-compila i valori-assi + i tag
  `profilo/*` (vedi [play_layer](play_layer.md)).

## 3. Presentazione (`scheda_pg_rules()` in `_macros.j2`)

`pg.md.j2` chiama la macro che rende:

- **Caratteristiche** (tabella): Valore (`INPUT[number]`), Mod (`compute_into mod_<car>`),
  **TS** = `mod + ts_<car> * competenza`, toggle competenza (`inlineSelect` 0/1).
- **18 Abilità** (tabella): **Bonus** = `mod(car) + prof_<id> * competenza`, toggle
  competenza/maestria (0/1/2 — `prof=2` ⇒ 2×competenza).

I derivati sono **presentazionali** (VIEW/compute_into); le scelte strutturali
(quali competenze) sono nel frontmatter (flag), interrogabili da Dataview.

## 4. Sali di livello 2-20 (`sali_pg.js`)

Motore di level-up **interattivo** (`tp.user.sali_pg`, richiamato dal bottone *Sali di
livello* via `meta_actions`). Legge `personaggio.json` + il frontmatter del PG attivo,
applica il livello successivo dalla `progressione` della classe:

- **Deterministico**: PF += `floor(dado_vita/2)+1 + mod(COS)` (media fissa); `competenza`,
  `slot_<n>` dalla riga di progressione; `livello`.
- **Scelte guidate**: ASI ai `livelli_asi` (`+2` / `+1+1` / talento), `sottoclasse` al
  `livello_sottoclasse` (l'SRD ne ha una per classe), nuovi `trucchetti`/`incantesimi`
  dal pool (fino al max livello castabile) quando i conteggi crescono.
- Scrive via `app.fileManager.processFrontMatter`. La vista `renderProgressione` (scheda PG)
  mostra i privilegi acquisiti + l'anteprima del livello successivo.

## Estendere

- Nuova classe/specie/background SRD → ricade automaticamente nel converter.
- Nuovo metodo di generazione o costi point-buy → `pg_rules.yaml`.
- Se la prosa SRD di una classe non si parsa → fallback `{scelte: 2, opzioni: tutte}`;
  i nomi-abilità si mappano dalle label (normalizzate) di `system.abilita`.

## Test

Mock di Templater via node (eseguono i wizard reali e validano YAML + regole):
`test_personaggio_options` (parser 12/12 classi), `test_crea_personaggio_e2e` +
`test_crea_personaggio_caster_e2e` (creazione, anche caster), `test_preset_valori`
(preset archetipo), `test_sali_pg_e2e` (mago L1→L2).
