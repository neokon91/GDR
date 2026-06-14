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
- **Risorse di classe a ricarica** (`risorse`, da `risorseAtLevel`): Ki/Furia/Incanalare divinità/
  Ispirazione bardica/… + **Patto del Warlock** (slot separati). `views.renderRisorsePG` le disegna
  a barre; il bottone *Usa risorsa* (`meta_actions.usa_risorsa`) spende un uso, i **riposi** azzerano.
- **Homebrew `concede`**: un talento o un **privilegio di classe** con blocco `concede` strutturato
  (caratteristica +N cap 20 / abilità→`prof_<id>` / armi-armature-strumenti) lo **applica** già a
  creazione (`applyConcede`, sorgente condivisa `_homebrew_bridge.js`); i freeform restano prosa.
- **Frontmatter** con ID stabili: `classe`/`specie`/`background` = id; caratteristiche
  *flat*; competenze come **flag 0/1** `ts_<car>`/`prof_<abilita>` (matematica Meta Bind);
  `nome` quotato. **Seed di gioco**: `dado_vita`/`dadi_vita_max: 1` (tracker Dadi Vita) e
  `mod_<car>` (pre-seedato per i tiri Dice Roller `dice: 1d20 + mod_<car>`).
- **Preset archetipo** (categorie con `archetipi`): pre-compila i valori-assi + i tag
  `profilo/*` (vedi [play_layer](play_layer.md)).
- **Resiliente all'annullamento**: un Escape a metà wizard (sentinella `CANCEL`, corpo
  in `costruisciPG`) degrada a una **bozza valida**, mai un frontmatter corrotto.

## 3. Presentazione (`scheda_pg_rules()` in `_macros.j2`)

`pg.md.j2` chiama la macro che rende:

- **Caratteristiche** (tabella): Valore (`INPUT[number]`), Mod (`compute_into mod_<car>`),
  **Prova 🎲** e **TS 🎲** = tiri Dice Roller col bonus reale (`dice: 1d20 + mod_<car>`,
  `+ ts_<car> * competenza`), toggle competenza (`inlineSelect` 0/1).
- **18 Abilità** (tabella): **Bonus** = `mod(car) + prof_<id> * competenza` + **Tiro 🎲**
  (`dice: 1d20 + mod_<car> + prof_<id> * competenza`), toggle competenza/maestria (0/1/2).
- **Risorse al tavolo**: TS contro morte (+ tiro `dice: 1d20`), **Esaurimento** 2024,
  **Ispirazione eroica** (toggle 2024), tracker **Dadi Vita** (`dadi_vita_spesi`/`dadi_vita_max`),
  **🌀 Concentrazione** (`concentrazione_su`), tabella **slot incantesimo**, bottoni
  **Riposo breve/lungo**. Barre proporzionali **PF/Dadi Vita/Esaurimento** via JS Engine
  (`views.renderRisorsePG`, max variabile a runtime — il `progressBar` di Meta Bind accetta
  solo max letterali, issue #323).
- **Incantesimi** (`views.renderIncantesimi`): elenco per livello con slot residui,
  🌀 concentrazione / 📿 rituale, e testata **CD incantesimo** (8+PB+mod) + **bonus
  d'attacco** (PB+mod), con caratteristica da incantatore = prima MENTALE fra le primarie
  della classe (SRD + homebrew).

I tiri Dice Roller leggono i campi dal frontmatter (`mod_<car>`/`ts_<car>`/`prof_<id>`/
`competenza`); le scelte strutturali restano flag interrogabili da Dataview.

## 4. Sali di livello 2-20 (`sali_pg.js`)

Motore di level-up **interattivo** (`tp.user.sali_pg`, richiamato dal bottone *Sali di
livello* via `meta_actions`). Legge `personaggio.json` + il frontmatter del PG attivo,
applica il livello successivo dalla `progressione` della classe:

- **Deterministico**: PF += `floor(dado_vita/2)+1 + mod(COS)` (media fissa) **della classe che
  sale**; `competenza`, `slot_<n>` dalla riga di progressione; `livello`/`dadi_vita_max` dal
  TOTALE. Dopo un ASI risincronizza `mod_<car>`; se l'ASI o un `concede` **alza il mod di COS**, i
  PF si ricalcolano su **tutti** i livelli (+1/livello, RAW), non solo sul nuovo.
- **Scelte guidate**: ASI ai `livelli_asi` (`+2` / `+1+1` / talento — i talenti sono
  **filtrati per categoria 2024**: solo *Generali*, e *Doni epici* dal livello 19, via
  `sali_pg.talentoAmmesso`; *Origine* viene dal background, *Stile di combattimento* dai
  privilegi di classe), `sottoclasse` al `livello_sottoclasse` (l'SRD ne ha una per
  classe), nuovi `trucchetti`/`incantesimi` dal pool (fino al max livello castabile) quando i conteggi crescono.
- **Multiclasse** (`__multiclasse__`): scegli una **nuova** classe → **prerequisiti RAW** bloccanti
  (`multiclassGate`), competenze parziali, poi entra nel `breakdown` `[{id, livello, sottoclasse}]`.
  Gli slot vengono dalla **tabella multiclasse** SRD (`leveledSlots` su `combinedCasterLevel` dei
  soli caster); il **Patto del Warlock** resta separato (`pactSlots`).
- **Privilegi di classe homebrew per-livello** col blocco `concede`: applicati al livello giusto
  (`applyConcede`, gemello di `crea_pg` — parità imposta da `check()`); i freeform restano prosa.
- Scrive via `app.fileManager.processFrontMatter`. La vista `renderProgressione` (scheda PG)
  mostra i privilegi acquisiti + l'anteprima del livello successivo.

## Estendere

- Nuova classe/specie/background SRD → ricade automaticamente nel converter.
- **Background homebrew** 2024-legale: il wizard impone ASI (3 caratteristiche), 2 abilità,
  1 strumento e un **Talento d'Origine** (campi `required`); `crea_pg` non crea PG con un
  basename vuoto/duplicato (`tp.file.exists` + nome obbligatorio con retry).
- Nuovo metodo di generazione o costi point-buy → `pg_rules.yaml`.
- Se la prosa SRD di una classe non si parsa → fallback `{scelte: 2, opzioni: tutte}`;
  i nomi-abilità si mappano dalle label (normalizzate) di `system.abilita`.

## Test

Mock di Templater via node (eseguono i wizard reali e validano YAML + regole):
`test_personaggio_options` (parser 12/12 classi); `test_crea_personaggio_e2e`/`_caster_e2e`/
`_risorse_e2e`/`_padronanze` + `test_risorse_at_level` (creazione, anche caster/risorse/maestrie);
`test_applyconcede_homebrew_effetti` + `test_privilegi_per_livello` (homebrew `concede`);
`test_multiclasse_funzioni` + `test_sali_pg_multiclasse_e2e`/`_prereq_blocca` (multiclasse +
prereq RAW); `test_sali_pg_asi_costituzione_pf_retroattivi` (PF retroattivi su ASI-COS); e i
`test_crea_pg_annullamento*`/`_nome_*` (resilienza all'annullamento e ai nomi).
