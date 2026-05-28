#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/post_session_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/post_session_cockpit.yaml",
    id: "post_session_cockpit",
    runtimeModule: "z.engine/session_post_session.js",
    runtimeNamespace: "postSessionViews",
    exportLabel: "Post Sessione",
    out: OUT,
    generatedBy: "render_post_session_cockpit",
    expectedQueues: ["live_notes", "canon_decisions", "recaps", "consequences", "impacted", "next_session"],
    missingQueueLabel: "coda Post Sessione mancante",
    errorTitle: "Contratto Post Sessione cockpit non valido:",
    staleMessage: "Contratto Post Sessione non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Post Sessione cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Post Sessione cockpit renderizzato: ${OUT}`
});
