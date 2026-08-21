// Registro dei pannelli-vista: SORGENTE UNICA della mappa pannelli.
// Per ogni funzione di views.js dice come passarle gli argomenti e come trattarne
// l'output:
//   mode "md"  -> ritorna markdown (il plugin lo rende con MarkdownRenderer)
//   mode "dom" -> disegna direttamente nel container (nessun valore di ritorno)
//   args(app, {dv, page}, container) -> array di argomenti per la funzione.
//
// Importato (via esbuild, tree-shaken) dal plugin `gdr`, che è l'UNICO runtime dei
// blocchi ```gdr. Il prefisso `_` lo tiene fuori dal vault (non è uno script runtime:
// nessuno lo legge con adapter.read). Il test `test_panels_registered` lo incrocia con
// le macro Jinja e con gli export di views.js per intercettare drift.
//
// (Ex `boot.mjs`: il guscio js-engine — loadViews/panel/radar — è stato ritirato con il
//  fallback js-engine/Templater; è rimasta solo questa mappa, che il plugin consuma.)
export const PANELS = {
  renderDiagnostica: { mode: "md", args: (a) => [a] },
  renderEntityPanel: { mode: "md", args: (a, d) => [d.dv, d.page] },
  renderSessionPanel: { mode: "md", args: (a, d) => [d.dv, d.page] },
  renderProfilo: { mode: "md", args: (a, d) => [a, d.page] },
  renderTemaNatale: { mode: "md", args: (a, d) => [a, d.page] },
  renderProgressione: { mode: "md", args: (a, d) => [a, d.page] },
  renderFiloAvventura: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderTabella: { mode: "md", args: (a, d) => [a, d.page] },
  renderRisorsePG: { mode: "md", args: (a, d) => [d.page] },
  renderSpecieTratti: { mode: "md", args: (a, d) => [a, d.page] },
  renderIncantesimi: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderConnessioni: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderEncounter: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderVerificaGS: { mode: "md", args: (a, d) => [a, d.page] },
  renderMap: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderWorldMap: { mode: "md", args: (a, d) => [a, d.dv] },
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
  renderProiezione: { mode: "md", args: (a, d) => [a, d.dv] },
  renderTensioni: { mode: "md", args: (a, d) => [a, d.dv] },
  renderMemoria: { mode: "md", args: (a, d) => [a, d.dv, d.page] },
  renderTimeline: { mode: "md", args: (a, d) => [a, d.dv] },
  renderTimelineCorsie: { mode: "md", args: (a, d) => [a, d.dv] },
  renderClock: { mode: "dom", args: (a, d, cont) => [cont, a, d.page] },
  renderAxesCompare: { mode: "dom", args: (a, d, cont) => [cont, a, d.dv, d.page] },
};
