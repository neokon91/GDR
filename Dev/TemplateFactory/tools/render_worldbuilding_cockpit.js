#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/worldbuilding_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/worldbuilding_cockpit.yaml",
    id: "worldbuilding_cockpit",
    bridgeOnly: true,
    exportLabel: "Worldbuilder",
    out: OUT,
    generatedBy: "render_worldbuilding_cockpit",
    errorTitle: "Contratto Worldbuilder cockpit non valido:",
    staleMessage: "Contratto Worldbuilder cockpit non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Worldbuilder cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Worldbuilder cockpit renderizzato: ${OUT}`
});
