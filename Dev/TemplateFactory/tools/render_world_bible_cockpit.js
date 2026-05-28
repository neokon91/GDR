#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/world_bible_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/world_bible_cockpit.yaml",
    id: "world_bible_cockpit",
    runtimeModule: "z.engine/session_world_bible.js",
    runtimeNamespace: "worldBibleViews",
    exportLabel: "Bibbia del Mondo",
    out: OUT,
    generatedBy: "render_world_bible_cockpit",
    expectedQueues: ["world_identity", "article_gaps", "public_safety", "playable_gaps"],
    missingQueueLabel: "coda Bibbia del Mondo mancante",
    errorTitle: "Contratto Bibbia del Mondo cockpit non valido:",
    staleMessage: "Contratto Bibbia del Mondo non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Bibbia del Mondo cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Bibbia del Mondo cockpit renderizzato: ${OUT}`
});
