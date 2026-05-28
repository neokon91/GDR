#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/live_table_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/live_table_cockpit.yaml",
    id: "live_table_cockpit",
    runtimeModule: "z.engine/session_live_table.js",
    runtimeNamespace: "liveTableViews",
    exportLabel: "Durante il Gioco",
    out: OUT,
    generatedBy: "render_live_table_cockpit",
    expectedQueues: ["live_notes", "pressures", "people", "materials", "post_bridge"],
    missingQueueLabel: "coda tavolo live mancante",
    errorTitle: "Contratto Durante il Gioco cockpit non valido:",
    staleMessage: "Contratto Durante il Gioco non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Durante il Gioco cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Durante il Gioco cockpit renderizzato: ${OUT}`
});
