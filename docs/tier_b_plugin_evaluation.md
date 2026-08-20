# Tier B — valutazione: spedire un vero plugin Obsidian

> Domanda: possiamo spingere la UI (oggi Templater + JS Engine + Meta Bind) fino a
> «una vera app»? Questa è la valutazione del salto a **plugin Obsidian nativo** (TS +
> build), con numeri presi dal codice — non a naso.

## Il fatto che cambia tutto

Il runtime **è già scritto contro l'API nativa di Obsidian**, non contro un'astrazione:
100+ chiamate dirette a `app.metadataCache` / `app.vault` / `app.fileManager.processFrontMatter`
/ `app.workspace`. L'accoppiamento a Templater/JS-Engine è una **shell sottile**:

| Superficie | Siti | In un plugin diventa |
|---|---|---|
| `tp.system.suggester` (×41) | ~41 | `SuggestModal` / `FuzzySuggestModal` |
| `tp.system.prompt` (×9) | ~9 | `Modal` custom |
| `tp.file.move` / `.exists` | ~6 | `app.fileManager.renameFile` / `vault` |
| `tp.user.<script>` | ~20 | chiamata diretta a funzione (già `module.exports = fn`) |
| `engine.markdown` / `.reactive` / `.importJs` (×14) | ~14 | `MarkdownRenderer.render` / reattività propria / import |
| `app.*` nativo (×100+) | — | **invariato** |

Conseguenza: **non è un rewrite**. ~6.800 righe di logica restano; si riscrive la shell
(~70 siti `tp.*` + 14 `engine.*`) e si aggiunge il guscio-plugin.

## Il turnkey NON si rompe — si semplifica

`fetch_plugins.py` bundla i plugin community come `.obsidian/plugins/<id>/{main.js,manifest.json,styles.css}`
scaricati dalle GitHub release. **Un nostro plugin `gdr` è esattamente quella forma** — ma
lo spediamo noi (`main.js` già nel vault, niente download, niente gate di rete). Quindi il
plugin proprio **si infila nel modello di distribuzione esistente**, non lo contraddice.

Ciò che il salto rompe davvero è un **principio di sviluppo**, non la distribuzione:
- README: «I JS sono autonomi (niente bundling)» → non più vero: entra un toolchain TS + esbuild.
- La semplicità «apri il `.js`, è quello che gira» → si perde (sorgente TS ≠ `main.js` spedito).

## Tre opzioni reali (non due)

### B1 — Plugin totale (sostituisce Templater + JS Engine + Meta Bind)
Controllo massimo, ma **cambia il formato delle note generate** (gli `INPUT[…]`/`VIEW[…]`
Meta Bind diventano widget del plugin) e droppa 2-3 plugin community. Il più invasivo.

### B2 — Plugin-motore sottile *(il punto dolce)*
Un solo plugin `gdr` che **ospita viste + azioni** (rimpiazza `engine.*` e l'invocazione
`tp.user.*`/suggester/prompt) e **tiene Meta Bind** per gli input dichiarativi sul frontmatter.
- Le note generate tengono `INPUT[…]`/`VIEW[…]`; solo i blocchi ` ```js-engine ` (×32)
  diventano ` ```gdr ` gestiti da `registerMarkdownCodeBlockProcessor`.
- Migra ~70 `tp.*` + 14 `engine.*`; conserva le ~6.800 righe di logica e i test node headless
  (la logica resta JS/TS puro → l'harness e l'anti-drift continuano a valere).
- Distribuzione via bundle turnkey (spediamo `main.js`): **nessuna review dello store**.

### B3 — Restare Tier A (niente plugin)
Spingere reattività/interazioni dentro lo stack attuale. Zero toolchain nuovo.

## Cosa sblocca SOLO il Tier B (che il Tier A non può dare)

- **Command palette + hotkey globali**, icona **ribbon**, **status bar**.
- **Tab Impostazioni** nativa (config del sistema senza note-di-config).
- **`ItemView`**: pannelli/sidebar dedicati «da app» (un vero cruscotto DM in un pane laterale).
- **Reattività vera event-driven**: `metadataCache.on("changed")` → le viste si ridisegnano
  da sole (oggi rendono una volta).
- **Meno dipendenze bundlate** (via Templater/JS-Engine) = meno punti di rottura al primo avvio.

## Costi e rischi

