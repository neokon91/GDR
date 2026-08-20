# Audit — Copertura dei test e robustezza

**Ambito:** motori JS runtime (`Dev/Source/JS/**`) + pipeline Python (`Dev/Tools/**`).
**Metodo:** solo lettura. Incrociati gli export/rami di ogni motore con i test in `tests/*.py`
(≈172 funzioni `test_*`), verificando quali funzioni/rami sono *effettivamente* esercitati
dagli harness Node headless e da pytest. Nessun file di sorgente o di test è stato modificato.

**Legenda rischio:** 🔴 alto (può sbagliare in silenzio un output di gioco: PG, difficoltà,
stato del mondo) · 🟠 medio (rami d'errore / edge che degradano l'esperienza) · 🟢 basso.

Contesto armamentario di test già presente e riusabile:
- Harness "pure function": `new Function("module","exports",src)` su un bundle
  (`META_ACTIONS_JS`, `VIEWS_JS`) — vedi `tests/test_world_engine.py:308`.
- Harness "e2e con mock Obsidian": si iniettano `global.app`, `global.Notice`, un `file`
  fittizio e si cattura `app.vault.modify` — vedi `test_scaffold_statblock_e2e`
  (`tests/test_render_rules.py:154`) e `test_aggiorna_encounter_e2e` (`:104`).
- Harness "PG con mock Templater": `_run_crea_pg` in `tests/_common.py:53`.

Tutti i gap sotto sono colmabili con uno di questi tre pattern — non serve nuova infrastruttura.

---

## 🔴 Rischio ALTO

### A1 — `crea_pg` ↔ `sali_pg`: motore duplicato senza guardia anti-drift
**File:** `Dev/Source/JS/crea_pg.js` e `Dev/Source/JS/sali_pg.js`.
Sette funzioni-motore sono **copiate** nei due file e devono restare equivalenti:

| funzione | crea_pg.js | sali_pg.js |
|---|---|---|
| `mod` | L34 | L10 |
| `privilegiPerLivello` | L312 | L114 |
| `classeHomebrew` | L273 | L75 |
| `incantesimiHomebrew` | L236 | L38 |
| `fondiPool` | L249 | L51 |
| `applyConcede` | L326 | L128 |
| `risorseAtLevel` | L495 | L284 |

Verificato: **oggi coincidono** (a meno di whitespace/nome-parametro). Ma il repo ha una
sola guardia anti-drift fra motori gemelli — `test_forecast_heat_allineato`
(`tests/test_world_engine.py:329`, views vs meta_actions) — e **nessuna** per questa coppia.
`crea_pg.risorseAtLevel` è testato (`tests/test_pg.py:262`), la copia in `sali_pg` no.

**Cosa si rompe in-app senza accorgersene:** correggo un bug in `sali_pg` (es. `mod`, o
`risorseAtLevel` per una risorsa `caratteristica`) e dimentico la copia in `crea_pg`. Da quel
momento un PG **creato a L1** e lo **stesso PG salito a L1→L2** calcolano max-risorse/privilegi
in modo diverso: il foglio "salta" valori all'avanzamento. Nessun test rosso.

**Test proposto (pytest, node):** estrarre il corpo delle 7 funzioni dai due file (regex
`function <nome>(...){...}`), normalizzare whitespace/nome-parametro, e `assert` che la coppia
sia identica per ciascun nome — un guard di drift statico, come già fatto altrove.
In alternativa (più forte): harness node che carica entrambi i moduli e verifica
`crea.risorseAtLevel(R,liv,s) === sali.risorseAtLevel(R,liv,s)` e `crea.mod(v)===sali.mod(v)`
su un campione di input (compresi valori non numerici/negativi).

---

### A2 — `giro_del_mondo`: orchestrazione del mondo vivo mai eseguita end-to-end
**File:** `Dev/Source/JS/meta_actions/10_motori.js:115` (`giro_del_mondo`), con `cascata` (`:46`)
e `creaEventoConseguenza` (`:79`).
Testati solo i **nuclei puri**: `propagaShock` e `avanzamentoDaPressione`
(`test_motori_mondo_vivo`, `tests/test_world_engine.py:302`). L'orchestrazione — che *scrive
stato* sul vault — non è mai eseguita.

Invarianti scoperti, tutti nel corpo di `giro_del_mondo`:
- **Determinismo a due fasi** (L122–157): gli avanzamenti si calcolano sullo stato *pre-giro*;
  le onde di cascata **non** devono far ri-avanzare i clock nello stesso giro.
