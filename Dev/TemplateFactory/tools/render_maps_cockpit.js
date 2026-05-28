#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/maps_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/maps_cockpit.yaml",
    id: "maps_cockpit",
    runtimeModule: "z.engine/session_maps.js",
    runtimeNamespace: "mapViews",
    exportLabel: "mappe",
    out: OUT,
    generatedBy: "render_maps_cockpit",
    moduleViewPattern: view => new RegExp(`function\\s+${view}\\b`),
    extraPageChecks: ({ ctx, page, text }) => {
        if (text.includes("````tabs")) {
            ctx.fail(`${page}: non deve usare tabs inline dopo la migrazione cockpit`);
        }
        if (/dv\.pages\(/.test(text) || /^```dataview\s*$/m.test(text)) {
            ctx.fail(`${page}: contiene ancora query Dataview inline invece di runtime dedicato`);
        }
    },
    baseViewRequirements: [
        {
            view: "atlas_maps",
            requiredFields: ["coordinates"],
            flags: { map_view: true }
        }
    ],
    errorTitle: "Contratto Mappe cockpit non valido:",
    staleMessage: "Contratto Mappe cockpit non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Mappe cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Mappe cockpit renderizzato: ${OUT}`
});
