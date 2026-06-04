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
  renderRisorsePG: { mode: "md", args: (a, d) => [d.page] },
  renderSpecieTratti: { mode: "md", args: (a, d) => [a, d.page] },
  renderIncantesimi: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderConnessioni: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderEncounter: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderVerificaGS: { mode: "md", args: (a, d) => [a, d.page] },
  renderMap: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderDintorni: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderViaggio: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderPressioni: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderCausalita: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderCondizioni: { mode: "md", args: (a) => [a] },
  renderMaestrie: { mode: "md", args: (a) => [a] },
  renderAttacchi: { mode: "md", args: (a, d) => [a, d.page] },
  renderAlbero: { mode: "md", args: (a, d) => [a, d.page] },
  renderCoerenza: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderTappe: { mode: "md", args: (a, d) => [a, d.page] },
  renderTipoProfilo: { mode: "md", args: (a, d) => [a, d.page] },
  renderStatoMondo: { mode: "md", args: (a, d) => [a, d.dv] },
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

// Radar degli assi (js-engine), REATTIVO: legge i valori-assi dal frontmatter della
// nota attiva e si RIDISEGNA live quando uno slider Meta Bind cambia il frontmatter,
// senza riaprire la nota. Meccanismo: engine.reactive (ReactiveComponent) ridisegnato
// da un listener metadataCache 'changed', registrato sul `component` del blocco
// (auto-deregistrato all'unload → niente leak / handler duplicati). Se engine.reactive
// non c'è (versioni vecchie), degrada a un render statico. Carica core.json (catalogo).
export async function radar(engine, app, category, component) {
  const views = await loadViews(app);
  const core = await loadCore(app);
  const file = app.workspace.getActiveFile();
  const valoriDi = () => {
    const f = app.workspace.getActiveFile() || file;
    return f ? (app.metadataCache.getFileCache(f) || {}).frontmatter || {} : {};
  };
  const draw = (valori) =>
    engine.markdown.create(views.radarMarkdownFromValues(core, category, valori, ""));
  if (!engine.reactive) return draw(valoriDi()); // fallback statico
  const reactive = engine.reactive(draw, valoriDi());
  if (component && file) {
    component.registerEvent(
      app.metadataCache.on("changed", (changed) => {
        if (changed && changed.path === file.path) reactive.refresh(valoriDi());
      })
    );
  }
  return reactive;
}