- **Ramo scadenza/deadline** (L129–135, `perche:"scadenza"`): un Fronte con `scadenza` scala il
  conto anche a clock fermo e a `scadA<=0` **scatta** pur senza clock pieno.
- **`sospesi`** (L152): Fronte pieno *senza* `conseguenza` → non scatta, va segnalato.
- **Cap 10 pressione** in `cascata` (L71: `Math.min(10, da+delta)`).

**Cosa si rompe:** un refactor su fase-1/fase-2 può far cascare le onde *dentro* il giro
(doppio avanzamento → il mondo "corre"), o far scattare un Fronte scaduto senza evento, o
perdere il ramo `sospesi`. In-app si manifesta come una Cronaca "Giro del mondo" con numeri
sbagliati o eventi mancanti: difficile da notare a occhio.

**Test proposto (pytest, node e2e):** riusare il pattern mock-Obsidian di
`test_scaffold_statblock_e2e`. `global.app.vault.getMarkdownFiles()` ritorna 2–3 Fronti finti
(uno con clock quasi pieno + conseguenza, uno con `scadenza:1` senza conseguenza, un vicino di
tensione), si stub-ba `updateFrontmatter`/`ensureFolder`/`app.vault.create` catturando gli
scritti, e si `assert`: (a) lo scattato genera l'evento e azzera il clock; (b) il vicino sale di
pressione **una sola volta**; (c) lo scaduto-senza-conseguenza finisce in `sospesi`; (d) la
pressione non supera 10.

---

### A3 — `renderEncounter`: motore difficoltà/budget XP non testato
**File:** `Dev/Source/JS/views/20_combat.js:43` (`renderEncounter`).
`xpForCreature` (L34) è testato (`test_encounter_xp`, `tests/test_render_rules.py:81`), ma la
**logica di budget e soglie** no: `grep -rn "renderEncounter\|Moderata\|oltre budget" tests/`
non trova nulla.

Rami scoperti (L64–74):
- selezione tier **Banale / Bassa / Moderata / Alta** su `bassa=b[0]*num` ecc.;
- ramo **`Alta ⚠️ (oltre budget)`** quando `totale > alta*1.5`;
- ramo "manca livello/numero gruppo" (L61).

**Cosa si rompe:** un errore di indicizzazione su `budget_2024[liv]` (le 3 fasce) o sul
moltiplicatore `*num`, o un `>=`/`>` invertito sulle soglie, mostra al DM una difficoltà
sbagliata (un incontro "Alta" etichettato "Moderata"). È un dato di gioco su cui il DM si fida.

**Test proposto (node, pure):** caricare `views` bundle, chiamare `renderEncounter` con un
`app`/`dv` mock (`loadCoreData` → `{xp:{budget_2024:{"3":[75,150,225]},cr_xp:{...}}}`), una
`page` con `pg_livello:3, pg_numero:4` e creature note, e `assert` sull'etichetta prodotta per
XP totali scelti apposta per cadere in ogni fascia + il caso `> alta*1.5`.

---

## 🟠 Rischio MEDIO

### M1 — `scaffold_statblock`: solo happy-path, rami d'errore/edge scoperti
**File:** `Dev/Source/JS/meta_actions/50_statblock.js:24` (+ `nearestBaseline` L12).
`test_scaffold_statblock_e2e` (`tests/test_render_rules.py:154`) copre un GS 5 esatto con blocco
presente. Non coperti:
- **`gs` assente** → Notice, nessuna scrittura (L27);
- **nessuna baseline** per quel GS (L30);
- **nessun blocco ```statblock```** nella nota (L35) — non deve corrompere il file;
- **`nearestBaseline` approssimato** (L12–22): GS senza voce esatta ripiega sul più vicino, e la
  nota tratto dovrebbe dire "(≈ GS x)" (L81);
- **GS frazionario** (`_gsNum` "1/2", L8) e la soglia multiattacco `nAtt` (L49–50): GS<2 → 1,
  ≥2 → 2, ≥11 → 3.

**Cosa si rompe:** un boss homebrew con GS "1/2" o "13" prende il numero di attacchi sbagliato,
o (peggio) scaffold su una nota senza blocco riscrive/duplica testo. Silenzioso.

**Test proposto:** stesso harness e2e, tre casi: `nearestBaseline` (tabella con solo GS 5,
richiesta GS 4 → usa 5 e testo "≈ GS 5"), GS "11" (`nAtt===3`), e nota **senza** blocco
statblock (`assert saved===null` e Notice).

