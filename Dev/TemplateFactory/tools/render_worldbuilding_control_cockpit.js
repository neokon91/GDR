#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/worldbuilding_control_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/worldbuilding_control_cockpit.yaml",
    id: "worldbuilding_control_cockpit",
    runtimeModule: "z.engine/session_worldbuilding_control.js",
    runtimeNamespace: "worldbuildingControlViews",
    exportLabel: "Controllo Worldbuilding",
    out: OUT,
    generatedBy: "render_worldbuilding_control_cockpit",
    expectedQueues: ["depth", "connections", "canon", "playability", "player_safe", "ready_unused"],
    missingQueueLabel: "coda audit mancante",
    errorTitle: "Contratto Controllo Worldbuilding cockpit non valido:",
    staleMessage: "Contratto Controllo Worldbuilding non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Controllo Worldbuilding cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Controllo Worldbuilding cockpit renderizzato: ${OUT}`
});
