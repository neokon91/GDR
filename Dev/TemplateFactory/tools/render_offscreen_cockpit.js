#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/offscreen_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/offscreen_cockpit.yaml",
    id: "offscreen_cockpit",
    runtimeModule: "z.engine/session_offscreen.js",
    runtimeNamespace: "offscreenViews",
    exportLabel: "Cosa Succede Fuori Scena",
    out: OUT,
    generatedBy: "render_offscreen_cockpit",
    expectedQueues: ["actors", "clocks", "consequences", "secrets", "bridge"],
    missingQueueLabel: "coda fuori scena mancante",
    errorTitle: "Contratto Cosa Succede Fuori Scena cockpit non valido:",
    staleMessage: "Contratto Cosa Succede Fuori Scena non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Cosa Succede Fuori Scena cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Cosa Succede Fuori Scena cockpit renderizzato: ${OUT}`
});