- **Toolchain**: progetto TS + esbuild + manifest; il `render.py` deve bundlare nel plugin
  invece di copiare i `.js`, e la Jinja emette ` ```gdr ` invece di `js-engine`.
- **Manutenzione**: seguire il churn dell'API Obsidian (breaking fra versioni).
- **Migrazione note**: se si tocca il formato (B1), i vault utente esistenti vanno migrati —
  impatto basso ora (release 0.1.0, base utenti minima), crescente col tempo.
- **Perdita della trasparenza** «il `.js` è il codice» cara al progetto.

## Raccomandazione

**B2 (plugin-motore sottile)** è il punto dolce: è l'unica opzione che sblocca gli affordance
«da app» (comandi, hotkey, ribbon, settings, `ItemView`, reattività vera) **mantenendo** ~90%
della logica, i test/anti-drift e il modello di distribuzione turnkey. Il costo reale è **uno**:
introdurre un toolchain TS/build (e rinunciare al principio «niente bundling»).

- Scegli **B2** se «da app» (hotkey/ribbon/settings/pane dedicato) vale il toolchain.
- Scegli **B1** solo se vuoi anche liberarti di Meta Bind.
- Resta su **B3/Tier A** se il costo-toolchain non è ancora giustificato: gran parte della
  reattività si ottiene già con `engine.reactive` + re-render su interazione.

### Se si procede con B2 — primo spike (dimostrativo, ~1 giornata)
1. Scaffold `plugin/` (manifest + esbuild) che produce `.obsidian/plugins/gdr/main.js`.
2. `registerMarkdownCodeBlockProcessor("gdr", …)` che chiama **una** vista esistente
   (es. `renderRisorsePG`) importando la logica JS attuale senza modificarla.
3. Un `addCommand` + hotkey che invoca `meta_actions` (es. «Aggiorna l'incontro»).
4. Reattività: sottoscrivere `metadataCache.on("changed")` e ridisegnare il blocco.

Se lo spike convince, si estende vista-per-vista dietro un flag, tenendo il percorso
js-engine come fallback finché la parità non è completa.

## Spike VALIDATO dal vivo (2026-08-20)

Lo spike in [`../plugin/`](../plugin/) è stato costruito e provato in Obsidian su
`dist/GDR-vault`. Tutti e tre i proof-point confermati:
1. **Blocco ` ```gdr renderRisorsePG `** reso dal plugin (riuso di `views.js` invariato).
2. **Comando + hotkey + ribbon** «GDR: Riposo lungo» → dispatcher `meta_actions(tp, "riposo_lungo")`.
3. **Re-render reattivo**: dopo il comando le barre risorse sono passate da PF 9/24·Ki 0/3
   a **PF 24/24·Ki 3/3 da sole**, senza riaprire la nota.
4. **Cruscotto DM (`ItemView`)**: pannello laterale persistente con sezioni riusate
   (`renderStatoMondo`/`renderTensioni`/`renderProiezione`) e azioni rapide. Il bottone «Giro
   del mondo» ha eseguito il motore (2 fronti avanzati, 1 scattato, nota-cronaca creata) e il
   **cruscotto si è ridisegnato da solo** (da «1 sotto pressione» a «3»). Cold-start di
   Dataview reso robusto via l'evento `dataview:index-ready`.

Lezione tecnica emersa (rilevante per il B2 completo): `renderRisorsePG` legge la **page
di Dataview**, che reindicizza *in ritardo* rispetto a `metadataCache 'changed'` → il primo
re-render mostrava valori stale. Fix: **sovrapporre il frontmatter fresco** di
`metadataCache.getFileCache().frontmatter` alla page. Per le viste che usano davvero l'API
Dataview (`renderEntityPanel`, `renderConnessioni`…) il B2 dovrà anche sottoscrivere l'evento
di reindicizzazione di Dataview, oppure leggere il frontmatter direttamente come fa il radar.

## #5 — Integrazione build (impostato, 2026-08-20)

Il passo strutturale è in piedi. Cosa è stato fatto (462 test verdi, default invariato):

- **Il vault spedisce il plugin**: `render.py` (`install_authored_plugins()`) copia
  `plugin/{main.js,manifest.json,styles.css}` in `.obsidian/plugins/gdr/` e lo abilita in
  `community-plugins.json`. Idempotente; se `plugin/main.js` manca, avvisa e salta (build
  senza toolchain resta valida). Turnkey: `npm run dist` builda prima il plugin
  (`build:plugin`) → lo zip di release lo include come gli altri plugin.
- **Il plugin sussume `boot.mjs`**: `PANELS` è ora `export`ato da `boot.mjs` e **importato**
  dal plugin (bundlato da esbuild, tree-shakato) → **una sola sorgente** della mappa pannelli,
  niente più duplicazione.
- **`render.py` può emettere ` ```gdr `** dietro il flag `GDR_PLUGIN_BLOCKS=1` (env var; default
  OFF = coesistenza js-engine). Tutti i **30 punti di emissione dei pannelli** passano ora per
  un'unica macro `vista(fn)` (Jinja) che ramifica sul flag; a flag OFF l'output è
  **byte-identico** (snapshot invariati), a flag ON i 30 pannelli diventano ` ```gdr `.

