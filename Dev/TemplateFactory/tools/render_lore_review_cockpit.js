#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/lore_review_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/lore_review_cockpit.yaml",
    id: "lore_review_cockpit",
    runtimeModule: "z.engine/session_lore_review.js",
    runtimeNamespace: "loreReviewViews",
    exportLabel: "Revisione Lore",
    out: OUT,
    generatedBy: "render_lore_review_cockpit",
    expectedQueues: ["completion", "playability", "anchors", "mysteries", "history", "pressures"],
    missingQueueLabel: "coda Revisione Lore mancante",
    errorTitle: "Contratto Revisione Lore cockpit non valido:",
    staleMessage: "Contratto Revisione Lore non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Revisione Lore cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Revisione Lore cockpit renderizzato: ${OUT}`
});