### M2 — `aggiorna_encounter`: `varianti` e placeholder vuoto non esercitati
**File:** `Dev/Source/JS/meta_actions/20_encounter.js:44`, con `parseVarianti` (L1) e
`rigaCreatura` (L28).
L'e2e (`tests/test_render_rules.py:104`) copre conteggio/alleati, **non**:
- override `varianti` (`"[[Boss]]: pf 200, ca 18, init 5"` → riga posizionale `- 1: Boss, 200, 18, 5`;
  regola: `ca`/`init` solo se contigui a partire da `hp`, L29–34);
- alias IT `pf→hp`, `iniz→init` e separatore `:`/`=` (L12);
- **nessuna creatura collegata** → riga-placeholder `# Collega le creature…` (L66);
- **nessun blocco ```encounter```** → Notice, file intatto (L62).

**Cosa si rompe:** un boss potenziato via `varianti` tira i PF a caso (incontro non ripetibile)
se la sintassi posizionale si rompe. `parseVarianti`/`rigaCreatura` sono pure → test unit
diretto banale.

**Test proposto (node, pure):** unit su `parseVarianti`/`rigaCreatura` con casi buoni e
malformati (manca `:`, `ca` senza `hp`, alias); + un e2e con `varianti` in frontmatter che
verifica la riga posizionale e il ramo placeholder.

### M3 — `cascata`: wrapper I/O e cap-pressione non testati
**File:** `Dev/Source/JS/meta_actions/10_motori.js:46`.
`propagaShock` (nucleo) è testato; il wrapper che costruisce i `vicini` dai
`TENSION_FIELDS` (L10, L51–64), risolve i link e **applica** `pressione = min(10, da+delta)`
(L71) no. Anche `linkName` su link non risolti / campo scalare-vs-array (L57) è scoperto.

**Cosa si rompe:** un campo di tensione con valore scalare (non array) o un link a nota
inesistente potrebbe far saltare l'onda o superare il cap. **Test proposto:** e2e mock con
`getMarkdownFiles` + `updateFrontmatter` stubbato; sorgente con `rivali` scalare e un collegato
già a pressione 9 → verifica cap a 10 e digest coerente.

### M4 — `importa_mappa.parseSvgMap`: solo `translate`; rotazioni e label-su-curva scoperte
**File:** `Dev/Source/JS/importa_mappa.js:21` (`parseTransform`) e `:45` (`parseSvgMap`).
`test_importa_mappa_parse` (`tests/test_render_panels.py:719`) usa **solo** `translate` e testi a
parola intera. Scoperti:
- rami `rotate` (con centro, L30–33), `scale` (L29), `matrix` (L34) di `parseTransform` — pura
  algebra di matrici (`mulMat`/`applyMat`) mai verificata;
- ricostruzione **label su curva** da lettere singole con soglia di rottura `run.fs*2.5`
  (L98–116) e `collapseDouble` outline+fill (L91), `FLIP_Y` (L80).

**Cosa si rompe:** una mappa Watabou con gruppo ruotato piazza i pin nelle **coordinate
sbagliate**; una città con etichette curve frammenta i toponimi. Documentato come "LIMITE NOTO"
(L87) → esattamente ciò che un test dovrebbe fissare.

**Test proposto (node, pure):** `parseTransform("rotate(90 0 0)")` → matrice attesa;
`parseSvgMap` di un SVG con `<g transform="rotate(...)">` e una label composta da lettere
singole → `assert` sul nome ricomposto e sulla coord post-rotazione.

### M5 — `genera`: `pickWeighted` e `generaIncontro` (guardia anti-loop) scoperti
**File:** `Dev/Source/JS/genera.js:16` (`pickWeighted`), `:127` (`generaIncontro`).
Nessun test li tocca (`grep pickWeighted tests/` → 0).
- `pickWeighted` (L16–24): fallback su `pick` se `pesi` mancano/non combaciano o somma≤0, +
  distribuzione pesata. Con un `rng` deterministico è un unit banale.
- `generaIncontro` (L127–143): fallback fascia vuota (L134) e **guardia ricorsione `depth>5`**
  (L137) contro un template gen.yaml auto-referente (`{gancio}`→`{gancio}`).

**Cosa si rompe:** un `gen.yaml` malformato con riferimento circolare farebbe **hang** l'app
senza la guardia — che nessun test protegge. **Test proposto:** unit `pickWeighted` con rng
finto (verifica soglie e i tre fallback); `generaIncontro` con `forme:["{loop}"], loop:["{loop}"]`
→ deve terminare (stringa vuota, non stack overflow).

---

## 🟢 Rischio BASSO

