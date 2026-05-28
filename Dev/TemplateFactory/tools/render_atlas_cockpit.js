#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/atlas_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/atlas_cockpit.yaml",
    id: "atlas_cockpit",
    runtimeModule: "z.engine/session_atlas.js",
    runtimeNamespace: "atlasViews",
    exportLabel: "atlas",
    out: OUT,
    generatedBy: "render_atlas_cockpit",
    moduleViewPattern: view => new RegExp(`function\\s+${view}\\b`),
    baseViewRequirements: [
        {
            view: "atlas_maps",
            requiredFields: ["coordinates"],
            flags: { map_view: true }
        }
    ],
    errorTitle: "Contratto Atlante cockpit non valido:",
    staleMessage: "Contratto Atlante cockpit non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Atlante cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Atlante cockpit renderizzato: ${OUT}`
});