**Follow-up per la parità completa** — i tre nominati sono **fatti e validati dal vivo**:
- ✅ **Radar**: il processor ` ```gdr ` gestisce ora anche `radar <category>` (riusa
  `views.radarMarkdownFromValues`), reattivo. La macro `grafico_assi` ramifica sul flag.
  A flag ON il pipeline dei template non lascia **alcun** blocco js-engine (verificato).
- ✅ **Viste Dataview-dipendenti**: il code-block reattivo sottoscrive anche
  `dataview:metadata-change` → i dati derivati dal grafo si aggiornano al reindex.
- ✅ **`tp.system.suggester/prompt` → native**: `SuggestModal`/`Modal` nel plugin; il
  `tpShim` le espone, così il dispatcher gira le azioni **interattive** (collega,
  aggiorna_encounter, applica_profilo…) senza Templater. Registrate come comandi nativi
  (con hotkey): Riposo lungo/breve, Collega, Aggiorna l'incontro, Segna come canonico,
  Giro del mondo. Provato dal vivo: «Collega» apre il suggester nativo «Tipo di relazione».

## Flag ON di default (2026-08-20)

Il flag `GDR_PLUGIN_BLOCKS` è ora **ON di default** (`render.py`; disattiva con
`GDR_PLUGIN_BLOCKS=0`). Conseguenze applicate e validate:

- Il pipeline dei template emette ` ```gdr ` (pannelli **e** radar) resi dal plugin `gdr`,
  che il build spedisce e abilita. **Zero blocchi js-engine** nel vault dopo il re-seed
  (`node seed_example.js --force`, 68 note ` ```gdr `).
- **Test allineati**: `tests/_common._env()` delega a `render.jinja_env()` → gli snapshot
  riflettono i blocchi ` ```gdr ` reali (rigenerati, 462 verdi).
- **js-engine declassato a `critico: false`** in `plugins.yaml`: resta bundlato come
  *fallback* (per l'opt-out `GDR_PLUGIN_BLOCKS=0`), non più gate essenziale. La Diagnostica
  non lo elenca più come critico.
- **Validato dal vivo**: aperto **Korbin** (PG seed) nel vault di default → infobox, tab,
  pannelli risorse, radar, Dice Roller rendono tutti via plugin, senza js-engine.

### Migrazione wizard + azioni (fatta, 2026-08-20)

Il **mini-motore di istanziazione template** è nel plugin e valida dal vivo:
- **Creazione** senza Templater: `createFromTemplate(id)` legge il template `z.modelli/`,
  esegue il wizard (`crea_pg` bespoke o `create_entity`) col `tpShim` esteso — `tp.file.move`
  **registra** la destinazione (niente nota provvisoria), la nota si crea alla fine componendo
  `frontmatter (ritorno) + corpo del template` (rimpiazza la riga `<% await tp.user.crea_X %>`
  e `<% tp.config.target_file.basename %>`). Provato: «Crea Nota Rapida» → prompt+suggester
  nativi → nota creata in `Inbox/`.
- **`tpShim` esteso**: `system.suggester/prompt` (SuggestModal/Modal), `date.now`,
  `file.move/exists`, e un proxy `tp.user.<name>` che carica lazy gli script da z.automazioni.
- **Comandi** `gdr:crea-<id>` per ogni template + `gdr:<azione>` per 17 azioni del dispatcher.
  `render_config/model_cfg.py` (dietro flag) instrada i **bottoni** Meta Bind: `crea-*` →
  `command gdr:crea-*`, e i bottoni-azione gestiti → `command gdr:<azione>` (invece di
  `templaterCreateNote`/`runTemplaterFile`).

**Coda migrata → Templater ritirato (2026-08-20).** Anche gli ultimi 6 script `tp.user`
(`genera`, `world_board`, `importa_mappa`, `importa_azgaar`, `genera_sito`, `sincronizza_pin`)
sono comandi del plugin: usano solo `tp.config` + `tp.system.suggester` (coperti dal tpShim)
e si auto-inseriscono/scrivono via `app` (non dipendono dal ritorno Templater). `_PLUGIN_ACTIONS`
è ora completo → **0 bottoni su `runTemplaterFile`**. `templater-obsidian` → `critico: false`
(come js-engine: fallback per l'opt-out `GDR_PLUGIN_BLOCKS=0`, non più essenziale).

**Stato finale**: il vault di default gira interamente sul plugin `gdr` per creazione,
azioni e display; Templater e js-engine restano bundlati solo come ripiego dell'opt-out.
Plugin critici: dataview, meta-bind, tab-panels, statblocks, dice-roller, initiative-tracker.
Provato dal vivo: creazione («Crea Nota Rapida»), azioni (Collega, Giro del mondo, Genera un
nome via proxy tp.user), display+radar (Korbin), cruscotto DM. 462 test verdi. Branch
`tier-b-plugin` (5 commit), non ancora mergeato in main.
