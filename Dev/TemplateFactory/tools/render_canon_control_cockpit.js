#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/canon_control_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/canon_control_cockpit.yaml",
    id: "canon_control_cockpit",
    runtimeModule: "z.engine/session_canon_control.js",
    runtimeNamespace: "canonControlViews",
    exportLabel: "Controllo Canone",
    out: OUT,
    generatedBy: "render_canon_control_cockpit",
    expectedQueues: ["truth", "rumors", "contradictions", "provenance", "retcons", "decisions"],
    missingQueueLabel: "coda canone mancante",
    errorTitle: "Contratto Controllo Canone cockpit non valido:",
    staleMessage: "Contratto Controllo Canone non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Controllo Canone cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Controllo Canone cockpit renderizzato: ${OUT}`
});
