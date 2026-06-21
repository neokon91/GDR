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
  `folders[id]`, `categories[id]={folder, gruppo, subtypes, subtype_profiles?, famiglie?}`,
  `fields`, `scheda[id]`, `assi_tematici[id]`, `relazioni[id]`, `creation[id]`,
  `archetipi[id]`, `guida[id]`. Gli **assi** e gli **archetipi** sono scorporati in
  `YAML/assi/<id>.yaml` (rifusi qui).
  - `subtypes` è normalizzato a lista di NOMI (back-compat: select/fileClass/wizard la
    usano); se una voce è un oggetto-profilo, la mappa nome→profilo va in
    `subtype_profiles` (vedi *Gruppi e profili-sottotipo*).

## `core.yaml` — globali worldbuilding

| Sezione | Contenuto |
|---|---|
| `fields` | Registro centrale `{id: {label, widget}}`. `widget` = `text`/`number` → `INPUT[...]`; altrimenti nome di un template Meta Bind (vedi `plugins.yaml:metabind_inputs`). |
| `gruppi` | Lista ordinata `{id, label, icona, descrizione}` — la mappa concettuale (cornice/geografia/tempo/società/cosmo/regole/tavolo). Ogni entità dichiara il suo `gruppo`; guida Home/indici. |
| `tavolo` | Superficie giocabile: lista `{field, callout, title, fold?}`. |
| `states` | Stati del flusso (`bozza`/`pronto`/…) → Select `stato`. |
| `fronte_categorie` | Categorie che possono essere un **Fronte**: solo qui `tavolo()` espone la macchina del clock (pressione/clock/conseguenza/Avanza-Scatena/pannelli). Le altre tengono Uso al tavolo/Gancio/Condivisione, senza Fronte. Deve contenere il set COSMO di `views.js`. |
| `tappe_categorie` · `coerenza_categorie` · `ritratto_categorie` | Allowlist di categorie che ricevono, rispettivamente, la tab Cronologia (`renderTappe`), il motore di coerenza (`renderCoerenza`) e il selettore ritratto nell'infobox. Validate impone che nominino categorie reali. |
| `spunti` | Domande-stimolo per categoria → confluite nel callout **ℹ️ Guida** (`guida()`). |

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
gruppo: societa             # gruppo concettuale (= un id di core.gruppi)
templates:                  # uno o più template di creazione (category = id)
  - { id, title, default_type, target, jinja, primary? }
subtypes:                   # forma 1: lista di NOMI (semplice)
  - gilda
  - ordine
# forma 2: oggetti-PROFILO (campi/clock/evoluzione dedicati per sottotipo)
#  - { nome: gilda, descrizione: "…", campi: [mestiere], clock: true, evoluzione: true }
#    campi  = id di campi REGISTRATI, mostrati da renderTipoProfilo secondo il `tipo`
#    clock  = il sottotipo è un Fronte? · evoluzione = cambia tra le epoche?
famiglie:                   # (opzionale) classificazione a 2 livelli (tema curato)
  - { nome, descrizione, assi? }   # 'assi':{asseId:1-5} = preset assi in creazione
fields:                     # (opzionale) campi esclusivi dell'entità
  motto: { label: Motto, widget: text }
scheda: [portata, motto, …] # campi mostrati dalla macro scheda()
guida:                      # (opzionale) callout ℹ️ Guida = onboarding per-entità
  scopo: "cos'è / a cosa serve al tavolo (1 frase)"
  campi_chiave: "i 2-4 campi da impostare per primi e cosa fanno"
relazioni:                  # link tipizzati (macro relazioni())
  - { field, label, category, multi?, reciprocal? }
    # reciprocal: nome del campo INVERSO sul target, scritto da Collega E dal wizard di
    # creazione (logica condivisa _relations.js: inverseRelation). Serve quando l'auto-derivazione è ambigua:
    # simmetrico (luogo.confina_con↔confina_con, rotta_con↔rotta_con; opposti/affini same-type:
    #   dominio.domini_opposti, legge_fondamentale.legge_opposta, divinita.alleati, piano.piani_adiacenti,
    #   mito.varianti) o direzionale (evento.causato_da↔conseguenze, epoca.precede↔segue,
    #   lingua.derivata_da↔lingue_figlie). Senza, l'inverso è auto-derivato
    # se la coppia è univoca, altrimenti generico (connessioni).
