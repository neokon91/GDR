// Guscio UNICO dei pannelli JS Engine (modulo ESM, caricato con engine.importJs).
// Concentra in un solo posto ciò che prima era ripetuto in ogni blocco js-engine:
//   1. il caricamento CommonJS di views.js (new Function — js-engine importJs usa
//      import() ESM e NON vedrebbe module.exports);
//   2. la risoluzione di dv/page (Dataview API + nota attiva);
//   3. il wrapping engine.markdown.create.
// Così il corpo nota torna a essere UNA riga (loader + chiamata) invece del blocco
// di ~8 righe ripetuto in ogni pannello. Aggiornare views.js o questo file si
// propaga a tutte le note senza ricrearle.
//
// Perché .mjs: questo è ESM (export); views.js resta CommonJS (module.exports),
// condiviso con Templater e valutato qui via new Function. Le due cose non si
// mescolano e l'estensione documenta quale-è-quale.

let _viewsCache = null;

// Carica views.js come CommonJS (cache per-modulo: se importJs riusa il modulo,
// views.js si legge una volta sola). new Function isola lo script in uno scope con
// (module, exports) propri, poi ne restituiamo gli export.
async function loadViews(app) {
  if (_viewsCache) return _viewsCache;
  const src = await app.vault.adapter.read("z.automazioni/views.js");
  const mod = { exports: {} };
  new Function("module", "exports", src)(mod, mod.exports);
  _viewsCache = mod.exports;
  return _viewsCache;
}

// core.json (catalogo) letto una volta sola per sessione: lo riscrive solo
// render.py a build, quindi è immutabile a runtime. Usato dal radar.
let _coreCache = null;
async function loadCore(app) {
  if (_coreCache) return _coreCache;
  _coreCache = JSON.parse(await app.vault.adapter.read("z.automazioni/data/core.json"));
  return _coreCache;
}

// Dataview API + pagina della nota attiva (null se Dataview assente o nessuna nota).
function dvPage(app) {
  const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
  const file = app.workspace.getActiveFile();
  const page = dv && file ? dv.page(file.path) : null;
  return { dv, page };
}

// Registro dei pannelli: per ogni funzione di views.js, come passarle gli argomenti
// e come trattarne l'output.
//   mode "md"  -> ritorna markdown, reso con engine.markdown.create
//   mode "dom" -> disegna direttamente nel container (nessun valore di ritorno)
// args(app, {dv, page}, container) -> array di argomenti per la funzione.
const PANELS = {
  renderEntityPanel: { mode: "md", args: (a, d) => [d.dv, d.page] },
  renderSessionPanel: { mode: "md", args: (a, d) => [d.dv, d.page] },
  renderProfilo: { mode: "md", args: (a, d) => [a, d.page] },
  renderTemaNatale: { mode: "md", args: (a, d) => [a, d.page] },
  renderProgressione: { mode: "md", args: (a, d) => [a, d.page] },
  renderConnessioni: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderEncounter: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderMap: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderCondizioni: { mode: "md", args: (a) => [a] },
  renderMaestrie: { mode: "md", args: (a) => [a] },
  renderTimeline: { mode: "md", args: (a, d) => [a, d.dv] },
  renderClock: { mode: "dom", args: (a, d, cont) => [cont, a, d.page] },
  renderAxesCompare: { mode: "dom", args: (a, d, cont) => [cont, a, d.dv, d.page] },
};

// Pannello generico. Il corpo nota chiama, in una riga:
//   return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderX");
export async function panel(engine, app, container, name) {
  const spec = PANELS[name];
  if (!spec) throw new Error("Pannello JS Engine sconosciuto: " + name);
  const views = await loadViews(app);
  const out = await views[name](...spec.args(app, dvPage(app), container));
  if (spec.mode === "dom") return; // ha già disegnato nel container
  return engine.markdown.create(out);
}

// Radar degli assi (js-engine): legge i valori-assi dal frontmatter della nota
// attiva e disegna il radar (views.radarMarkdownFromValues). Il param `context`
// resta per compatibilità (variante meta-bind-js-view con context.bound), ma il
// macro grafico_assi ora passa null → si usa il frontmatter. Si ridisegna alla
// riapertura/ri-render della nota. Carica core.json (catalogo assi).
export async function radar(engine, app, category, context) {
  const views = await loadViews(app);
  const core = await loadCore(app);
  let valori = {};
  try {
    valori = context && context.bound ? context.bound : {};
  } catch (e) {}
  if (!Object.values(valori).some((x) => x != null)) {
    const f = app.workspace.getActiveFile();
    valori = f ? (app.metadataCache.getFileCache(f) || {}).frontmatter || {} : {};
  }
  return engine.markdown.create(views.radarMarkdownFromValues(core, category, valori, ""));
}
