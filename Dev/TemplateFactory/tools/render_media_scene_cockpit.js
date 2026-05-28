#!/usr/bin/env node

const { runStandardCockpitRenderer, validateObjectList } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/media_scene_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/media_scene_cockpit.yaml",
    id: "media_scene_cockpit",
    runtimeModule: "z.engine/session_media_scene.js",
    runtimeNamespace: "mediaSceneViews",
    exportLabel: "media scene",
    out: OUT,
    generatedBy: "render_media_scene_cockpit",
    moduleViewPattern: view => new RegExp(`function\\s+${view}\\b`),
    extraPageChecks: ({ ctx, page, text }) => {
        if (text.includes("````tabs")) {
            ctx.fail(`${page}: non deve usare tabs inline dopo la migrazione cockpit`);
        }
        if (/dv\.pages\(/.test(text) || /^```dataview\s*$/m.test(text)) {
            ctx.fail(`${page}: contiene ancora query Dataview inline invece di runtime dedicato`);
        }
        if (text.split(/\r?\n/).length > 95) {
            ctx.fail(`${page}: superficie troppo lunga per un cockpit media compatto`);
        }
    },
    afterQueuesPayload: ({ ctx, contract }) => ({
        patterns: validateObjectList(ctx, contract.patterns, "patterns", ["label", "example", "use_when"])
    }),
    generatedRoots: ["z.bases", "z.fileclass", "z.automazioni/data/runtime"],
    errorTitle: "Contratto Media Scene cockpit non valido:",
    staleMessage: "Contratto Media Scene cockpit non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Media Scene cockpit OK: ${payload.queues.length} code e ${payload.surfaces.length} superfici verificate.`,
    renderMessage: `Generato ${OUT}`
});