creation:                   # wizard (letto da create_entity.js / generato)
  fields: [ { field, prompt, from?, category?, link?, required?, optional?, multi? } ]
  body:   [ { field, prompt, heading? | callout?+title?+fold? } ]
```

`from`: `subtypes` (suggester sui subtypes) · `notes`+`category`+`link` (suggester
sulle note di quella categoria → link `[[..]]`) · `list`+`options` · `number` (prompt
numerico, salvato come numero) · default = testo libero. I valori ammessi sono
enumerati e validati (vedi sotto).

**Assi & archetipi** vivono in `YAML/assi/<id>.yaml` (scorporati, rifusi da `load_entities`):
`assi:` formato ricco `{id, nome, descrizione, valori:{1..5:{etichetta, descrizione}}}`
(macro `carattere()` + radar); `archetipi:` `{id, nome, quando:{asse: comparatore}, tag}`
(tag-da-assi + preset in creazione, vedi [play_layer](play_layer.md)).

## Gruppi e profili-sottotipo (tassonomia a 3 strati)

La tassonomia ha tre strati, dal più largo al più stretto:

1. **gruppo** (`core.gruppi`) — la famiglia concettuale: *cornice / geografia / tempo /
   società / cosmo / regole / al tavolo*. Ogni entità ne dichiara uno (`gruppo:`); guida
   navigazione e Home (sezione «Crea» raggruppata).
2. **tipo** (subtype) — la forma/natura dentro l'entità. Può essere un semplice nome **o**
   un **profilo** `{nome, descrizione, campi, wizard, clock, evoluzione}`:
   - `campi`: id di campi **registrati** (in `fields`), che `views.renderTipoProfilo`
     mostra (valore dal frontmatter) SOLO quando la nota ha quel `tipo` — reattivo;
   - `clock`/`evoluzione`: flag-guida (se il sottotipo è un Fronte / cambia tra le epoche);
   - i campi del profilo si editano dal pannello **Proprietà** (chiavi di frontmatter):
     vincolo Meta Bind — gli `INPUT[...]` editabili vivono nel sorgente, non iniettati da JS.
   - Esempi: `luogo` (continente→regione→insediamento[servizi/quartieri]→dungeon[clock]…),
     `regno` (monarchia/impero/repubblica/teocrazia/magocrazia/…), `fazione`
     (gilda/ordine/banda/…). Per le entità SRD (`oggetto`) il `tipo` **instrada** i campi
     meccanici esistenti (arma→danni/padronanza), senza ridefinirli.
3. **famiglia** (`famiglie`) — dimensione tematica ortogonale (natura/indole), col preset-assi.

Il pannello vive nel tab Lore (gated: `{% if categories[cat].subtype_profiles %}`), reso
dalla macro `tipo_profilo()` → `boot.mjs:PANELS.renderTipoProfilo` (guardato da
`test_panels_registered`).

## Principio di inclusione — cosa diventa un'entità

Il modello *tende a crescere*: ogni concetto di lore "vorrebbe" una categoria propria.
Questa regola è l'**arbitro**, per non oscillare fra «aggiungi tutto» e «pota tutto»
(le due facce della stessa mancanza — vedi la lezione *audit-discernment* nelle memorie).

> **Una cosa diventa una `entità` (un file in `entities/`) *se e solo se* ha entrambe:**
> 1. **relazioni tipizzate proprie** — altri tipi la linkano in modo *specifico* (non solo «vedi anche»); **e**
> 2. **superficie giocabile propria** — espone al tavolo qualcosa di *suo* (`uso_al_tavolo`/`gancio`/`pressione`/`statblock`/…).

Altrimenti **non** è un'entità:

| Ha (1) relazioni proprie? | Ha (2) superficie giocabile? | → È un… |
|:--|:--|:--|
| sì | sì | **entità** (categoria in `entities/`) |
| sì | no | **campo / relazione** su un'entità esistente |
| no | sì | **subtype** o **tag** di un'entità esistente |
| no | no | **prosa** dentro una nota (heading/callout) — non un nodo del grafo |

Esempi: `luogo` e `culto` superano (1)+(2) → entità ✓. «rito» descrive un culto e non ha
superficie propria → heading nel culto. «titolo nobiliare» → tag/campo su personaggio.

**Cluster politico-organizzativo — dirimuto con questa regola (SYS-2).** Applicato il test a
`fazione`/`istituzione`/`regno`/`dominio`/`culto`:
- `fazione` ✓ (hub), `regno` ✓ (territoriale: `capitale`/`territori`, distinto dall'organizzativo),
  `culto` ✓ (gancio cosmologico: `divinita`/`luogo_sacro`), `dominio` ✓ (cosmico — la collisione
  di nome col "dominio politico" era già risolta: rinominato `feudo`, subtype di `regno`).
- `istituzione` ✗ → **collassata in `fazione`**: era una fazione con un legame al `regno`
  (subtypes `accademia`/`corte`/`tribunale`; l'asse `integrità` e il legame `regno`/`simbolo`
  migrati su fazione). `fazione` aveva già l'archetipo "Corpo ufficiale".
- igiene: rimosso `culto` dai subtypes di `fazione` (è entità a sé; il braccio politico è il
  link `culto.fazione`).

Lato simmetrico: la profondità che *supera* (1)+(2) **non** è bloat. La regola taglia
ciò che non li supera, non ciò che il mondo richiede davvero.

## Overlay e altri file

| File | Ruolo |
|---|---|
| `pg_rules.yaml` | Overlay curato del rules-engine PG: `generazione_caratteristiche` (array/point-buy), `aumento_background`, `armature` (CA), `lingue`. (Le abilità stanno in `system.yaml`.) |
| `templates.yaml` | Solo `actions` (bottoni su nota esistente); i template di creazione sono nei file-entità. |
| `pages.yaml` | Pagine-indice (hub per dominio) → `index.md.j2`. |
| `plugins.yaml` | `plugins`, `metabind_inputs`, `buttons` (`action` o `command`), `folder_icons`, `callouts`. |
| `astrologia.yaml` | Catalogo tema natale (segni/arcani/elementi) → `core.json` (`views.renderTemaNatale`). |
| `generatori.yaml` | Generatore homebrew di nomi/spunti (stili/affissi/forme + tesoro SRD) → `core.json` (`genera.js`). |

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
- **gruppi**: ogni categoria dichiara un `gruppo` ∈ `core.gruppi`; gli allowlist
  `fronte_/tappe_/coerenza_/ritratto_categorie` nominano solo categorie dichiarate;
  i `campi` dei `subtype_profiles` sono campi registrati (`fields`).
- **entità**: nessuna collisione id-categoria/campo con core/system; template con id/title/jinja/target.
- **schema wizard** (`validate_entity_schema`): `from` ∈ {subtypes, list, notes, number};
  `from:list` deve avere `options`; `from:notes` una `category` esistente; un campo non può
  dichiarare insieme `required` e `optional`.
- **YAML ausiliari** (`validate_aux_yaml`): shape di astrologia (e `segno.elemento` ∈ `elementi`),
  generatori, pg_rules (`point_buy.costi`, `array_standard.valori`, `armatura.dex_max`).
- **sorgenti `_*.js`**: le copie marcate di `matchesCond` (views/meta_actions), del ponte
  homebrew (crea_pg/sali_pg) e della derivazione inversi `reciprocalField`/`inverseRelation`
  (meta_actions/create_entity) coincidono byte-a-byte con `_comparators.js` /
  `_homebrew_bridge.js` / `_relations.js`.

> **Campi-frontmatter fuori dal modello**: alcune chiavi che l'utente scrive nelle note non
> entrano in `core` ma sono lette da altri strati — es. `visibilita: dm` / `pubblico: false`
> escludono la nota dal **sito dei giocatori** (`build_site.is_public`).