### B1 — `parseAzgaar` / runtime `importa_azgaar`: sezioni mancanti e rami "assente"
**File:** `Dev/Source/JS/importa_azgaar.js:41` (parse), `:122` (runtime).
`parseAzgaar` è testato su un JSON ricco (`tests/test_render_panels.py:751`,`:791`). Meno coperti:
input **parziale** (senza `pack`, `states`, `biomesData`) — dovrebbe dare struttura vuota, non
throw; e i rami runtime "nessun .json" (L130), "nessun mondo" (L146), **JSON illeggibile** (catch
L136). Questi ultimi sono I/O ma seguono il pattern mock già in uso.
**Test proposto:** `parseAzgaar("{}")` e `parseAzgaar('{"pack":{}}')` → oggetto con array vuoti;
runtime e2e con `getFiles()` vuoto → Notice, nessuna `create`.

### B2 — `creaEventoConseguenza` / `scatena_conseguenza`: collisione nomi e ramo risolto/ricorrente
**File:** `Dev/Source/JS/meta_actions/10_motori.js:79`, `:177`.
Il loop anti-collisione del path (L84–85, `(2)`, `(3)`…) e la scelta `suggester`
risolto→archiviato vs ricorrente→clock 0 (L187–196) non sono testati. Rischio basso (l'utente
rivede le bozze), ma il ramo "archiviata" tocca lo stato dei cruscotti.

### B3 — Soglia "regola dei 3 indizi": testato solo il caso a rosso
**File:** `Dev/Source/JS/views/35_avventura.js:47`.
`test_render_panels.py:534` verifica il caso `🔴 2/3`. Il **confine di successo** (esattamente 3
→ `🟢`) non è asserito: un `>=`→`>` invertito passerebbe. Un secondo caso a 3 indizi chiuderebbe
il buco.

---

## Note trasversali sulla robustezza

- **Input malformati:** i nuclei puri gestiscono bene i tipi sporchi (`Number(x)||0`,
  scalare-vs-array), ma quasi nessun test *inietta* input malformati; la copertura è quasi tutta
  "dati buoni". I due guard-di-drift esistenti (`test_forecast_heat_allineato`,
  `validate_reciprocals`) sono il modello giusto da estendere (vedi A1).
- **Rami "plugin/nota assente":** i `new Notice("... non disponibile")` di
  `meta_actions/70_dispatch.js:74-131` e i vari "Vault non disponibile" non hanno test; sono a
  basso rischio ma a costo di test quasi nullo (chiamata con `module.exports` mancante).
- **Percorsi I/O (`app.vault.create/modify`):** dove un `try/catch` inghiotte l'errore
  ("collisione/cartella: salta", es. `importa_azgaar.js:161`, `importa_mappa.js:230`) non c'è
  test che verifichi che una collisione **non** produca duplicati o perdita silenziosa.

---

## Top 8 test mancanti (ordinati per rischio × costo)

1. **Guard anti-drift `crea_pg` ↔ `sali_pg`** — le 7 funzioni gemelle (`mod`,
   `risorseAtLevel`, `privilegiPerLivello`, `classeHomebrew`, `incantesimiHomebrew`,
   `fondiPool`, `applyConcede`) devono restare identiche/equivalenti. *(A1 — alto, costo basso)*
2. **`giro_del_mondo` e2e** — mock Obsidian: verifica due-fasi deterministico, ramo scadenza,
   `sospesi`, e cap-10 sulle onde. *(A2 — alto, costo medio)*
3. **`renderEncounter` — soglie di difficoltà** — Banale/Bassa/Moderata/Alta e
   `Alta ⚠️ (oltre budget)` su budget noti. *(A3 — alto, costo basso)*
4. **`parseVarianti`/`rigaCreatura` unit** — override `hp/ca/init`, alias IT, regola
   posizionale (ca/init solo contigui a hp) e input malformati. *(M2 — medio, costo basso)*
5. **`scaffold_statblock` edge/errori** — `nearestBaseline` approssimato, GS frazionario/≥11
   (`nAtt`), e nota senza blocco statblock (nessuna corruzione). *(M1 — medio, costo basso)*
6. **`importa_mappa` rotazioni** — `parseTransform` `rotate/scale/matrix` + una label-su-curva
   ricomposta, con `assert` sulle coordinate post-trasformazione. *(M4 — medio, costo medio)*
7. **`genera.pickWeighted` + guardia anti-loop di `generaIncontro`** — distribuzione pesata con
   rng deterministico e template auto-referente che deve terminare. *(M5 — medio, costo basso)*
8. **`cascata` wrapper I/O** — campo di tensione scalare + collegato a pressione 9 → cap a 10 e
   digest coerente. *(M3 — medio, costo medio)*
