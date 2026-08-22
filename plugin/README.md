# Plugin GDR — Console DM & Motore

Il **runtime del vault** GDR (plugin Obsidian nativo, TS + esbuild). Riusa
`z.automazioni/views.js` e `meta_actions.js` **senza modificarli** (li carica come
CommonJS) e importa la mappa pannelli da `../Dev/Source/JS/_panels.mjs`.

È l'**unica** via: js-engine e Templater sono stati ritirati.

## Cosa fa
1. **Blocco ` ```gdr <renderX> `** (+ ` radar <cat> `) — al posto del vecchio `js-engine`:
   `registerMarkdownCodeBlockProcessor`, re-render **reattivo** sui cambi di frontmatter
   (`metadataCache 'changed'`) e sull'index-ready di Dataview.
2. **Azioni del dispatcher come comandi nativi** `gdr:<azione>` (hotkey + ribbon), con
   modali native (`SuggestModal`/`Modal`) al posto di `tp.system.suggester`/`prompt`.
3. **Creazione senza Templater**: il mini-motore `createFromTemplate` esegue `crea_pg.js`
   (PG) o `create_entity.js` (entità) col `tpShim`, poi compone frontmatter + corpo del
   template. Un comando `gdr:crea-<id>` per template + un picker generico.
4. **Cruscotto DM (`ItemView`)**: dashboard a piena pagina (Party, Combattimento, Tiri
   rapidi, Data del mondo via Calendarium, Stato del mondo) + tab Impostazioni + status bar.
   Apri col comando «Apri il Cruscotto DM» o l'icona ribbon.
5. **Board di combattimento + motore (`ItemView` `gdr-board`)**: tracker pilotato dal motore
   event-sourced di `regole` (bundlato via il symlink `../regole`), con **statblock nativo**
   (`renderStatblock` + blocco ```gdr statblock`) e **condizioni "vere"** (gli effetti modificano
   i tiri via `risolviCondizioni`). Adapter `daMostro`/`daPgGdr`. Dataset **sidecar** in
   `plugin/data/` (bestiario, condizioni) generati da archivio. → dettagli in
   [../docs/combat_engine.md](../docs/combat_engine.md). Ha **sostituito** Fantasy Statblocks +
   Initiative Tracker (ritirati: nessun plugin di terze parti per il combattimento).

## Build e installazione
```bash
cd plugin
npm install
node esbuild.config.mjs --prod   # → main.js (CJS, `obsidian` esterno)  [oppure: npm run build:plugin dalla root]
```
`render.py` (build del vault) chiama `install_authored_plugins`, che copia
`main.js`/`manifest.json`/`styles.css` **e la cartella `plugin/data/`** (sidecar bestiario/
condizioni) in `dist/GDR-vault/.obsidian/plugins/gdr/` e abilita **gdr**.

**Dipendenze esterne**: esbuild bundla il motore dal symlink gitignorato `../regole` (catena
TS pura); i sidecar `plugin/data/*.json` sono generati da `../archivio` via
`gen:bestiario`/`gen:condizioni` (parte di `npm run build`). Un checkout senza i symlink
`regole`/`archivio` non builda i sidecar né il motore. In `plugins.yaml` il plugin è dichiarato **critico autoriale** (`autoriale: true`):
esente dal pin `repo`+`version` del turnkey (non si fetcha), ma il gate `fetch_plugins --check`
esige che sia **presente** nel vault prima dello zip.

## Tipi generati
`core.d.ts` è **generato** dal modello (`npm run gen:types` → `Dev/Tools/gen_plugin_types.py`):
vocabolari chiusi (`Categoria`/`Stato`/`PanelName`/`TemplateId`/`AzioneId`) + la shape di
`core.json` (`CoreData`). `main.ts` li importa (solo `import type`, esbuild li strippa). NON
si tipizzano le entità di dominio (creatura/oggetto…): quello è dato YAML, validato a runtime
— un'interfaccia a mano deriverebbe (come dimostra la deriva fra vocabolari scritti a mano e
lo YAML). `npm run build` fa `gen:types → gen:bestiario → gen:condizioni → typecheck
(tsc --noEmit) → esbuild`.

## Anti-drift
`_panels.mjs` è la sorgente UNICA della mappa pannelli (niente copie). Verificati dai test
Python: la parità `_PLUGIN_ACTIONS` (model_cfg) ↔ lista `ACTIONS` di `main.ts` e ogni
pannello-macro registrato (`test_panels_registered`, `test_buttons_map_to_plugin_commands`);
e `core.d.ts` allineato al modello (`test_plugin_types`).
