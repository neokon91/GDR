#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/preparation_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/preparation_cockpit.yaml",
    id: "preparation_cockpit",
    runtimeModule: "z.engine/session_preparation.js",
    runtimeNamespace: "preparationViews",
    exportLabel: "Preparazione Sessione",
    out: OUT,
    generatedBy: "render_preparation_cockpit",
    expectedQueues: ["candidate_sessions", "anchors", "missions", "pressures", "people", "encounters", "handouts", "maps"],
    missingQueueLabel: "coda Preparazione mancante",
    errorTitle: "Contratto Preparazione Sessione cockpit non valido:",
    staleMessage: "Contratto Preparazione Sessione non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Preparazione Sessione cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Preparazione Sessione cockpit renderizzato: ${OUT}`
});
