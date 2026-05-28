#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/table_materials_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/table_materials_cockpit.yaml",
    id: "table_materials_cockpit",
    runtimeModule: "z.engine/session_table_materials.js",
    runtimeNamespace: "tableMaterialsViews",
    exportLabel: "Materiali al Tavolo",
    out: OUT,
    generatedBy: "render_table_materials_cockpit",
    expectedQueues: ["session_materials", "handouts", "objects", "encounters", "creatures", "maps_media"],
    missingQueueLabel: "coda Materiali al Tavolo mancante",
    errorTitle: "Contratto Materiali al Tavolo cockpit non valido:",
    staleMessage: "Contratto Materiali al Tavolo non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Materiali al Tavolo cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Materiali al Tavolo cockpit renderizzato: ${OUT}`
});
