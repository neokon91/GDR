#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/generated_drafts_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/generated_drafts_cockpit.yaml",
    id: "generated_drafts_cockpit",
    runtimeModule: "z.engine/session_generated_drafts.js",
    runtimeNamespace: "generatedDraftsViews",
    exportLabel: "Smistamento Bozze",
    out: OUT,
    generatedBy: "render_generated_drafts_cockpit",
    expectedQueues: ["draft_queue", "ready_to_link", "unanchored", "destinations", "resolved"],
    missingQueueLabel: "coda Smistamento Bozze mancante",
    errorTitle: "Contratto Smistamento Bozze cockpit non valido:",
    staleMessage: "Contratto Smistamento Bozze non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Smistamento Bozze cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Smistamento Bozze cockpit renderizzato: ${OUT}`
});
