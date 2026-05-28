#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/dm_dashboard_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/dm_dashboard_cockpit.yaml",
    id: "dm_dashboard_cockpit",
    runtimeModule: "z.engine/session_dm_dashboard.js",
    runtimeNamespace: "dmDashboardViews",
    exportLabel: "DM Dashboard",
    out: OUT,
    generatedBy: "render_dm_dashboard_cockpit",
    expectedQueues: ["sessions", "pressures", "materials", "inbox"],
    missingQueueLabel: "coda DM Dashboard mancante",
    errorTitle: "Contratto DM Dashboard cockpit non valido:",
    staleMessage: "Contratto DM Dashboard non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `DM Dashboard cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `DM Dashboard cockpit renderizzato: ${OUT}`
});
