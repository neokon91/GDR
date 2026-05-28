#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/geopolitical_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/geopolitical_cockpit.yaml",
    id: "geopolitical_cockpit",
    runtimeModule: "z.engine/session_geopolitical.js",
    runtimeNamespace: "geopoliticalViews",
    exportLabel: "Geopolitical Dashboard",
    out: OUT,
    generatedBy: "render_geopolitical_cockpit",
    expectedQueues: ["territories", "relations", "borders", "resources", "economic_nodes", "gaps"],
    missingQueueLabel: "coda geopolitica mancante",
    errorTitle: "Contratto Geopolitical Dashboard cockpit non valido:",
    staleMessage: "Contratto Geopolitical Dashboard non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Geopolitical Dashboard cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Geopolitical Dashboard cockpit renderizzato: ${OUT}`
});
