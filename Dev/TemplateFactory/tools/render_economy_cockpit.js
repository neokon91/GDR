#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/economy_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/economy_cockpit.yaml",
    id: "economy_cockpit",
    runtimeModule: "z.engine/session_economy.js",
    runtimeNamespace: "economyViews",
    exportLabel: "Economia E Rotte",
    out: OUT,
    generatedBy: "render_economy_cockpit",
    expectedQueues: ["routes", "resources", "markets", "controllers", "dependencies", "unpropagated", "gaps"],
    missingQueueLabel: "coda economia mancante",
    errorTitle: "Contratto Economia E Rotte cockpit non valido:",
    staleMessage: "Contratto Economia E Rotte non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Economia E Rotte cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Economia E Rotte cockpit renderizzato: ${OUT}`
});
