#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/lore_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/lore_cockpit.yaml",
    id: "lore_cockpit",
    runtimeModule: "z.engine/session_lore.js",
    runtimeNamespace: "loreViews",
    exportLabel: "Lore Hub",
    out: OUT,
    generatedBy: "render_lore_cockpit",
    expectedQueues: ["signals", "canon_decisions", "mysteries", "history", "cultures", "powers", "maps", "materials"],
    missingQueueLabel: "coda lore mancante",
    errorTitle: "Contratto Lore Hub cockpit non valido:",
    staleMessage: "Contratto Lore Hub non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Lore Hub cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Lore Hub cockpit renderizzato: ${OUT}`
});
