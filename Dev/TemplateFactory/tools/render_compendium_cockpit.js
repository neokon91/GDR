#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/compendium_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/compendium_cockpit.yaml",
    id: "compendium_cockpit",
    runtimeModule: "z.engine/session_compendium.js",
    runtimeNamespace: "compendiumViews",
    exportLabel: "Compendium",
    out: OUT,
    generatedBy: "render_compendium_cockpit",
    expectedQueues: ["archive", "without_use", "open_gaps", "history_links", "pressure", "map_links"],
    missingQueueLabel: "coda Compendium mancante",
    errorTitle: "Contratto Compendium cockpit non valido:",
    staleMessage: "Contratto Compendium non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Compendium cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Compendium cockpit renderizzato: ${OUT}`
});
