#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/living_world_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/living_world_cockpit.yaml",
    id: "living_world_cockpit",
    runtimeModule: "z.engine/session_living_world.js",
    runtimeNamespace: "livingWorldViews",
    exportLabel: "Motore Mondo Vivo",
    out: OUT,
    generatedBy: "render_living_world_cockpit",
    expectedQueues: ["continuity", "targets", "closable", "gaps", "powers", "economy", "history", "public_canon"],
    missingQueueLabel: "coda mondo vivo mancante",
    errorTitle: "Contratto Motore Mondo Vivo cockpit non valido:",
    staleMessage: "Contratto Motore Mondo Vivo non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Motore Mondo Vivo cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Motore Mondo Vivo cockpit renderizzato: ${OUT}`
});
